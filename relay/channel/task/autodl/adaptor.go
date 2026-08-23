package autodl

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	taskdto "github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/relay/channel"
	taskcommon "github.com/QuantumNous/new-api/relay/channel/task/taskcommon"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/QuantumNous/new-api/service"
	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
)

type TaskAdaptor struct {
	taskcommon.BaseBilling
	apiKey  string
	baseURL string
}

func (a *TaskAdaptor) Init(info *relaycommon.RelayInfo) {
	a.apiKey = info.ApiKey
	a.baseURL = info.ChannelBaseUrl
	if strings.TrimSpace(a.baseURL) == "" {
		a.baseURL = DefaultBaseURL
	}
}

func (a *TaskAdaptor) ValidateRequestAndSetAction(c *gin.Context, info *relaycommon.RelayInfo) *taskdto.TaskError {
	if taskErr := relaycommon.ValidateBasicTaskRequest(c, info, constant.TaskActionGenerate); taskErr != nil {
		return taskErr
	}

	req, err := relaycommon.GetTaskRequest(c)
	if err != nil {
		return service.TaskErrorWrapperLocal(err, "invalid_request", http.StatusBadRequest)
	}
	config, ok := workflowConfigs[req.Model]
	if !ok {
		return service.TaskErrorWrapperLocal(fmt.Errorf("unsupported AutoDL workflow: %s", req.Model), "unsupported_workflow", http.StatusBadRequest)
	}

	duration := req.Duration
	if duration == 0 {
		duration = defaultDurationSeconds
	}
	if duration < 1 || duration > config.maxDuration {
		return service.TaskErrorWrapperLocal(fmt.Errorf("duration must be between 1 and %d seconds", config.maxDuration), "invalid_duration", http.StatusBadRequest)
	}

	resolution := resolutionFromRequest(req)
	if _, ok := config.resolutionRatios[resolution]; !ok {
		return service.TaskErrorWrapperLocal(fmt.Errorf("resolution %s is not supported by workflow %s", resolution, req.Model), "invalid_resolution", http.StatusBadRequest)
	}

	if config.requiresRefImage && strings.TrimSpace(referenceImage(req)) == "" {
		return service.TaskErrorWrapperLocal(fmt.Errorf("ref_image_0 is required"), "invalid_request", http.StatusBadRequest)
	}
	if config.requiresFrames {
		firstFrame, lastFrame := frameInputs(req)
		if strings.TrimSpace(firstFrame) == "" || strings.TrimSpace(lastFrame) == "" {
			return service.TaskErrorWrapperLocal(fmt.Errorf("first_frame and last_frame are required"), "invalid_request", http.StatusBadRequest)
		}
	}
	return nil
}

func (a *TaskAdaptor) BuildRequestURL(info *relaycommon.RelayInfo) (string, error) {
	if _, ok := workflowConfigs[info.UpstreamModelName]; !ok {
		return "", fmt.Errorf("unsupported AutoDL workflow: %s", info.UpstreamModelName)
	}
	return fmt.Sprintf("%s/comfyui_workflow/%s", normalizeBaseURL(a.baseURL), info.UpstreamModelName), nil
}

func (a *TaskAdaptor) BuildRequestHeader(_ *gin.Context, req *http.Request, _ *relaycommon.RelayInfo) error {
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", a.apiKey)
	return nil
}

func (a *TaskAdaptor) BuildRequestBody(c *gin.Context, info *relaycommon.RelayInfo) (io.Reader, error) {
	req, err := relaycommon.GetTaskRequest(c)
	if err != nil {
		return nil, err
	}
	payload, err := convertRequest(req, info.UpstreamModelName)
	if err != nil {
		return nil, errors.Wrap(err, "convert AutoDL request payload failed")
	}
	data, err := common.Marshal(payload)
	if err != nil {
		return nil, err
	}
	return bytes.NewReader(data), nil
}

func (a *TaskAdaptor) DoRequest(c *gin.Context, info *relaycommon.RelayInfo, requestBody io.Reader) (*http.Response, error) {
	return channel.DoTaskApiRequest(a, c, info, requestBody)
}

