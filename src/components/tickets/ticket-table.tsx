import { StatusChip, WlAvatar, EmptyState } from '@/components/worklog'
import { apiToUiStatus } from '@/lib/ticket-status'
import { fmtDateTime } from '@/lib/worklog-meta'
import type { TicketSummary } from '@/api/generated/schemas'
import type { ApiTicketStatus } from '@/lib/ticket-status'

function fmtId(publicId: string | undefined): string {
  if (!publicId) return '—'
  const dash = publicId.indexOf('-')
  if (dash === -1) return publicId
  const prefix = publicId.slice(0, dash)
  const suffix = publicId.slice(dash + 1)
  if (suffix.length <= 7) return publicId
  return `${prefix}-···${suffix.slice(-5)}`
}

export interface TicketTableProps {
  tickets: TicketSummary[]
  loading?: boolean
  onRowClick?: (publicId: string) => void
}

const COLS = ['ID', 'TÍTULO', 'STATUS', 'PRIORIDADE', 'CLIENTE', 'SISTEMA', 'AUTOR', 'ATUALIZADO'] as const

export function TicketTable({ tickets, loading, onRowClick }: TicketTableProps) {
  return (
    <div className="scroll-hide flex-1 overflow-y-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--wl-border)' }}>
            {COLS.map((col) => (
              <th
                key={col}
                className="whitespace-nowrap px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: 'var(--wl-text-muted)' }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading &&
            Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} style={{ borderTop: i > 0 ? '1px solid var(--wl-border)' : undefined }}>
                {COLS.map((col) => (
                  <td key={col} className="px-4 py-3">
                    <div
                      className="h-4 animate-pulse rounded"
                      style={{ background: 'var(--wl-surface-2)', width: col === 'TÍTULO' ? '70%' : '60%' }}
                    />
                  </td>
                ))}
              </tr>
            ))}

          {!loading && tickets.length === 0 && (
            <tr>
              <td colSpan={COLS.length} className="px-4 py-16 text-center">
                <EmptyState title="Nenhum ticket" description="Nenhum ticket encontrado para os filtros aplicados." />
              </td>
            </tr>
          )}

          {!loading &&
            tickets.map((t, idx) => {
              const uiStatus = t.status ? apiToUiStatus(t.status as ApiTicketStatus) : 'OPEN'
              const clientName = t.client?.name ?? '—'
              const authorName = t.user?.name ?? '—'

              return (
                <tr
                  key={t.publicId}
                  onClick={() => t.publicId && onRowClick?.(t.publicId)}
                  className="group transition-colors hover:bg-[var(--wl-surface-2)]"
                  style={{
                    borderTop: idx > 0 ? '1px solid var(--wl-border)' : undefined,
                    cursor: onRowClick ? 'pointer' : undefined,
                  }}
                >
                  {/* ID */}
                  <td className="px-4 py-3">
                    <span className="font-mono text-[12px]" style={{ color: 'var(--wl-text-muted)' }}>
                      {fmtId(t.publicId)}
                    </span>
                  </td>

                  {/* TÍTULO */}
                  <td className="max-w-[360px] px-4 py-3">
                    <span
                      className="line-clamp-1 text-[13px] font-medium"
                      style={{ color: 'var(--wl-text)' }}
                    >
                      {t.title ?? '(sem título)'}
                    </span>
                  </td>

                  {/* STATUS */}
                  <td className="px-4 py-3">
                    <StatusChip status={uiStatus} size="sm" />
                  </td>

                  {/* PRIORIDADE — sem campo no backend */}
                  <td className="px-4 py-3">
                    <span className="text-[13px]" style={{ color: 'var(--wl-text-muted)' }}>—</span>
                  </td>

                  {/* CLIENTE */}
                  <td className="px-4 py-3">
                    <span className="text-[13px]" style={{ color: 'var(--wl-text)' }}>
                      {clientName}
                    </span>
                  </td>

                  {/* SISTEMA */}
                  <td className="px-4 py-3">
                    <span className="text-[13px]" style={{ color: 'var(--primary)' }}>
                      {t.system?.name ?? '—'}
                    </span>
                  </td>

                  {/* AUTOR */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <WlAvatar name={authorName} size={22} />
                      <span className="text-[13px]" style={{ color: 'var(--wl-text)' }}>
                        {authorName}
                      </span>
                    </div>
                  </td>

                  {/* ATUALIZADO */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="text-[12px] tabular-nums" style={{ color: 'var(--wl-text-muted)' }}>
                      {fmtDateTime(t.updatedAt)}
                    </span>
                  </td>
                </tr>
              )
            })}
        </tbody>
      </table>
    </div>
  )
}
