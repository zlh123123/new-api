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
import { useTranslation } from 'react-i18next'

import { customerServiceQRCodes } from '@/lib/customer-service'
import { cn } from '@/lib/utils'

interface CustomerServiceQRCodesProps {
  compact?: boolean
  className?: string
}

export function CustomerServiceQRCodes(props: CustomerServiceQRCodesProps) {
  const { t } = useTranslation()

  return (
    <div className={cn('grid w-full grid-cols-2 gap-2.5', props.className)}>
      {customerServiceQRCodes.map((qrCode, index) => {
        const accessibleName = `${t('Customer service QR code')} ${index + 1}`

        return (
          <a
            key={qrCode}
            href={qrCode}
            target='_blank'
            rel='noopener noreferrer'
            aria-label={accessibleName}
            className='overflow-hidden rounded-xl border bg-white transition-opacity hover:opacity-90'
          >
            <img
              src={qrCode}
              alt={accessibleName}
              className={cn(
                'w-full object-contain p-2',
                props.compact ? 'h-52' : 'h-64'
              )}
            />
          </a>
        )
      })}
    </div>
  )
}
