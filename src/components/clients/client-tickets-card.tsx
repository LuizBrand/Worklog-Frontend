'use client'

import { useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { useFindAllTickets } from '@/api/generated/tickets/tickets'
import { EntityCard, StatusChip } from '@/components/worklog'
import { fmtDate } from '@/lib/worklog-meta'
import { apiToUiStatus, type ApiTicketStatus } from '@/lib/ticket-status'
import type { PageTicketSummary, TicketSummary } from '@/api/generated/schemas'

type Tab = 'inProgress' | 'pending' | 'all'

const TABS: { id: Tab; label: string }[] = [
  { id: 'inProgress', label: 'Em andamento' },
  { id: 'pending', label: 'Solicitados' },
  { id: 'all', label: 'Todos' },
]

const IN_PROGRESS_STATUSES = new Set(['AWAITING_CUSTOMER', 'AWAITING_DEVELOPMENT'])

export interface ClientTicketsCardProps {
  clientPublicId: string
  onTicketClick?: (publicId: string) => void
}

export function ClientTicketsCard({ clientPublicId, onTicketClick }: ClientTicketsCardProps) {
  const [tab, setTab] = useState<Tab>('inProgress')

  // `clientId` é filtro de servidor; as abas separam status em memória porque o
  // endpoint aceita um status só e "em andamento" são dois.
  const ticketsQ = useFindAllTickets({
    filters: { clientId: clientPublicId },
    pageable: { page: 0, size: 100, sort: ['updatedAt,desc'] },
  })

  const tickets = useMemo<TicketSummary[]>(() => {
    const page = ticketsQ.data as PageTicketSummary | undefined
    const rows = page?.content ?? []
    if (tab === 'pending') return rows.filter((t) => t.status === 'PENDING')
    if (tab === 'inProgress') return rows.filter((t) => t.status && IN_PROGRESS_STATUSES.has(t.status))
    return rows
  }, [ticketsQ.data, tab])

  return (
    <EntityCard>
      <div
        className="flex flex-wrap items-center gap-2 px-5 py-3.5"
        style={{ borderBottom: '1px solid var(--wl-border)' }}
      >
        <h2 className="text-[14px] font-semibold" style={{ color: 'var(--wl-text)' }}>
          Tickets do cliente
        </h2>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="cursor-pointer rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors"
              style={{
                background: tab === t.id ? 'var(--primary)' : 'transparent',
                color: tab === t.id ? '#fff' : 'var(--wl-text-muted)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {ticketsQ.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={18} className="animate-spin" style={{ color: 'var(--wl-text-muted)' }} />
        </div>
      ) : tickets.length === 0 ? (
        <p className="py-10 text-center text-[13px]" style={{ color: 'var(--wl-text-muted)' }}>
          Nenhum ticket neste filtro.
        </p>
      ) : (
        <div>
          {tickets.map((t, idx) => (
            <div
              key={t.publicId}
              onClick={() => t.publicId && onTicketClick?.(t.publicId)}
              className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--wl-surface-2)]"
              style={{
                borderTop: idx > 0 ? '1px solid var(--wl-border)' : undefined,
                cursor: onTicketClick ? 'pointer' : undefined,
              }}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold" style={{ color: 'var(--wl-text)' }}>
                  {t.title}
                </p>
                <p className="text-[11px] tabular-nums" style={{ color: 'var(--wl-text-muted)' }}>
                  #{t.publicId?.slice(0, 6) ?? '—'} · aberto em {fmtDate(t.createdAt)}
                </p>
              </div>
              {/* A UI tem vocabulário próprio de status; `STATUS_META` não indexa
                  os valores da API. Sem o mapa, `PENDING` quebra o StatusChip. */}
              {t.status && <StatusChip status={apiToUiStatus(t.status as ApiTicketStatus)} size="sm" />}
            </div>
          ))}
        </div>
      )}
    </EntityCard>
  )
}
