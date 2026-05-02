import Link from 'next/link'

import { StatusChip, WlAvatar, EmptyState } from '@/components/worklog'
import { apiToUiStatus } from '@/lib/ticket-status'
import { fmtRelative } from '@/lib/worklog-meta'
import type { TicketSummary } from '@/api/generated/schemas'
import type { ApiTicketStatus } from '@/lib/ticket-status'

export interface RecentActivityProps {
  tickets: TicketSummary[] | undefined
  loading?: boolean
}

export function RecentActivity({ tickets, loading }: RecentActivityProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-xl p-4"
      style={{ background: 'var(--wl-surface-1)' }}
    >
      <span
        className="text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: 'var(--wl-text-muted)' }}
      >
        Atividade recente
      </span>

      {loading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-[46px] animate-pulse rounded-lg"
              style={{ background: 'var(--wl-surface-2)' }}
            />
          ))}
        </div>
      )}

      {!loading && (!tickets || tickets.length === 0) && (
        <EmptyState
          title="Nenhum ticket"
          description="Ainda não há tickets registrados."
        />
      )}

      {!loading && tickets && tickets.length > 0 && (
        <div className="flex flex-col">
          {tickets.map((t) => {
            const uiStatus = t.status
              ? apiToUiStatus(t.status as ApiTicketStatus)
              : 'OPEN'
            const clientName = t.client?.name ?? '—'
            return (
              <Link
                key={t.publicId}
                href={`/tickets/${t.publicId}`}
                className="-mx-2 flex items-start gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-[var(--wl-surface-2)]"
              >
                <WlAvatar name={clientName} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="truncate text-[13px] font-medium"
                      style={{ color: 'var(--wl-text)' }}
                    >
                      {t.title ?? '(sem título)'}
                    </span>
                    <StatusChip status={uiStatus} size="sm" />
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span
                      className="text-[11px]"
                      style={{ color: 'var(--wl-text-muted)' }}
                    >
                      {clientName}
                    </span>
                    {t.system?.name && (
                      <>
                        <span style={{ color: 'var(--wl-text-muted)' }}>·</span>
                        <span
                          className="text-[11px]"
                          style={{ color: 'var(--wl-text-muted)' }}
                        >
                          {t.system.name}
                        </span>
                      </>
                    )}
                    <span
                      className="ml-auto text-[11px]"
                      style={{ color: 'var(--wl-text-muted)' }}
                    >
                      {fmtRelative(t.updatedAt)}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
