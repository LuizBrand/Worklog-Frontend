import Link from 'next/link'

import { StatusChip, WlAvatar, EmptyState } from '@/components/worklog'
import { apiToUiStatus } from '@/lib/ticket-status'
import { fmtRelative } from '@/lib/worklog-meta'
import type { TicketSummary } from '@/api/generated/schemas'
import type { ApiTicketStatus } from '@/lib/ticket-status'

export interface TicketListProps {
  tickets: TicketSummary[] | undefined
  loading?: boolean
}

export function TicketList({ tickets, loading }: TicketListProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-xl p-4"
      style={{ background: 'var(--wl-surface)' }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: 'var(--wl-text-muted)' }}
        >
          Pendentes &amp; em andamento
        </span>
        <Link
          href="/tickets"
          className="rounded-md px-2 py-1 text-[12px] font-medium transition-opacity hover:opacity-80"
          style={{
            color: 'var(--primary)',
            background:
              'color-mix(in oklch, var(--primary) 10%, transparent)',
          }}
        >
          + Novo ticket
        </Link>
      </div>

      <div className="flex max-h-[340px] flex-col overflow-y-auto">
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="mb-2 h-[48px] animate-pulse rounded-lg"
              style={{ background: 'var(--wl-surface-2)' }}
            />
          ))}

        {!loading && (!tickets || tickets.length === 0) && (
          <EmptyState
            title="Nenhum ticket"
            description="Nenhum ticket encontrado."
          />
        )}

        {!loading &&
          tickets &&
          tickets.length > 0 &&
          tickets.map((t) => {
            const uiStatus = t.status
              ? apiToUiStatus(t.status as ApiTicketStatus)
              : 'OPEN'
            const clientName = t.client?.name ?? '—'
            return (
              <Link
                key={t.publicId}
                href={`/tickets/${t.publicId}`}
                className="-mx-1 flex items-center gap-2 rounded-lg px-1 py-2.5 transition-colors hover:bg-[var(--wl-surface-2)]"
              >
                <StatusChip status={uiStatus} size="sm" />
                <span
                  className="min-w-0 flex-1 truncate text-[13px] font-medium"
                  style={{ color: 'var(--wl-text)' }}
                >
                  {t.title ?? '(sem título)'}
                </span>
                <WlAvatar name={clientName} size={24} />
                <span
                  className="shrink-0 text-[11px]"
                  style={{ color: 'var(--wl-text-muted)' }}
                >
                  {fmtRelative(t.updatedAt)}
                </span>
              </Link>
            )
          })}
      </div>
    </div>
  )
}
