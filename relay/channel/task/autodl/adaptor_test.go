package autodl

import (
	"bytes"
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/model"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestValidateRequestEnforcesWorkflowRegistry(t *testing.T) {
	tests := []struct {
		name       string
		request    string
		wantCode   string
		wantStatus int
	}{
		{
			name:       "rejects removed workflow",
			request:    `{"model":"minimax_h3_image_audio_to_video","prompt":"video","duration":5,"size":"480p竖"}`,
			wantCode:   "unsupported_workflow",
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "rejects 1080p for 15 second workflow",
			request:    `{"model":"minimax_h3_lightx2v_no_pic","prompt":"video","duration":5,"size":"1080p竖"}`,
			wantCode:   "invalid_resolution",
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "rejects more than 10 seconds for short workflow",
			request:    `{"model":"minimax_h3_image_audio_to_video_v2","prompt":"video","duration":11,"size":"768p竖"}`,
			wantCode:   "invalid_duration",
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "requires reference image",
			request:    `{"model":"minimax_h3_lightx2v_v5","prompt":"video","duration":5,"size":"768p竖"}`,
			wantCode:   "invalid_request",
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "requires first and last frames",
			request:    `{"model":"minimax_h3_lightx2v","prompt":"video","duration":5,"size":"768p横","first_frame":"https://example.com/first.png"}`,
			wantCode:   "invalid_request",
			wantStatus: http.StatusBadRequest,
		},
		{
			name:    "accepts 10 second square image workflow",
			request: `{"model":"minimax_h3_lightx2v_v5","prompt":"video","duration":10,"size":"1080p(1:1)","images":["https://example.com/ref.png"]}`,
		},
		{
			name:    "accepts 15 second image audio workflow",
			request: `{"model":"minimax_h3_image_audio_to_video_v2_15s","prompt":"video","duration":15,"size":"480p横"}`,
		},
		{
			name:    "accepts 15 second square image workflow",
			request: `{"model":"minimax_h3_lightx2v_v5_15s","prompt":"video","duration":15,"size":"768p(1:1)","metadata":{"ref_image_0":"https://example.com/ref.png"}}`,
		},
		{
			name:    "accepts 10 second image audio workflow",
			request: `{"model":"minimax_h3_image_audio_to_video_v2","prompt":"video","duration":10,"size":"1080p横"}`,
		},
		{
			name:    "accepts no picture workflow",
			request: `{"model":"minimax_h3_lightx2v_no_pic","prompt":"video","duration":15,"size":"768p竖"}`,
		},
		{
			name:    "accepts first and last frame workflow",
			request: `{"model":"minimax_h3_lightx2v","prompt":"video","duration":15,"size":"480p竖","first_frame":"https://example.com/first.png","last_frame":"https://example.com/last.png"}`,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			gin.SetMode(gin.TestMode)
			ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
			ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/videos", bytes.NewBufferString(test.request)).WithContext(context.Background())
			ctx.Request.Header.Set("Content-Type", "application/json")

			adaptor := &TaskAdaptor{}
			info := &relaycommon.RelayInfo{TaskRelayInfo: &relaycommon.TaskRelayInfo{}}
			taskErr := adaptor.ValidateRequestAndSetAction(ctx, info)

			if test.wantCode == "" {
				require.Nil(t, taskErr)
				return
			}
			require.NotNil(t, taskErr)
			assert.Equal(t, test.wantCode, taskErr.Code)
			assert.Equal(t, test.wantStatus, taskErr.StatusCode)
		})
	}
}

func TestEstimateBillingUsesDurationResolutionAndTwoTimesCost(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/videos", nil).WithContext(context.Background())
	ctx.Set("task_request", relaycommon.TaskSubmitReq{
		Model:    workflowImageAudioV2,
		Prompt:   "video",
		Duration: 10,
		Size:     "1080p竖",
	})
	info := &relaycommon.RelayInfo{ChannelMeta: &relaycommon.ChannelMeta{UpstreamModelName: workflowImageAudioV2}}

	ratios := (&TaskAdaptor{}).EstimateBilling(ctx, info)

	assert.Equal(t, 10.0, ratios["seconds"])
	assert.Equal(t, 11.0, ratios["resolution"])
	assert.Equal(t, 2.0, ratios["cost_multiplier"])
}