func (a *TaskAdaptor) DoResponse(c *gin.Context, resp *http.Response, info *relaycommon.RelayInfo) (taskID string, taskData []byte, taskErr *taskdto.TaskError) {
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", nil, service.TaskErrorWrapper(err, "read_response_body_failed", http.StatusInternalServerError)
	}
	_ = resp.Body.Close()

	var result submitResponse
	if err := common.Unmarshal(responseBody, &result); err != nil {
		return "", nil, service.TaskErrorWrapper(err, "unmarshal_response_body_failed", http.StatusInternalServerError)
	}
	if result.Code != "Success" || result.Data.TaskID == "" {
		return "", nil, service.TaskErrorWrapper(fmt.Errorf("AutoDL submit failed: %s", result.message()), "upstream_error", http.StatusBadGateway)
	}

	video := dto.NewOpenAIVideo()
	video.ID = info.PublicTaskID
	video.TaskID = info.PublicTaskID
	video.Model = info.OriginModelName
	video.CreatedAt = time.Now().Unix()
	c.JSON(http.StatusOK, video)
	return result.Data.TaskID, responseBody, nil
}

func (a *TaskAdaptor) FetchTask(baseURL, key string, body map[string]any, proxy string) (*http.Response, error) {
	taskID, ok := body["task_id"].(string)
	if !ok || strings.TrimSpace(taskID) == "" {
		return nil, fmt.Errorf("invalid task_id")
	}

	requestURL := fmt.Sprintf("%s/comfyui_workflow/result/%s", normalizeBaseURL(baseURL), taskID)
	req, err := http.NewRequest(http.MethodGet, requestURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", key)

	client, err := service.GetHttpClientWithProxy(proxy)
	if err != nil {
		return nil, fmt.Errorf("new proxy http client failed: %w", err)
	}
	return client.Do(req)
}

func (a *TaskAdaptor) ParseTaskResult(respBody []byte) (*relaycommon.TaskInfo, error) {
	var result taskResultResponse
	if err := common.Unmarshal(respBody, &result); err != nil {
		return nil, errors.Wrap(err, "unmarshal AutoDL task result failed")
	}

	taskInfo := &relaycommon.TaskInfo{TaskID: result.Data.TaskID, Progress: "20%"}
	switch strings.ToUpper(result.Data.Status) {
	case "QUEUED":
		taskInfo.Status = model.TaskStatusInProgress
	case "RUNNING":
		taskInfo.Status = model.TaskStatusInProgress
		taskInfo.Progress = "50%"
	case "SUCCESS", "COMPLETED":
		taskInfo.Status = model.TaskStatusSuccess
		taskInfo.Progress = "100%"
		for _, item := range result.Data.Results {
			if item.Type == "video" && item.URL != "" {
				taskInfo.Url = item.URL
				break
			}
		}
	case "FAILED", "FAILURE", "ERROR":
		taskInfo.Status = model.TaskStatusFailure
		taskInfo.Progress = "100%"
		taskInfo.Reason = result.Data.Error
	default:
		taskInfo.Status = model.TaskStatusInProgress
	}
	return taskInfo, nil
}

func (a *TaskAdaptor) GetModelList() []string {
	return ModelList
}

func (a *TaskAdaptor) GetChannelName() string {
	return ChannelName
}

func (a *TaskAdaptor) EstimateBilling(c *gin.Context, info *relaycommon.RelayInfo) map[string]float64 {
	config, ok := workflowConfigs[info.UpstreamModelName]
	if !ok {
		return nil
	}
	req, err := relaycommon.GetTaskRequest(c)
	if err != nil {
		return nil
	}
	duration := req.Duration
	if duration == 0 {
		duration = defaultDurationSeconds
	}

	resolution := resolutionFromRequest(req)
	resolutionRatio := config.resolutionRatios[resolution]
	return map[string]float64{
		"seconds":         float64(duration),
		"resolution":      resolutionRatio,
		"cost_multiplier": autoDLVideoCostMultiplier,
	}
}

func (a *TaskAdaptor) ConvertToOpenAIVideo(task *model.Task) ([]byte, error) {
	return common.Marshal(task.ToOpenAIVideo())
}

type videoRequest struct {
	Seed          *int   `json:"seed,omitempty"`
	Prompt        string `json:"prompt"`
	Duration      int    `json:"duration"`
	AudioDuration *int   `json:"audio_duration,omitempty"`
	Resolution    string `json:"resolution"`
	FirstFrame    string `json:"first_frame,omitempty"`
	LastFrame     string `json:"last_frame,omitempty"`
	RefAudio0     string `json:"ref_audio_0,omitempty"`
	RefAudio1     string `json:"ref_audio_1,omitempty"`
	RefAudio2     string `json:"ref_audio_2,omitempty"`
	RefImage0     string `json:"ref_image_0,omitempty"`
	RefImage1     string `json:"ref_image_1,omitempty"`
	RefImage2     string `json:"ref_image_2,omitempty"`
	RefImage3     string `json:"ref_image_3,omitempty"`
	RefImage4     string `json:"ref_image_4,omitempty"`
	RefImage5     string `json:"ref_image_5,omitempty"`
	RefImage6     string `json:"ref_image_6,omitempty"`
	RefImage7     string `json:"ref_image_7,omitempty"`
	RefImage8     string `json:"ref_image_8,omitempty"`
}

type submitResponse struct {
	Code string `json:"code"`
	Msg  string `json:"msg"`
	Data struct {
		TaskID string `json:"task_id"`
	} `json:"data"`
}

func (r submitResponse) message() string {
	if r.Msg != "" {
		return r.Msg
	}
	return r.Code
}

type taskResultResponse struct {
	Data struct {
		TaskID  string `json:"task_id"`
		Status  string `json:"status"`
		Error   string `json:"message"`
		Results []struct {
			URL  string `json:"url"`
			Type string `json:"type"`
		} `json:"results"`
	} `json:"data"`
}

func convertRequest(req relaycommon.TaskSubmitReq, workflow string) (*videoRequest, error) {
	if _, ok := workflowConfigs[workflow]; !ok {
		return nil, fmt.Errorf("unsupported AutoDL workflow: %s", workflow)
	}

	payload := &videoRequest{}
	if err := req.UnmarshalMetadata(payload); err != nil {
		return nil, err
	}
	duration := req.Duration
	if duration == 0 {
		duration = defaultDurationSeconds
	}
	payload.Prompt = req.Prompt
	payload.Duration = duration
	payload.Resolution = resolutionFromRequest(req)
	if req.Seed != nil {
		payload.Seed = req.Seed
	}
	if req.AudioDuration > 0 {
		payload.AudioDuration = common.GetPointer(req.AudioDuration)
	}
	if req.FirstFrame != "" {
		payload.FirstFrame = req.FirstFrame
	}
	if req.LastFrame != "" {
		payload.LastFrame = req.LastFrame
	}

	refs := []*string{
		&payload.RefImage0,
		&payload.RefImage1,
		&payload.RefImage2,
		&payload.RefImage3,
		&payload.RefImage4,
		&payload.RefImage5,
		&payload.RefImage6,
		&payload.RefImage7,
		&payload.RefImage8,
	}
	for i, image := range req.Images {
		if i >= len(refs) {
			break
		}
		*refs[i] = image
	}
	return payload, nil
}

func resolutionFromRequest(req relaycommon.TaskSubmitReq) string {
	if req.Size != "" {
		return req.Size
	}
	if resolution, ok := req.Metadata["resolution"].(string); ok && resolution != "" {
		return resolution
	}
	return defaultResolution
}

func referenceImage(req relaycommon.TaskSubmitReq) string {
	if len(req.Images) > 0 {
		return req.Images[0]
	}
	image, _ := req.Metadata["ref_image_0"].(string)
	return image
}

func frameInputs(req relaycommon.TaskSubmitReq) (string, string) {
	firstFrame := req.FirstFrame
	lastFrame := req.LastFrame
	if firstFrame == "" {
		firstFrame, _ = req.Metadata["first_frame"].(string)
	}
	if lastFrame == "" {
		lastFrame, _ = req.Metadata["last_frame"].(string)
	}
	return firstFrame, lastFrame
}

func normalizeBaseURL(baseURL string) string {
	baseURL = strings.TrimRight(strings.TrimSpace(baseURL), "/")
	if baseURL == "" {
		baseURL = DefaultBaseURL
	}
	if strings.HasSuffix(baseURL, "/api/v1/comfyui") {
		return baseURL
	}
	if strings.HasSuffix(baseURL, "/api/v1") {
		return baseURL + "/comfyui"
	}
	return baseURL + "/api/v1/comfyui"
}
