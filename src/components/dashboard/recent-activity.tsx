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
      style={{ background: 'var(--wl-surface)' }}
    >
      <span
        className="text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: 'var(--wl-text-muted)' }}
      >
        Atividade recente
      </span>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {loading &&
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-[120px] w-[260px] shrink-0 animate-pulse rounded-lg"
              style={{ background: 'var(--wl-surface-2)' }}
            />
          ))}

        {!loading && (!tickets || tickets.length === 0) && (
          <EmptyState
            title="Nenhum ticket"
            description="Ainda não há tickets registrados."
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
                className="flex w-[260px] shrink-0 flex-col gap-2 rounded-lg p-3 transition-opacity hover:opacity-80"
                style={{ background: 'var(--wl-surface-2)' }}
              >
                <div className="flex items-center justify-between gap-2">
                  <StatusChip status={uiStatus} size="sm" />
                  <span
                    className="text-[11px]"
                    style={{ color: 'var(--wl-text-muted)' }}
                  >
                    {fmtRelative(t.updatedAt)}
                  </span>
                </div>
                <span
                  className="line-clamp-2 text-[13px] font-medium leading-snug"
                  style={{ color: 'var(--wl-text)' }}
                >
                  {t.title ?? '(sem título)'}
                </span>
                <div className="mt-auto flex items-center gap-2">
                  <WlAvatar name={clientName} size={20} />
                  <span
                    className="truncate text-[11px]"
                    style={{ color: 'var(--wl-text-muted)' }}
                  >
                    {clientName}
                  </span>
                  {t.system?.name && (
                    <>
                      <span style={{ color: 'var(--wl-text-muted)' }}>·</span>
                      <span
                        className="truncate text-[11px]"
                        style={{ color: 'var(--wl-text-muted)' }}
                      >
                        {t.system.name}
                      </span>
                    </>
                  )}
                </div>
              </Link>
            )
          })}
      </div>
    </div>
  )
}
