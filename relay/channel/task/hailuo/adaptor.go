package hailuo

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"

	"github.com/QuantumNous/new-api/constant"
	taskdto "github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/relay/channel"
	taskcommon "github.com/QuantumNous/new-api/relay/channel/task/taskcommon"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/QuantumNous/new-api/service"
)

// https://platform.minimaxi.com/docs/api-reference/video-generation-intro
type TaskAdaptor struct {
	taskcommon.BaseBilling
	ChannelType int
	apiKey      string
	baseURL     string
	autoDL      bool
}

func (a *TaskAdaptor) Init(info *relaycommon.RelayInfo) {
	a.ChannelType = info.ChannelType
	a.baseURL = info.ChannelBaseUrl
	a.apiKey = info.ApiKey
	// AutoDL exposes MiniMax/ComfyUI workflows through the same channel slot
	// used by the MiniMax video channel. Workflow model IDs are prefixed with
	// "minimax_" and the endpoint is rooted at /api/v1/comfyui.
	a.autoDL = strings.Contains(strings.ToLower(a.baseURL), "autodl.art") ||
		strings.HasPrefix(strings.ToLower(info.UpstreamModelName), "minimax_")
}

func (a *TaskAdaptor) ValidateRequestAndSetAction(c *gin.Context, info *relaycommon.RelayInfo) (taskErr *taskdto.TaskError) {
	if taskErr = relaycommon.ValidateBasicTaskRequest(c, info, constant.TaskActionGenerate); taskErr != nil {
		return taskErr
	}
	if !a.autoDL {
		return nil
	}
	req, err := relaycommon.GetTaskRequest(c)
	if err != nil {
		return service.TaskErrorWrapper(err, "invalid_request", http.StatusBadRequest)
	}
	if req.Model != "minimax_h3_image_audio_to_video_v2_15s" && req.Model != "minimax_h3_image_audio_to_video_v2" && req.Model != "minimax_h3_lightx2v_v5_15s" && req.Model != "minimax_h3_lightx2v" && req.Model != "minimax_h3_lightx2v_no_pic" && req.Model != "minimax_h3_image_audio_to_video" && req.Model != "minimax_h3_lightx2v_v5" {
		return nil
	}
	duration := req.Duration
	if duration == 0 {
		duration = 5
	}
	if duration < 1 || duration > 15 {
		if (req.Model == "minimax_h3_lightx2v_v5" || req.Model == "minimax_h3_image_audio_to_video_v2") && duration <= 10 {
			// This workflow has a stricter 10-second maximum; handled below.
		} else {
			return service.TaskErrorWrapperLocal(fmt.Errorf("duration must be between 1 and 15 seconds"), "invalid_duration", http.StatusBadRequest)
		}
	}
	if (req.Model == "minimax_h3_lightx2v_v5" || req.Model == "minimax_h3_image_audio_to_video_v2") && duration > 10 {
		return service.TaskErrorWrapperLocal(fmt.Errorf("duration must be between 1 and 10 seconds"), "invalid_duration", http.StatusBadRequest)
	}
	resolution := autodlResolution(req, "768p竖")
	validResolutions := map[string]bool{
		"480p竖": true, "768p竖": true, "480p横": true, "768p横": true,
		"480p(1:1)": true, "768p(1:1)": true,
		"1080p竖": true, "1080p横": true,
		"1080p(1:1)": true,
	}
	if !validResolutions[resolution] {
		return service.TaskErrorWrapperLocal(fmt.Errorf("invalid resolution"), "invalid_resolution", http.StatusBadRequest)
	}
	if req.Model == "minimax_h3_lightx2v_v5_15s" && len(req.Images) == 0 {
		refImage0, _ := req.Metadata["ref_image_0"].(string)
		if strings.TrimSpace(refImage0) == "" {
			return service.TaskErrorWrapperLocal(fmt.Errorf("ref_image_0 is required"), "invalid_request", http.StatusBadRequest)
		}
	}
	if req.Model == "minimax_h3_lightx2v_v5" && len(req.Images) == 0 {
		refImage0 := ""
		if req.Metadata != nil {
			refImage0, _ = req.Metadata["ref_image_0"].(string)
		}
		if strings.TrimSpace(refImage0) == "" {
			return service.TaskErrorWrapperLocal(fmt.Errorf("ref_image_0 is required"), "invalid_request", http.StatusBadRequest)
		}
	}
	if req.Model == "minimax_h3_lightx2v" {
		firstFrame, lastFrame := req.FirstFrame, req.LastFrame
		if req.Metadata != nil {
			if v, ok := req.Metadata["first_frame"].(string); ok && firstFrame == "" {
				firstFrame = v
			}
			if v, ok := req.Metadata["last_frame"].(string); ok && lastFrame == "" {
				lastFrame = v
			}
		}
		if strings.TrimSpace(firstFrame) == "" || strings.TrimSpace(lastFrame) == "" {
			return service.TaskErrorWrapperLocal(fmt.Errorf("first_frame and last_frame are required"), "invalid_request", http.StatusBadRequest)
		}
	}
	if req.Model == "minimax_h3_image_audio_to_video" {
		image, audio := "", ""
		if req.Metadata != nil {
			image, _ = req.Metadata["ref_image_0"].(string)
			audio, _ = req.Metadata["ref_audio_0"].(string)
		}
		if image == "" && len(req.Images) > 0 {
			image = req.Images[0]
		}
		if strings.TrimSpace(image) == "" || strings.TrimSpace(audio) == "" {
			return service.TaskErrorWrapperLocal(fmt.Errorf("ref_image_0 and ref_audio_0 are required"), "invalid_request", http.StatusBadRequest)
		}
		d := req.AudioDuration
		if v, ok := req.Metadata["audio_duration"].(float64); ok && d == 0 {
			d = int(v)
		}
		if d == 0 {
			d = 5
		}
		if d < 1 || d > 15 {
			return service.TaskErrorWrapperLocal(fmt.Errorf("audio_duration must be between 1 and 15 seconds"), "invalid_duration", http.StatusBadRequest)
		}
	}
	return nil
}

