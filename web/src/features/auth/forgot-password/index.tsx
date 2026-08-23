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
import { Link } from '@tanstack/react-router'
import { Headphones, LogIn } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { customerServiceQRCode } from '@/lib/customer-service'

import { AuthLayout } from '../auth-layout'

export function ForgotPassword() {
  const { t } = useTranslation()
  return (
    <AuthLayout>
      <div className='w-full space-y-8'>
        <div className='space-y-3'>
          <h2 className='text-center text-2xl font-semibold tracking-tight sm:text-left'>
            {t('Forgot password')}
          </h2>
          <p className='text-muted-foreground text-left text-sm sm:text-base'>
            {t(
              'Password recovery is handled by customer service. Scan the QR code below and contact us to reset your password.'
            )}
          </p>
        </div>

        <Card>
          <CardContent className='flex flex-col items-center gap-5 pt-6 text-center'>
            <div className='bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full'>
              <Headphones className='size-6' />
            </div>
            <div className='space-y-1'>
              <p className='font-semibold'>{t('Contact customer service')}</p>
              <p className='text-muted-foreground text-sm'>
                {t(
                  'Tell customer service your username. Do not share your API key or current password.'
                )}
              </p>
            </div>
            <img
              src={customerServiceQRCode}
              alt={t('Customer service QR code')}
              className='aspect-square w-56 rounded-2xl border bg-white object-contain p-3'
            />
          </CardContent>
        </Card>

        <Button
          variant='outline'
          className='w-full'
          render={<Link to='/sign-in' />}
        >
          <LogIn className='size-4' /> {t('Back to sign in')}
        </Button>
      </div>
    </AuthLayout>
  )
}
