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
      className="flex flex-col rounded-xl p-4 lg:h-[660px]"
      style={{ background: 'var(--wl-surface)', border: '1px solid var(--wl-border)' }}
    >
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[13px]" style={{ color: 'var(--status-open)' }}>
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
              className="rounded px-1.5 py-0.5 text-[11px] font-bold tabular-nums"
              style={{
                background: 'color-mix(in oklch, var(--status-open) 18%, transparent)',
                color: 'var(--status-open)',
              }}
            >
              {totalCount}
            </span>
          )}
        </div>
        <Link
          href="/tickets"
          className="rounded-md px-3 py-1.5 text-[12px] font-semibold transition-opacity hover:opacity-85"
          style={{
            color: '#fff',
            background: 'var(--primary)',
          }}
        >
          + Novo ticket
        </Link>
      </div>

      <div style={{ height: 1, background: 'var(--wl-border)', flexShrink: 0 }} />

      <div className="scroll-hide mt-3 flex flex-col overflow-y-auto">
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
          tickets.map((t, idx) => {
            const uiStatus = t.status
              ? apiToUiStatus(t.status as ApiTicketStatus)
              : 'OPEN'
            const meta = STATUS_META[uiStatus]
            const clientName = t.client?.name ?? '—'
            return (
              <div key={t.publicId}>
              {idx > 0 && (
                <div style={{ height: 1, background: 'var(--wl-border)' }} />
              )}
              <Link
                href={`/tickets/${t.publicId}`}
                className="group flex items-stretch rounded-lg transition-colors hover:bg-[var(--wl-surface-2)]"
              >
                {/* Left status accent — inset pill */}
                <div
                  className="ml-[3px] w-[2px] shrink-0 rounded-full my-2.5"
                  style={{ background: meta.color }}
                />

                <div className="flex flex-1 items-center gap-3 px-3 py-3">
                  {/* Title row (with status chip) + client/system */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className="flex-1 truncate text-[13px] font-semibold"
                        style={{ color: 'var(--wl-text)' }}
                      >
                        {t.title ?? '(sem título)'}
                      </p>
                      <div className="shrink-0">
                        <StatusChip status={uiStatus} size="sm" />
                      </div>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1">
                      <span
                        className="truncate text-[11px] font-medium"
                        style={{ color: 'var(--primary)' }}
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
                            style={{ color: 'var(--wl-text-muted)' }}
                          >
                            {t.system.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: date + arrow */}
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className="w-[60px] text-right text-[11px] tabular-nums"
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
              </div>
            )
          })}
      </div>
    </div>
  )
}
