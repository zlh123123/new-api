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
import { AnimatedOutlet } from '@/components/page-transition'
import { SkipToMain } from '@/components/skip-to-main'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { listSupportNotifications, markSupportNotificationRead } from '@/lib/api'
import { toast } from 'sonner'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { AppHeader } from './app-header'
import { AppSidebar } from './app-sidebar'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

export function AuthenticatedLayout(props: AuthenticatedLayoutProps) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.auth.user)
  const seen = useRef(new Set<number>())
  useEffect(() => {
    if (!user) return
    let active = true
    const poll = async () => {
      try {
        const result = await listSupportNotifications(true)
        if (!active) return
        for (const item of result.items ?? []) {
          if (!seen.current.has(item.id)) {
            seen.current.add(item.id)
            const titleKey =
              item.type === 'ticket_reply'
                ? 'Support replied'
                : item.type === 'ticket_created'
                  ? 'New support ticket'
                  : item.type === 'ticket_message'
                    ? 'Support ticket updated'
                    : item.title
            toast.info(t(titleKey), { description: item.content, action: { label: t('View'), onClick: () => { window.location.href = `/support` } } })
            void markSupportNotificationRead(item.id)
          }
        }
      } catch { /* notification polling is best effort */ }
    }
    void poll(); const timer = window.setInterval(poll, 30000)
    return () => { active = false; window.clearInterval(timer) }
  }, [user, t])

  return (
    <LayoutProvider>
      <SearchProvider>
        <SidebarProvider defaultOpen={defaultOpen} className='flex-col'>
          <SkipToMain />
          <AppHeader />
          <div className='flex min-h-0 w-full flex-1'>
            <AppSidebar />
            <SidebarInset
              className={cn(
                '@container/content',
                'h-[calc(100svh-var(--app-header-height,0px))]',
                'min-h-0 overflow-hidden',
                'peer-data-[variant=inset]:h-[calc(100svh-var(--app-header-height,0px)-(var(--spacing)*4))]'
              )}
            >
              {props.children ?? <AnimatedOutlet />}
            </SidebarInset>
          </div>
        </SidebarProvider>
      </SearchProvider>
    </LayoutProvider>
  )
}
