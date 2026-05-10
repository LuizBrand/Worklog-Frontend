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

export function invalidateClients(qc: QueryClient): Promise<void> {
  return qc.invalidateQueries({ queryKey: ['/clients'] })
}

export function invalidateClient(qc: QueryClient, publicId: string): Promise<void> {
  return qc.invalidateQueries({ queryKey: [`/clients/${publicId}`] })
}

export function invalidateSystems(qc: QueryClient): Promise<void> {
  return qc.invalidateQueries({ queryKey: ['/systems'] })
}

export function invalidateSystem(qc: QueryClient, publicId: string): Promise<void> {
  return qc.invalidateQueries({ queryKey: [`/systems/${publicId}`] })
}

export function invalidateUsers(qc: QueryClient): Promise<void> {
  return qc.invalidateQueries({ queryKey: ['/users/'] })
}
