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
import { describe, expect, it } from 'vitest'

import type { PricingModel } from '../../types'
import { buildMiniMaxH3VideoBody, getMiniMaxH3ModelInfo } from '../minimax-h3'
import { formatFixedUsagePrice } from '../price'

const VIDEO_MODEL: PricingModel = {
  id: 1,
  model_name: 'minimax_h3_image_audio_to_video_v2',
  quota_type: 1,
  model_ratio: 0,
  completion_ratio: 0,
  model_price: 0.4,
  enable_groups: ['default'],
}

describe('MiniMax H3 model catalog', () => {
  it('keeps the two 1080p billing multipliers distinct', () => {
    expect(
      getMiniMaxH3ModelInfo('minimax_h3_image_audio_to_video_v2')
        ?.resolution1080pMultiplier
    ).toBe(11)
    expect(
      getMiniMaxH3ModelInfo('minimax_h3_lightx2v_v5')?.resolution1080pMultiplier
    ).toBe(10)
  })

  it('shows the final per-second price instead of the internal base price', () => {
    expect(formatFixedUsagePrice(VIDEO_MODEL, 2)).toBe('$0.8')
    expect(formatFixedUsagePrice(VIDEO_MODEL, 2 * 11)).toBe('$8.8')
  })

  it('builds a first-and-last-frame request with both required images', () => {
    const body = buildMiniMaxH3VideoBody('minimax_h3_lightx2v')

    expect(body.first_frame).toBe('https://example.com/first.jpg')
    expect(body.last_frame).toBe('https://example.com/last.jpg')
  })

  it('builds a reference-image request with the images field', () => {
    const body = buildMiniMaxH3VideoBody('minimax_h3_lightx2v_v5')

    expect(body.images).toEqual(['https://example.com/reference.jpg'])
  })
})
