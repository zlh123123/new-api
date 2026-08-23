package relay

import (
	"strconv"
	"testing"

	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/relay/channel/task/autodl"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetTaskAdaptorUsesDedicatedAutoDLAdaptor(t *testing.T) {
	platform := constant.TaskPlatform(strconv.Itoa(constant.ChannelTypeAutoDL))
	adaptor := GetTaskAdaptor(platform)

	require.NotNil(t, adaptor)
	assert.IsType(t, &autodl.TaskAdaptor{}, adaptor)
	assert.Equal(t, autodl.ModelList, adaptor.GetModelList())
}
