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
import { api } from '@/lib/http-client'

export {
  applyAuthBundle,
  applyAuthRotation,
  bootstrapAuthentication,
  clearAuthenticatedClientState,
  clearAuthentication,
  getCommonHeaders,
  getFreshAuthHeaders,
  isAuthBundle,
  refreshAuthentication,
  AuthRotationError,
} from '@/lib/auth-session'
export type { AuthTokenRotation, RefreshOutcome } from '@/lib/auth-session'
export { api }
export type { ApiRequestConfig } from '@/lib/http-client'

// ============================================================================
// User APIs
// ============================================================================

export async function getSelf() {
  const res = await api.get('/api/user/self', {
    skipErrorHandler: true,
  })
  return res.data
}

export async function getUserModels(): Promise<{
  success: boolean
  message?: string
  data?: string[]
}> {
  const res = await api.get('/api/user/models')
  return res.data
}

export async function getUserGroups(): Promise<{
  success: boolean
  message?: string
  data?: Record<string, { desc: string; ratio: number | string }>
}> {
  const res = await api.get('/api/user/self/groups')
  return res.data
}

// ============================================================================
// System APIs
// ============================================================================

export async function getStatus() {
  const res = await api.get('/api/status')
  return res.data?.data as Record<string, unknown>
}

export async function getNotice(): Promise<{
  success: boolean
  message?: string
  data?: string
}> {
  const res = await api.get('/api/notice')
  return res.data
}

// ============================================================================
// 2FA Management APIs
// ============================================================================

export async function get2FAStatus() {
  const res = await api.get('/api/user/2fa/status')
  return res.data
}

export async function setup2FA() {
  const res = await api.post('/api/user/2fa/setup')
  return res.data
}

export async function enable2FA(code: string) {
  const res = await api.post(
    '/api/user/2fa/enable',
    { code },
    { acceptAuthRotation: true }
  )
  return res.data
}

export async function disable2FA(code: string) {
  const res = await api.post(
    '/api/user/2fa/disable',
    { code },
    { acceptAuthRotation: true }
  )
  return res.data
}

export async function regenerate2FABackupCodes(code: string) {
  const res = await api.post(
    '/api/user/2fa/backup_codes',
    { code },
    { acceptAuthRotation: true }
  )
  return res.data
}

// Support ticket APIs
export async function listSupportTickets() {
  const res = await api.get('/api/support/tickets')
  return res.data?.data ?? []
}
export async function getSupportTicket(id: number) {
  const res = await api.get(`/api/support/tickets/${id}`)
  return res.data?.data
}
export async function createSupportTicket(input: { subject: string; category?: string; content: string; files?: File[] }) {
  const form = new FormData(); form.append('subject', input.subject); form.append('category', input.category ?? ''); form.append('content', input.content)
  input.files?.forEach((file) => form.append('files', file))
  const res = await api.post('/api/support/tickets', form); return res.data?.data
}
export async function replySupportTicket(id: number, content: string, files?: File[]) {
  const form = new FormData(); form.append('content', content); files?.forEach((file) => form.append('files', file))
  const res = await api.post(`/api/support/tickets/${id}/messages`, form); return res.data?.data
}
export async function updateSupportTicketStatus(id: number, status: 'open' | 'closed') {
  const res = await api.put(`/api/support/tickets/${id}/status`, { status }); return res.data?.data
}
export async function listSupportNotifications(unreadOnly = false) {
  const res = await api.get('/api/support/notifications', { params: { unread_only: unreadOnly } }); return res.data?.data ?? { items: [], unread_count: 0 }
}
export async function markSupportNotificationRead(id: number) { await api.post(`/api/support/notifications/${id}/read`) }
export async function markAllSupportNotificationsRead() { await api.post('/api/support/notifications/read-all') }
