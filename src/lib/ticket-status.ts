import type { TicketStatus } from '@/lib/worklog-meta'
import { TicketResponseStatus } from '@/api/generated/schemas/ticketResponseStatus'

export type ApiTicketStatus = (typeof TicketResponseStatus)[keyof typeof TicketResponseStatus]

export type UiWritableStatus = TicketStatus

// Creatable: status options exposed in the "Novo ticket" dialog. CANCELLED
// is intentionally absent — you cannot create a ticket already cancelled.
export const UI_STATUS_WRITABLE: readonly UiWritableStatus[] = [
  'OPEN',
  'IN_PROGRESS',
  'AWAITING_DEV',
  'RESOLVED',
] as const

// Editable: status options exposed in the edit dialog and the detail
// panel's status switcher. Includes CANCELLED.
export const UI_STATUS_EDITABLE: readonly UiWritableStatus[] = [
  ...UI_STATUS_WRITABLE,
  'CANCELLED',
] as const

const API_TO_UI: Record<ApiTicketStatus, UiWritableStatus> = {
  PENDING: 'OPEN',
  AWAITING_CUSTOMER: 'IN_PROGRESS',
  AWAITING_DEVELOPMENT: 'AWAITING_DEV',
  COMPLETED: 'RESOLVED',
  CANCELLED: 'CANCELLED',
}

const UI_TO_API: Record<UiWritableStatus, ApiTicketStatus> = {
  OPEN: 'PENDING',
  IN_PROGRESS: 'AWAITING_CUSTOMER',
  AWAITING_DEV: 'AWAITING_DEVELOPMENT',
  RESOLVED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
}

export function apiToUiStatus(api: ApiTicketStatus): UiWritableStatus {
  return API_TO_UI[api]
}

export function uiToApiStatus(ui: UiWritableStatus): ApiTicketStatus {
  return UI_TO_API[ui]
}