func (a *TaskAdaptor) BuildRequestURL(info *relaycommon.RelayInfo) (string, error) {
	if a.autoDL {
		return fmt.Sprintf("%s/comfyui_workflow/%s", a.autoDLBaseURL(), info.UpstreamModelName), nil
	}
	return fmt.Sprintf("%s%s", a.baseURL, TextToVideoEndpoint), nil
}

func (a *TaskAdaptor) BuildRequestHeader(c *gin.Context, req *http.Request, info *relaycommon.RelayInfo) error {
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	if a.autoDL {
		req.Header.Set("Authorization", a.apiKey)
	} else {
		req.Header.Set("Authorization", "Bearer "+a.apiKey)
	}
	return nil
}

func (a *TaskAdaptor) BuildRequestBody(c *gin.Context, info *relaycommon.RelayInfo) (io.Reader, error) {
	v, exists := c.Get("task_request")
	if !exists {
		return nil, fmt.Errorf("request not found in context")
	}
	req, ok := v.(relaycommon.TaskSubmitReq)
	if !ok {
		return nil, fmt.Errorf("invalid request type in context")
	}

	var body any
	var err error
	if a.autoDL {
		body, err = a.convertToAutoDLRequest(&req, info)
	} else {
		body, err = a.convertToRequestPayload(&req, info)
	}
	if err != nil {
		return nil, errors.Wrap(err, "convert request payload failed")
	}

	data, err := common.Marshal(body)
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
		taskErr = service.TaskErrorWrapper(err, "read_response_body_failed", http.StatusInternalServerError)
		return
	}
	_ = resp.Body.Close()
	if a.autoDL {
		var result AutoDLSubmitResponse
		if err := common.Unmarshal(responseBody, &result); err != nil {
			taskErr = service.TaskErrorWrapper(err, "unmarshal_response_body_failed", http.StatusInternalServerError)
			return
		}
		if result.Code != "Success" || result.Data.TaskID == "" {
			taskErr = service.TaskErrorWrapper(fmt.Errorf("autodl submit failed: %s", result.Message()), "upstream_error", http.StatusBadGateway)
			return
		}
		ov := dto.NewOpenAIVideo()
		ov.ID, ov.TaskID, ov.Model = info.PublicTaskID, info.PublicTaskID, info.OriginModelName
		ov.CreatedAt = time.Now().Unix()
		c.JSON(http.StatusOK, ov)
		return result.Data.TaskID, responseBody, nil
	}

	var hResp VideoResponse
	if err := common.Unmarshal(responseBody, &hResp); err != nil {
		taskErr = service.TaskErrorWrapper(errors.Wrapf(err, "body: %s", responseBody), "unmarshal_response_body_failed", http.StatusInternalServerError)
		return
	}

	if hResp.BaseResp.StatusCode != StatusSuccess {
		taskErr = service.TaskErrorWrapper(
			fmt.Errorf("hailuo api error: %s", hResp.BaseResp.StatusMsg),
			strconv.Itoa(hResp.BaseResp.StatusCode),
			http.StatusBadRequest,
		)
		return
	}

	ov := dto.NewOpenAIVideo()
	ov.ID = info.PublicTaskID
	ov.TaskID = info.PublicTaskID
	ov.CreatedAt = time.Now().Unix()
	ov.Model = info.OriginModelName

	c.JSON(http.StatusOK, ov)
	return hResp.TaskID, responseBody, nil
}

