package common

import (
	"testing"

	"github.com/QuantumNous/new-api/constant"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAutoDLChannelAdvertisesOpenAIVideoEndpoint(t *testing.T) {
	types := GetEndpointTypesByChannelType(constant.ChannelTypeAutoDL, "minimax_h3_lightx2v_no_pic")

	require.Len(t, types, 1)
	assert.Equal(t, constant.EndpointTypeOpenAIVideo, types[0])

	endpoint, ok := GetDefaultEndpointInfo(types[0])
	require.True(t, ok)
	assert.Equal(t, "/v1/videos", endpoint.Path)
	assert.Equal(t, "POST", endpoint.Method)
}
