import Link from 'next/link'

import { StatusChip, EmptyState } from '@/components/worklog'
import { apiToUiStatus } from '@/lib/ticket-status'
import { fmtRelative, STATUS_META } from '@/lib/worklog-meta'
import type { TicketSummary } from '@/api/generated/schemas'
import type { ApiTicketStatus } from '@/lib/ticket-status'

export interface TicketListProps {
  tickets: TicketSummary[] | undefined
  loading?: boolean
  totalCount?: number
}

export function TicketList({ tickets, loading, totalCount }: TicketListProps) {
  return (
    <div
      className="flex flex-col gap-2 rounded-xl p-4"
      style={{ background: 'var(--wl-surface)' }}
    >
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px]" style={{ color: 'var(--wl-text-muted)' }}>
            ⚠
          </span>
          <span
            className="text-[13px] font-semibold"
            style={{ color: 'var(--wl-text)' }}
          >
            Pendentes &amp; em andamento
          </span>
          {totalCount !== undefined && !loading && (
            <span
              className="text-[13px] font-semibold tabular-nums"
              style={{ color: 'var(--wl-text-muted)' }}
            >
              {totalCount}
            </span>
          )}
        </div>
        <Link
          href="/tickets"
          className="rounded-md px-3 py-1 text-[12px] font-semibold transition-opacity hover:opacity-80"
          style={{
            color: 'var(--primary)',
            background: 'color-mix(in oklch, var(--primary) 15%, transparent)',
          }}
        >
          + Novo ticket
        </Link>
      </div>

      <div className="flex flex-col">
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="mb-1.5 h-[56px] animate-pulse rounded-lg"
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
            const meta = STATUS_META[uiStatus]
            const clientName = t.client?.name ?? '—'
            return (
              <Link
                key={t.publicId}
                href={`/tickets/${t.publicId}`}
                className="group flex items-stretch overflow-hidden rounded-lg transition-colors hover:bg-[var(--wl-surface-2)]"
              >
                {/* Left status accent */}
                <div
                  className="w-[3px] shrink-0"
                  style={{ background: meta.color }}
                />

                <div className="flex flex-1 items-center gap-3 px-3 py-3">
                  {/* Title + client/system */}
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-[13px] font-semibold"
                      style={{ color: 'var(--wl-text)' }}
                    >
                      {t.title ?? '(sem título)'}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1">
                      <span
                        className="truncate text-[11px]"
                        style={{ color: 'var(--wl-text-muted)' }}
                      >
                        {clientName}
                      </span>
                      {t.system?.name && (
                        <>
                          <span
                            className="text-[11px]"
                            style={{ color: 'var(--wl-text-muted)' }}
                          >
                            ·
                          </span>
                          <span
                            className="truncate text-[11px]"
                            style={{ color: 'var(--primary)' }}
                          >
                            {t.system.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: status + date + arrow */}
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusChip status={uiStatus} size="sm" />
                    <span
                      className="text-[11px] tabular-nums"
                      style={{ color: 'var(--wl-text-muted)' }}
                    >
                      {fmtRelative(t.updatedAt)}
                    </span>
                    <span
                      className="text-[12px] opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ color: 'var(--wl-text-muted)' }}
                    >
                      →
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
      </div>
    </div>
  )
}
