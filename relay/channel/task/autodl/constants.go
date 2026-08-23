package autodl

const (
	ChannelName               = "autodl-video"
	DefaultBaseURL            = "https://autodl.art"
	defaultDurationSeconds    = 5
	defaultResolution         = "768p竖"
	autoDLVideoCostMultiplier = 2.0
	workflowImageAudioV215    = "minimax_h3_image_audio_to_video_v2_15s"
	workflowLightX2VV515      = "minimax_h3_lightx2v_v5_15s"
	workflowImageAudioV2      = "minimax_h3_image_audio_to_video_v2"
	workflowLightX2VV5        = "minimax_h3_lightx2v_v5"
	workflowLightX2VNoPicture = "minimax_h3_lightx2v_no_pic"
	workflowLightX2VFirstLast = "minimax_h3_lightx2v"
)

var ModelList = []string{
	workflowImageAudioV215,
	workflowLightX2VV515,
	workflowImageAudioV2,
	workflowLightX2VV5,
	workflowLightX2VNoPicture,
	workflowLightX2VFirstLast,
}

type workflowConfig struct {
	maxDuration      int
	resolutionRatios map[string]float64
	requiresRefImage bool
	requiresFrames   bool
}

var portraitLandscape480768 = map[string]float64{
	"480p竖": 1,
	"480p横": 1,
	"768p竖": 1,
	"768p横": 1,
}

var imageAudioPortraitLandscapeRatios = map[string]float64{
	"480p竖":  1,
	"480p横":  1,
	"768p竖":  1,
	"768p横":  1,
	"1080p竖": 11,
	"1080p横": 11,
}

var square480768 = map[string]float64{
	"480p竖":     1,
	"480p横":     1,
	"480p(1:1)": 1,
	"768p竖":     1,
	"768p横":     1,
	"768p(1:1)": 1,
}

var lightX2VV5SquareRatios = map[string]float64{
	"480p竖":      1,
	"480p横":      1,
	"480p(1:1)":  1,
	"768p竖":      1,
	"768p横":      1,
	"768p(1:1)":  1,
	"1080p竖":     10,
	"1080p横":     10,
	"1080p(1:1)": 10,
}

var workflowConfigs = map[string]workflowConfig{
	workflowImageAudioV215: {
		maxDuration:      15,
		resolutionRatios: portraitLandscape480768,
	},
	workflowLightX2VV515: {
		maxDuration:      15,
		resolutionRatios: square480768,
		requiresRefImage: true,
	},
	workflowImageAudioV2: {
		maxDuration:      10,
		resolutionRatios: imageAudioPortraitLandscapeRatios,
	},
	workflowLightX2VV5: {
		maxDuration:      10,
		resolutionRatios: lightX2VV5SquareRatios,
		requiresRefImage: true,
	},
	workflowLightX2VNoPicture: {
		maxDuration:      15,
		resolutionRatios: portraitLandscape480768,
	},
	workflowLightX2VFirstLast: {
		maxDuration:      15,
		resolutionRatios: portraitLandscape480768,
		requiresFrames:   true,
	},
}
