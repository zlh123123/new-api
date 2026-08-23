package hailuo

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"

	relaycommon "github.com/QuantumNous/new-api/relay/common"
)

func TestMiniMaxFetchTaskUsesBearerTokenAndNativePath(t *testing.T) {
	var gotAuthorization string
	var gotPath string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuthorization = r.Header.Get("Authorization")
		gotPath = r.URL.Path
		_, _ = io.WriteString(w, `{"base_resp":{"status_code":0},"status":"Queueing"}`)
	}))
	defer server.Close()

	adaptor := &TaskAdaptor{}
	info := &relaycommon.RelayInfo{
		ChannelMeta: &relaycommon.ChannelMeta{
			ChannelBaseUrl:    server.URL,
			UpstreamModelName: "MiniMax-Hailuo-02",
		},
	}
	adaptor.Init(info)

	resp, err := adaptor.FetchTask(server.URL, "test-token", map[string]any{"task_id": "task-456"}, "")
	require.NoError(t, err)
	require.NoError(t, resp.Body.Close())
	require.Equal(t, "Bearer test-token", gotAuthorization)
	require.Equal(t, "/v1/query/video_generation", gotPath)
}