func TestEstimateBillingMatchesWorkflowResolutionPrices(t *testing.T) {
	tests := []struct {
		name       string
		workflow   string
		resolution string
		wantRatio  float64
	}{
		{name: "768p is the same price as 480p", workflow: workflowLightX2VNoPicture, resolution: "768p横", wantRatio: 1},
		{name: "image audio 1080p costs eleven times base", workflow: workflowImageAudioV2, resolution: "1080p横", wantRatio: 11},
		{name: "light x2v v5 1080p costs ten times base", workflow: workflowLightX2VV5, resolution: "1080p(1:1)", wantRatio: 10},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			gin.SetMode(gin.TestMode)
			ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
			ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/videos", nil).WithContext(context.Background())
			ctx.Set("task_request", relaycommon.TaskSubmitReq{
				Model:    test.workflow,
				Prompt:   "video",
				Duration: 1,
				Size:     test.resolution,
			})
			info := &relaycommon.RelayInfo{ChannelMeta: &relaycommon.ChannelMeta{UpstreamModelName: test.workflow}}

			ratios := (&TaskAdaptor{}).EstimateBilling(ctx, info)

			assert.Equal(t, test.wantRatio, ratios["resolution"])
		})
	}
}

func TestConvertRequestPreventsMetadataBillingOverride(t *testing.T) {
	req := relaycommon.TaskSubmitReq{
		Model:    workflowLightX2VNoPicture,
		Prompt:   "video",
		Duration: 5,
		Size:     "480p竖",
		Metadata: map[string]any{
			"duration":   15,
			"resolution": "1080p竖",
		},
	}

	payload, err := convertRequest(req, workflowLightX2VNoPicture)

	require.NoError(t, err)
	assert.Equal(t, 5, payload.Duration)
	assert.Equal(t, "480p竖", payload.Resolution)
}

func TestFetchTaskUsesDirectTokenAndWorkflowResultPath(t *testing.T) {
	var authorization string
	var path string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authorization = r.Header.Get("Authorization")
		path = r.URL.Path
		_, _ = io.WriteString(w, `{"code":"Success","data":{"status":"RUNNING"}}`)
	}))
	defer server.Close()

	adaptor := &TaskAdaptor{}
	resp, err := adaptor.FetchTask(server.URL+"/api/v1/comfyui", "test-token", map[string]any{"task_id": "task-123"}, "")

	require.NoError(t, err)
	require.NoError(t, resp.Body.Close())
	assert.Equal(t, "test-token", authorization)
	assert.Equal(t, "/api/v1/comfyui/comfyui_workflow/result/task-123", path)
}

func TestBuildRequestRegistersAutoDLChannelDefaults(t *testing.T) {
	assert.Equal(t, "AutoDL Video Generation", constant.GetChannelTypeName(constant.ChannelTypeAutoDL))
	require.Greater(t, len(constant.ChannelBaseURLs), constant.ChannelTypeAutoDL)
	assert.Equal(t, DefaultBaseURL, constant.ChannelBaseURLs[constant.ChannelTypeAutoDL])
	assert.Len(t, ModelList, 6)
	assert.NotContains(t, ModelList, "minimax_h3_image_audio_to_video")

	adaptor := &TaskAdaptor{}
	adaptor.Init(&relaycommon.RelayInfo{ChannelMeta: &relaycommon.ChannelMeta{
		ApiKey:            "test-token",
		UpstreamModelName: workflowLightX2VNoPicture,
	}})
	info := &relaycommon.RelayInfo{ChannelMeta: &relaycommon.ChannelMeta{UpstreamModelName: workflowLightX2VNoPicture}}

	requestURL, err := adaptor.BuildRequestURL(info)
	require.NoError(t, err)
	assert.Equal(t, "https://autodl.art/api/v1/comfyui/comfyui_workflow/"+workflowLightX2VNoPicture, requestURL)

	req := httptest.NewRequest(http.MethodPost, requestURL, nil)
	require.NoError(t, adaptor.BuildRequestHeader(nil, req, info))
	assert.Equal(t, "test-token", req.Header.Get("Authorization"))
}

func TestParseTaskResultExtractsVideoURL(t *testing.T) {
	response, err := common.Marshal(map[string]any{
		"data": map[string]any{
			"task_id": "upstream-task",
			"status":  "SUCCESS",
			"results": []map[string]any{{"type": "video", "url": "https://example.com/video.mp4"}},
		},
	})
	require.NoError(t, err)

	result, err := (&TaskAdaptor{}).ParseTaskResult(response)

	require.NoError(t, err)
	assert.Equal(t, "upstream-task", result.TaskID)
	assert.Equal(t, model.TaskStatusSuccess, result.Status)
	assert.Equal(t, "100%", result.Progress)
	assert.Equal(t, "https://example.com/video.mp4", result.Url)
}