func (a *TaskAdaptor) FetchTask(baseUrl, key string, body map[string]any, proxy string) (*http.Response, error) {
	taskID, ok := body["task_id"].(string)
	if !ok {
		return nil, fmt.Errorf("invalid task_id")
	}

	uri := fmt.Sprintf("%s%s?task_id=%s", baseUrl, QueryTaskEndpoint, taskID)
	if a.autoDL {
		uri = fmt.Sprintf("%s/comfyui_workflow/result/%s", a.autoDLBaseURLFor(baseUrl), taskID)
	}

	req, err := http.NewRequest(http.MethodGet, uri, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Bearer "+key)

	client, err := service.GetHttpClientWithProxy(proxy)
	if err != nil {
		return nil, fmt.Errorf("new proxy http client failed: %w", err)
	}
	return client.Do(req)
}

func (a *TaskAdaptor) GetModelList() []string {
	return ModelList
}

func (a *TaskAdaptor) GetChannelName() string {
	return ChannelName
}

func (a *TaskAdaptor) convertToRequestPayload(req *relaycommon.TaskSubmitReq, info *relaycommon.RelayInfo) (*VideoRequest, error) {
	modelConfig := GetModelConfig(info.UpstreamModelName)
	duration := DefaultDuration
	if req.Duration > 0 {
		duration = req.Duration
	}
	resolution := modelConfig.DefaultResolution
	if req.Size != "" {
		resolution = a.parseResolutionFromSize(req.Size, modelConfig)
	}

	videoRequest := &VideoRequest{
		Model:      info.UpstreamModelName,
		Prompt:     req.Prompt,
		Duration:   &duration,
		Resolution: resolution,
	}
	if err := req.UnmarshalMetadata(&videoRequest); err != nil {
		return nil, errors.Wrap(err, "unmarshal metadata to video request failed")
	}

	return videoRequest, nil
}

func (a *TaskAdaptor) parseResolutionFromSize(size string, modelConfig ModelConfig) string {
	switch {
	case strings.Contains(size, "1080"):
		return Resolution1080P
	case strings.Contains(size, "768"):
		return Resolution768P
	case strings.Contains(size, "720"):
		return Resolution720P
	case strings.Contains(size, "512"):
		return Resolution512P
	default:
		return modelConfig.DefaultResolution
	}
}

func (a *TaskAdaptor) ParseTaskResult(respBody []byte) (*relaycommon.TaskInfo, error) {
	if a.autoDL {
		var result AutoDLResultResponse
		if err := common.Unmarshal(respBody, &result); err != nil {
			return nil, errors.Wrap(err, "unmarshal AutoDL task result failed")
		}
		status := strings.ToUpper(result.Data.Status)
		info := &relaycommon.TaskInfo{TaskID: result.Data.TaskID, Progress: "20%"}
		switch status {
		case "QUEUED":
			info.Status, info.Progress = model.TaskStatusInProgress, "20%"
		case "RUNNING":
			info.Status, info.Progress = model.TaskStatusInProgress, "50%"
		case "SUCCESS", "COMPLETED":
			info.Status, info.Progress = model.TaskStatusSuccess, "100%"
			for _, item := range result.Data.Results {
				if item.Type == "video" && item.URL != "" {
					info.Url = item.URL
					break
				}
			}
		case "FAILED", "FAILURE", "ERROR":
			info.Status, info.Progress, info.Reason = model.TaskStatusFailure, "100%", result.Data.Error
		default:
			info.Status = model.TaskStatusInProgress
		}
		return info, nil
	}
	resTask := QueryTaskResponse{}
	if err := common.Unmarshal(respBody, &resTask); err != nil {
		return nil, errors.Wrap(err, "unmarshal task result failed")
	}

	taskResult := relaycommon.TaskInfo{}

	if resTask.BaseResp.StatusCode == StatusSuccess {
		taskResult.Code = 0
	} else {
		taskResult.Code = resTask.BaseResp.StatusCode
		taskResult.Reason = resTask.BaseResp.StatusMsg
		taskResult.Status = model.TaskStatusFailure
		taskResult.Progress = "100%"
	}

	switch resTask.Status {
	case TaskStatusPreparing, TaskStatusQueueing, TaskStatusProcessing:
		taskResult.Status = model.TaskStatusInProgress
		taskResult.Progress = "30%"
		if resTask.Status == TaskStatusProcessing {
			taskResult.Progress = "50%"
		}
	case TaskStatusSuccess:
		taskResult.Status = model.TaskStatusSuccess
		taskResult.Progress = "100%"
		taskResult.Url = a.buildVideoURL(resTask.TaskID, resTask.FileID)
	case TaskStatusFailed:
		taskResult.Status = model.TaskStatusFailure
		taskResult.Progress = "100%"
		if taskResult.Reason == "" {
			taskResult.Reason = "task failed"
		}
	default:
		taskResult.Status = model.TaskStatusInProgress
		taskResult.Progress = "30%"
	}

	return &taskResult, nil
}

func (a *TaskAdaptor) ConvertToOpenAIVideo(originTask *model.Task) ([]byte, error) {
	if a.autoDL {
		openAIVideo := originTask.ToOpenAIVideo()
		return common.Marshal(openAIVideo)
	}
	var hailuoResp QueryTaskResponse
	if err := common.Unmarshal(originTask.Data, &hailuoResp); err != nil {
		return nil, errors.Wrap(err, "unmarshal hailuo task data failed")
	}

	openAIVideo := originTask.ToOpenAIVideo()
	if hailuoResp.BaseResp.StatusCode != StatusSuccess {
		openAIVideo.Error = &dto.OpenAIVideoError{
			Message: hailuoResp.BaseResp.StatusMsg,
			Code:    strconv.Itoa(hailuoResp.BaseResp.StatusCode),
		}
	}

	jsonData, err := common.Marshal(openAIVideo)
	if err != nil {
		return nil, errors.Wrap(err, "marshal openai video failed")
	}

	return jsonData, nil
}

type autoDLVideoRequest struct {
	Seed          *int   `json:"seed,omitempty"`
	Prompt        string `json:"prompt"`
	Duration      int    `json:"duration,omitempty"`
	AudioDuration int    `json:"audio_duration,omitempty"`
	Resolution    string `json:"resolution,omitempty"`
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

type AutoDLSubmitResponse struct {
	Code string `json:"code"`
	Msg  string `json:"msg"`
	Data struct {
		TaskID string `json:"task_id"`
	} `json:"data"`
}

func (r AutoDLSubmitResponse) Message() string {
	if r.Msg != "" {
		return r.Msg
	}
	return r.Code
}

type AutoDLResultResponse struct {
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

func autodlResolution(req relaycommon.TaskSubmitReq, fallback string) string {
	if req.Size != "" {
		return req.Size
	}
	if req.Metadata != nil {
		if v, ok := req.Metadata["resolution"].(string); ok && v != "" {
			return v
		}
	}
	return fallback
}

func (a *TaskAdaptor) convertToAutoDLRequest(req *relaycommon.TaskSubmitReq, info *relaycommon.RelayInfo) (*autoDLVideoRequest, error) {
	payload := &autoDLVideoRequest{Seed: req.Seed, Prompt: req.Prompt, Duration: req.Duration, AudioDuration: req.AudioDuration, Resolution: autodlResolution(*req, "768p竖"), FirstFrame: req.FirstFrame, LastFrame: req.LastFrame}
	if payload.Duration == 0 {
		payload.Duration = 5
	}
	if err := req.UnmarshalMetadata(payload); err != nil {
		return nil, err
	}
	if info.UpstreamModelName == "minimax_h3_image_audio_to_video" && payload.AudioDuration == 0 {
		payload.AudioDuration = 5
	}
	if payload.Duration < 1 || payload.Duration > 15 {
		return nil, fmt.Errorf("duration must be between 1 and 15 seconds")
	}
	if len(req.Images) > 0 {
		refs := []*string{&payload.RefImage0, &payload.RefImage1, &payload.RefImage2, &payload.RefImage3, &payload.RefImage4, &payload.RefImage5, &payload.RefImage6, &payload.RefImage7, &payload.RefImage8}
		for i, v := range req.Images {
			if i >= len(refs) {
				break
			}
			*refs[i] = v
		}
	}
	return payload, nil
}

func (a *TaskAdaptor) autoDLBaseURL() string { return a.autoDLBaseURLFor(a.baseURL) }

func (a *TaskAdaptor) autoDLBaseURLFor(base string) string {
	base = strings.TrimRight(base, "/")
	if strings.HasSuffix(base, "/api/v1/comfyui") {
		return base
	}
	if strings.Contains(strings.ToLower(base), "autodl.art") {
		return base + "/api/v1/comfyui"
	}
	return base
}

func (a *TaskAdaptor) EstimateBilling(c *gin.Context, info *relaycommon.RelayInfo) map[string]float64 {
	if !a.autoDL || (info.UpstreamModelName != "minimax_h3_image_audio_to_video_v2_15s" && info.UpstreamModelName != "minimax_h3_image_audio_to_video_v2" && info.UpstreamModelName != "minimax_h3_lightx2v_v5_15s" && info.UpstreamModelName != "minimax_h3_lightx2v" && info.UpstreamModelName != "minimax_h3_lightx2v_no_pic" && info.UpstreamModelName != "minimax_h3_image_audio_to_video" && info.UpstreamModelName != "minimax_h3_lightx2v_v5") {
		return nil
	}
	req, err := relaycommon.GetTaskRequest(c)
	if err != nil {
		return nil
	}
	duration := req.Duration
	if info.UpstreamModelName == "minimax_h3_image_audio_to_video" {
		duration = req.AudioDuration
		if v, ok := req.Metadata["audio_duration"].(float64); ok && duration == 0 {
			duration = int(v)
		}
	}
	if duration == 0 {
		duration = 5
	}
	resolution := autodlResolution(req, "768p竖")
	resolutionRatio := 1.0
	if strings.HasPrefix(resolution, "1080p") {
		resolutionRatio = 8
	} else if strings.HasPrefix(resolution, "768p") {
		resolutionRatio = 2
	}
	return map[string]float64{"seconds": float64(duration), "resolution": resolutionRatio}
}

func (a *TaskAdaptor) buildVideoURL(_, fileID string) string {
	if a.apiKey == "" || a.baseURL == "" {
		return ""
	}

	url := fmt.Sprintf("%s/v1/files/retrieve?file_id=%s", a.baseURL, fileID)

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return ""
	}

	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Bearer "+a.apiKey)

	resp, err := service.GetHttpClient().Do(req)
	if err != nil {
		return ""
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return ""
	}

	var retrieveResp RetrieveFileResponse
	if err := common.Unmarshal(responseBody, &retrieveResp); err != nil {
		return ""
	}

	if retrieveResp.BaseResp.StatusCode != StatusSuccess {
		return ""
	}

	return retrieveResp.File.DownloadURL
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

func containsInt(slice []int, item int) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
