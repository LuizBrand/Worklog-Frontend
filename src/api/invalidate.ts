import type { QueryClient } from '@tanstack/react-query'

export function invalidateTickets(qc: QueryClient): Promise<void> {
  return qc.invalidateQueries({ queryKey: ['/tickets'] })
}

export function invalidateTicket(qc: QueryClient, publicId: string): Promise<void> {
  return qc.invalidateQueries({ queryKey: [`/tickets/${publicId}`] })
}

export function invalidateTicketLogs(qc: QueryClient, publicId: string): Promise<void> {
  return qc.invalidateQueries({ queryKey: [`/tickets/${publicId}/logs`] })
}
