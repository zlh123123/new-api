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
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CustomerServiceQRCodes } from '../customer-service-qr-codes'

describe('CustomerServiceQRCodes', () => {
  it('renders both customer-service QR codes as separate zoomable links', () => {
    render(<CustomerServiceQRCodes />)

    const images = screen.getAllByRole('img', {
      name: /Customer service QR code/i,
    })
    const links = screen.getAllByRole('link', {
      name: /Customer service QR code/i,
    })

    expect(images).toHaveLength(2)
    expect(images[0]).not.toHaveAttribute('src', images[1].getAttribute('src'))
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute('target', '_blank')
    expect(links[1]).toHaveAttribute('target', '_blank')
  })
})
