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
import { describe, expect, test } from 'vitest'

import {
  CHANNEL_TYPE_AUTODL,
  CHANNEL_TYPE_OPTIONS,
  MODEL_FETCHABLE_TYPES,
} from '../../constants'
import { getChannelTypeConfig } from '../channel-type-config'
import { getChannelTypeIcon, getKeyPromptForType } from '../channel-utils'

const AUTODL_MODELS = [
  'minimax_h3_image_audio_to_video_v2_15s',
  'minimax_h3_lightx2v_v5_15s',
  'minimax_h3_image_audio_to_video_v2',
  'minimax_h3_lightx2v_v5',
  'minimax_h3_lightx2v_no_pic',
  'minimax_h3_lightx2v',
]

describe('AutoDL video generation channel', () => {
  test('registers a dedicated selectable channel type', () => {
    expect(
      CHANNEL_TYPE_OPTIONS.find(
        (option) => option.value === CHANNEL_TYPE_AUTODL
      )
    ).toEqual({
      value: CHANNEL_TYPE_AUTODL,
      label: 'AutoDL Video Generation',
    })
    expect(getChannelTypeIcon(CHANNEL_TYPE_AUTODL)).toBe('ComfyUI')
    expect(MODEL_FETCHABLE_TYPES.has(CHANNEL_TYPE_AUTODL)).toBe(false)
  })

  test('provides AutoDL defaults and only the supported workflows', () => {
    const config = getChannelTypeConfig(CHANNEL_TYPE_AUTODL)

    expect(config.defaultBaseUrl).toBe('https://autodl.art')
    expect(config.supportedModels).toEqual(AUTODL_MODELS)
    expect(getKeyPromptForType(CHANNEL_TYPE_AUTODL)).toBe(
      'Enter AutoDL API token'
    )
  })
})
