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
import type { TFunction } from 'i18next'

export type MiniMaxH3InputKind =
  | 'text'
  | 'reference-image'
  | 'first-last-frame'
  | 'image-audio'

export type MiniMaxH3ModelInfo = {
  maxDuration: number
  resolutions: readonly string[]
  inputKind: MiniMaxH3InputKind
  supports1080p: boolean
  resolution1080pMultiplier?: number
}

const COMMON_RESOLUTIONS = ['480p竖', '480p横', '768p竖', '768p横'] as const
const SQUARE_RESOLUTIONS = [
  ...COMMON_RESOLUTIONS,
  '480p(1:1)',
  '768p(1:1)',
] as const

const MINIMAX_H3_MODELS: Record<string, MiniMaxH3ModelInfo> = {
  minimax_h3_image_audio_to_video_v2_15s: {
    maxDuration: 15,
    resolutions: COMMON_RESOLUTIONS,
    inputKind: 'image-audio',
    supports1080p: false,
  },
  minimax_h3_lightx2v_v5_15s: {
    maxDuration: 15,
    resolutions: SQUARE_RESOLUTIONS,
    inputKind: 'reference-image',
    supports1080p: false,
  },
  minimax_h3_image_audio_to_video_v2: {
    maxDuration: 10,
    resolutions: [...COMMON_RESOLUTIONS, '1080p竖', '1080p横'],
    inputKind: 'image-audio',
    supports1080p: true,
    resolution1080pMultiplier: 11,
  },
  minimax_h3_lightx2v_v5: {
    maxDuration: 10,
    resolutions: [...SQUARE_RESOLUTIONS, '1080p竖', '1080p横', '1080p(1:1)'],
    inputKind: 'reference-image',
    supports1080p: true,
    resolution1080pMultiplier: 10,
  },
  minimax_h3_lightx2v_no_pic: {
    maxDuration: 15,
    resolutions: COMMON_RESOLUTIONS,
    inputKind: 'text',
    supports1080p: false,
  },
  minimax_h3_lightx2v: {
    maxDuration: 15,
    resolutions: COMMON_RESOLUTIONS,
    inputKind: 'first-last-frame',
    supports1080p: false,
  },
}

export const MINIMAX_H3_BILLING_MULTIPLIER = 2

export function getMiniMaxH3ModelInfo(
  modelName: string
): MiniMaxH3ModelInfo | null {
  return MINIMAX_H3_MODELS[modelName] ?? null
}

export function getMiniMaxH3Description(
  t: TFunction,
  modelName: string
): string | null {
  switch (modelName) {
    case 'minimax_h3_image_audio_to_video_v2_15s':
      return t(
        'MiniMax H3 long-video model driven by prompts, reference images, and reference audio, up to 15 seconds.'
      )
    case 'minimax_h3_lightx2v_v5_15s':
      return t(
        'MiniMax H3 reference-image video model with portrait, landscape, and square output, up to 15 seconds.'
      )
    case 'minimax_h3_image_audio_to_video_v2':
      return t(
        'MiniMax H3 image-and-audio driven video model with optional multi-image and multi-audio input and 1080p output.'
      )
    case 'minimax_h3_lightx2v_v5':
      return t(
        'MiniMax H3 reference-image video model for animating a single image, with optional 1080p output.'
      )
    case 'minimax_h3_lightx2v_no_pic':
      return t(
        'MiniMax H3 text-to-video model that creates a video directly from a prompt without a reference image.'
      )
    case 'minimax_h3_lightx2v':
      return t(
        'MiniMax H3 first-and-last-frame video model for generating a smooth transition between two images.'
      )
    default:
      return null
  }
}

export function getMiniMaxH3InputDescription(
  t: TFunction,
  inputKind: MiniMaxH3InputKind
): string {
  switch (inputKind) {
    case 'text':
      return t('Prompt')
    case 'reference-image':
      return t('Prompt and one publicly accessible reference image URL')
    case 'first-last-frame':
      return t(
        'Prompt and publicly accessible first-frame and last-frame image URLs'
      )
    case 'image-audio':
      return t(
        'Prompt, with optional publicly accessible reference image and audio URLs'
      )
  }
}

export function buildMiniMaxH3VideoBody(
  modelName: string
): Record<string, unknown> {
  const info = getMiniMaxH3ModelInfo(modelName)
  const body: Record<string, unknown> = {
    model: modelName,
    prompt:
      'A cinematic shot of a cat walking through a neon-lit street after rain.',
    duration: Math.min(info?.maxDuration ?? 5, 8),
    size: '768p横',
  }

  switch (info?.inputKind) {
    case 'reference-image':
      body.images = ['https://example.com/reference.jpg']
      break
    case 'first-last-frame':
      body.first_frame = 'https://example.com/first.jpg'
      body.last_frame = 'https://example.com/last.jpg'
      break
    case 'image-audio':
      body.images = ['https://example.com/reference.jpg']
      body.audio_duration = body.duration
      body.metadata = { ref_audio_0: 'https://example.com/reference.mp3' }
      break
  }

  return body
}
