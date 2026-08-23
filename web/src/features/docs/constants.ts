/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

export const API_ORIGIN = 'https://haoji.blog'
export const API_BASE_URL = `${API_ORIGIN}/v1`
export const DEFAULT_TEXT_MODEL = 'gpt-5.6-terra'

export const NAV_ITEMS = [
  ['prepare-key', '准备 API Key'],
  ['environment', '安装基础环境'],
  ['address', '地址填写规则'],
  ['codex', '配置 Codex'],
  ['claude-code', '配置 Claude Code'],
  ['opencode', '配置 OpenCode'],
  ['compatible-clients', '通用兼容客户端'],
  ['api-examples', 'API 调用示例'],
  ['minimax-h3', 'MiniMax H3 视频'],
  ['verify', '检查是否成功'],
  ['faq', '常见问题'],
] as const

export const WINDOWS_NODE_INSTALL = `winget install OpenJS.NodeJS.LTS
node -v
npm -v`

export const MACOS_NODE_INSTALL = `# 已安装 Homebrew 时
brew install node

node -v
npm -v`

export const LINUX_NODE_INSTALL = `sudo apt update
sudo apt install -y nodejs npm

node -v
npm -v`

export const CODEX_INSTALL = `npm install -g @openai/codex
codex --version`

export const CODEX_CONFIG = `model = "${DEFAULT_TEXT_MODEL}"
model_provider = "haoji"
model_reasoning_effort = "high"
disable_response_storage = true

[model_providers.haoji]
name = "haoji api"
base_url = "${API_BASE_URL}"
env_key = "OPENAI_API_KEY"
wire_api = "responses"
supports_websockets = false`

export const CODEX_KEY_WINDOWS = `$env:OPENAI_API_KEY="这里换成你的APIKey"
codex`

export const CODEX_KEY_UNIX = `export OPENAI_API_KEY="这里换成你的APIKey"
codex`

export const CLAUDE_INSTALL = `npm install -g @anthropic-ai/claude-code
claude --version`

export const CLAUDE_CONFIG = `{
  "effortLevel": "high",
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "这里换成你的APIKey",
    "ANTHROPIC_BASE_URL": "${API_ORIGIN}",
    "ANTHROPIC_MODEL": "claude-opus-4-8",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "claude-opus-4-8",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-opus-4-8",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-4-8",
    "CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS": "1"
  }
}`

export const OPENCODE_INSTALL = `npm install -g opencode-ai
opencode --version`

export const OPENCODE_CONFIG = `{
  "$schema": "https://opencode.ai/config.json",
  "model": "haoji/${DEFAULT_TEXT_MODEL}",
  "small_model": "haoji/gpt-5.6-luna",
  "provider": {
    "haoji": {
      "npm": "@ai-sdk/openai",
      "name": "haoji api",
      "options": {
        "baseURL": "${API_BASE_URL}",
        "apiKey": "这里换成你的APIKey"
      },
      "models": {
        "${DEFAULT_TEXT_MODEL}": { "name": "${DEFAULT_TEXT_MODEL}" },
        "gpt-5.6-luna": { "name": "gpt-5.6-luna" },
        "gpt-5.6-sol": { "name": "gpt-5.6-sol" },
        "gpt-5.5": { "name": "gpt-5.5" },
        "claude-opus-4-8": { "name": "claude-opus-4-8" }
      }
    }
  }
}`

export const LIST_MODELS_EXAMPLE = `curl ${API_BASE_URL}/models \\
  -H "Authorization: Bearer YOUR_API_KEY"`

export const CHAT_EXAMPLE = `curl ${API_BASE_URL}/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${DEFAULT_TEXT_MODEL}",
    "messages": [
      {"role": "user", "content": "你好，只回复连接成功"}
    ],
    "stream": false
  }'`

export const RESPONSES_EXAMPLE = `curl ${API_BASE_URL}/responses \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${DEFAULT_TEXT_MODEL}",
    "input": "你好，只回复连接成功"
  }'`

export const IMAGE_EXAMPLE = `curl ${API_BASE_URL}/images/generations \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-image-2",
    "prompt": "一只白猫，干净背景，写实风格",
    "size": "1024x1024"
  }'`

export const VIDEO_TEXT_EXAMPLE = `curl ${API_BASE_URL}/videos \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "minimax_h3_lightx2v_no_pic",
    "prompt": "雨后的霓虹街道，一只橘猫缓慢走过，电影感",
    "duration": 8,
    "size": "768p横",
    "seed": 123456
  }'`

export const VIDEO_REFERENCE_EXAMPLE = `curl ${API_BASE_URL}/videos \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "minimax_h3_lightx2v_v5",
    "prompt": "镜头缓慢推进，人物自然眨眼，头发随风摆动",
    "duration": 10,
    "size": "768p横",
    "images": ["https://example.com/reference.jpg"]
  }'`

export const VIDEO_FRAMES_EXAMPLE = `curl ${API_BASE_URL}/videos \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "minimax_h3_lightx2v",
    "prompt": "从白天自然过渡到夜晚，镜头保持稳定",
    "duration": 12,
    "size": "768p横",
    "first_frame": "https://example.com/first.jpg",
    "last_frame": "https://example.com/last.jpg"
  }'`

