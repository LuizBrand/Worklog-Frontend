'use client'

import { useFindAllTickets } from '@/api/generated/tickets/tickets'
import { TicketFiltersParamsStatus } from '@/api/generated/schemas'
import { apiToUiStatus } from '@/lib/ticket-status'
import type { ApiTicketStatus } from '@/lib/ticket-status'
import type { PageTicketSummary } from '@/api/generated/schemas'
import { StatsBar } from '@/components/dashboard/stats-bar'
import { TicketList } from '@/components/dashboard/ticket-list'
import { StatusDonut } from '@/components/dashboard/status-donut'
import { PriorityDistribution } from '@/components/dashboard/priority-distribution'
import { QuickFilters } from '@/components/dashboard/quick-filters'
import { RecentActivity } from '@/components/dashboard/recent-activity'

const API_STATUSES = [
  TicketFiltersParamsStatus.PENDING,
  TicketFiltersParamsStatus.AWAITING_CUSTOMER,
  TicketFiltersParamsStatus.AWAITING_DEVELOPMENT,
  TicketFiltersParamsStatus.COMPLETED,
] as const

export default function DashboardPage() {
  const pendingQ = useFindAllTickets({
    filters: { status: TicketFiltersParamsStatus.PENDING },
    pageable: { page: 0, size: 1 },
  })
  const awaitingCustomerQ = useFindAllTickets({
    filters: { status: TicketFiltersParamsStatus.AWAITING_CUSTOMER },
    pageable: { page: 0, size: 1 },
  })
  const awaitingDevQ = useFindAllTickets({
    filters: { status: TicketFiltersParamsStatus.AWAITING_DEVELOPMENT },
    pageable: { page: 0, size: 1 },
  })
  const completedQ = useFindAllTickets({
    filters: { status: TicketFiltersParamsStatus.COMPLETED },
    pageable: { page: 0, size: 1 },
  })
  const recentQ = useFindAllTickets({
    filters: {},
    pageable: { page: 0, size: 8, sort: ['updatedAt,desc'] },
  })

  const countsLoading =
    pendingQ.isLoading ||
    awaitingCustomerQ.isLoading ||
    awaitingDevQ.isLoading ||
    completedQ.isLoading

  // GET /tickets 200-response is typed as TicketSummary in the generated
  // code because the backend OpenAPI spec has the 200 and 401 schemas
  // swapped. Cast to the correct type at the call site.
  const toPage = (data: unknown) => data as PageTicketSummary | undefined

  const statusCounts = API_STATUSES.map((apiStatus) => {
    const q = {
      [TicketFiltersParamsStatus.PENDING]: pendingQ,
      [TicketFiltersParamsStatus.AWAITING_CUSTOMER]: awaitingCustomerQ,
      [TicketFiltersParamsStatus.AWAITING_DEVELOPMENT]: awaitingDevQ,
      [TicketFiltersParamsStatus.COMPLETED]: completedQ,
    }[apiStatus]
    return {
      status: apiToUiStatus(apiStatus as ApiTicketStatus),
      count: toPage(q.data)?.totalElements ?? 0,
    }
  })

  const recentTickets = toPage(recentQ.data)?.content
  const pendingTotal =
    (toPage(pendingQ.data)?.totalElements ?? 0) +
    (toPage(awaitingCustomerQ.data)?.totalElements ?? 0)

  return (
    <main className="flex flex-col gap-4 p-4 md:p-6">
      <StatsBar statusCounts={statusCounts} loading={countsLoading} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <TicketList
          tickets={recentTickets}
          loading={recentQ.isLoading}
          totalCount={countsLoading ? undefined : pendingTotal}
        />

        <div className="flex flex-col gap-4">
          <StatusDonut data={statusCounts} loading={countsLoading} />
          <PriorityDistribution />
          <QuickFilters />
        </div>
      </div>

      <RecentActivity tickets={recentTickets} loading={recentQ.isLoading} />
    </main>
  )
}
