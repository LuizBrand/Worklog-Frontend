import type { TicketStatus } from '@/lib/worklog-meta'
import { TicketResponseStatus } from '@/api/generated/schemas/ticketResponseStatus'

export type ApiTicketStatus = (typeof TicketResponseStatus)[keyof typeof TicketResponseStatus]

export type UiWritableStatus = Exclude<TicketStatus, 'CANCELLED'>

export const UI_STATUS_WRITABLE: readonly UiWritableStatus[] = [
  'OPEN',
  'IN_PROGRESS',
  'AWAITING_DEV',
  'RESOLVED',
] as const

// Backend has 4 states, mockups define 5. CANCELLED is UI-only until
// the backend supports it — see memory/plan.md "Locked Decisions" #1.
const API_TO_UI: Record<ApiTicketStatus, UiWritableStatus> = {
  PENDING: 'OPEN',
  AWAITING_CUSTOMER: 'IN_PROGRESS',
  AWAITING_DEVELOPMENT: 'AWAITING_DEV',
  COMPLETED: 'RESOLVED',
}

const UI_TO_API: Record<UiWritableStatus, ApiTicketStatus> = {
  OPEN: 'PENDING',
  IN_PROGRESS: 'AWAITING_CUSTOMER',
  AWAITING_DEV: 'AWAITING_DEVELOPMENT',
  RESOLVED: 'COMPLETED',
}

export function apiToUiStatus(api: ApiTicketStatus): UiWritableStatus {
  return API_TO_UI[api]
}

export function uiToApiStatus(ui: UiWritableStatus): ApiTicketStatus {
  return UI_TO_API[ui]
}