export const VIDEO_AUDIO_EXAMPLE = `curl ${API_BASE_URL}/videos \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "minimax_h3_image_audio_to_video_v2",
    "prompt": "人物跟随参考音频自然说话",
    "duration": 8,
    "size": "768p横",
    "images": ["https://example.com/person.jpg"],
    "audio_duration": 8,
    "metadata": {
      "ref_audio_0": "https://example.com/voice.mp3"
    }
  }'`

export const VIDEO_STATUS_EXAMPLE = `curl ${API_BASE_URL}/videos/task_xxxxxxxxxxxx \\
  -H "Authorization: Bearer YOUR_API_KEY"`

export const VIDEO_STATUS_RESPONSE = `{
  "id": "task_xxxxxxxxxxxx",
  "object": "video",
  "model": "minimax_h3_lightx2v_no_pic",
  "status": "completed",
  "progress": 100,
  "metadata": {
    "url": "https://example.com/result.mp4"
  }
}`

export type Workflow = {
  model: string
  duration: string
  sizes: string
  input: string
  useCase: string
  billing: string
}

export const WORKFLOWS: Workflow[] = [
  {
    model: 'minimax_h3_image_audio_to_video_v2_15s',
    duration: '1–15 秒',
    sizes: '480p竖、480p横、768p竖、768p横',
    input: 'prompt；可选参考图、参考音频',
    useCase: '多图、多音频驱动的长视频',
    billing: '480p / 768p：0.8 USD/秒',
  },
  {
    model: 'minimax_h3_lightx2v_v5_15s',
    duration: '1–15 秒',
    sizes: '480p / 768p，支持竖、横、1:1',
    input: 'prompt、images[0]',
    useCase: '单张参考图生成最长 15 秒视频',
    billing: '480p / 768p：0.8 USD/秒',
  },
  {
    model: 'minimax_h3_image_audio_to_video_v2',
    duration: '1–10 秒',
    sizes: '480p / 768p / 1080p，支持竖、横',
    input: 'prompt；可选参考图、参考音频',
    useCase: '多图、多音频驱动，支持 1080p',
    billing: '480p / 768p：0.8 USD/秒；1080p：8.8 USD/秒',
  },
  {
    model: 'minimax_h3_lightx2v_v5',
    duration: '1–10 秒',
    sizes: '480p / 768p / 1080p，支持竖、横、1:1',
    input: 'prompt、images[0]',
    useCase: '单张参考图生成，支持 1080p',
    billing: '480p / 768p：0.8 USD/秒；1080p：8.0 USD/秒',
  },
  {
    model: 'minimax_h3_lightx2v_no_pic',
    duration: '1–15 秒',
    sizes: '480p竖、480p横、768p竖、768p横',
    input: 'prompt',
    useCase: '纯文本生成视频',
    billing: '480p / 768p：0.8 USD/秒',
  },
  {
    model: 'minimax_h3_lightx2v',
    duration: '1–15 秒',
    sizes: '480p竖、480p横、768p竖、768p横',
    input: 'prompt、first_frame、last_frame',
    useCase: '指定首帧和尾帧生成过渡视频',
    billing: '480p / 768p：0.8 USD/秒',
  },
]

export const VIDEO_FIELDS = [
  ['model', '字符串', '是', '上表中的完整模型名，不能省略后缀'],
  ['prompt', '字符串', '是', '视频内容、动作、镜头和风格描述'],
  ['duration', '整数', '否', '视频秒数，默认 5；范围受模型限制'],
  ['size', '字符串', '否', '默认 768p竖；必须使用模型支持的精确值'],
  ['seed', '整数', '否', '随机种子；相同参数仍不保证结果完全一致'],
  [
    'images',
    '字符串数组',
    '按模型',
    '公开可访问的参考图片 URL，最多读取前 9 张',
  ],
  ['first_frame', '字符串', '按模型', '首帧图片 URL'],
  ['last_frame', '字符串', '按模型', '尾帧图片 URL'],
  ['audio_duration', '整数', '否', '参考音频时长，单位为秒'],
  [
    'metadata.ref_audio_0',
    '字符串',
    '否',
    '参考音频 URL；还可传 ref_audio_1、ref_audio_2',
  ],
] as const

export const COMMON_ERRORS = [
  ['400', '请求参数错误', '检查模型全名、时长、size 和必填图片字段。'],
  ['401', '认证失败', 'Key 错误、被禁用、复制不完整，或 Bearer 后缺少空格。'],
  ['403', '无权限或余额不足', '检查令牌分组、模型权限和账户余额。'],
  ['404', '地址错误', '通用客户端通常应填写 https://haoji.blog/v1。'],
  [
    '405',
    '请求方式错误',
    '检查是否把 GET 和 POST 混用；Codex 需关闭 WebSocket。',
  ],
  ['429', '请求过多', '降低并发或等待限流窗口结束后重试。'],
  ['500/502', '服务或上游异常', '保留请求时间和错误信息，稍后重试或联系客服。'],
] as const
