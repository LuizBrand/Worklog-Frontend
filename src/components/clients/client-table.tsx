import { ChevronRight } from 'lucide-react'

import { DevChip, EmptyState, StatusPill, TipoBadge } from '@/components/worklog'
import { contatoPrincipal, matrizDoCliente } from '@/api/clients-contract'
import type { ClientResponse, ContactResponse } from '@/api/clients-contract'
import { formatDocumento, formatTelefone } from '@/lib/documento'

export interface ClientStats {
  total: number
  open: number
  critical: number
  /** `PENDING` — coluna "solicitados". */
  pending: number
  /** `AWAITING_CUSTOMER` + `AWAITING_DEVELOPMENT` — coluna "em andamento". */
  inProgress: number
}

export const EMPTY_CLIENT_STATS: ClientStats = {
  total: 0,
  open: 0,
  critical: 0,
  pending: 0,
  inProgress: 0,
}

export interface ClientTableProps {
  clients: ClientResponse[]
  statsByClient: Record<string, ClientStats>
  loading?: boolean
  onRowClick?: (publicId: string) => void
}

const COLS = ['CLIENTE', 'CONTATO', 'TICKETS', 'CONTRATO', 'RENOVAÇÃO'] as const

export function ClientTable({ clients, statsByClient, loading, onRowClick }: ClientTableProps) {
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
            <th className="w-10 px-2 py-2.5" />
          </tr>
        </thead>

        <tbody>
          {loading &&
            Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} style={{ borderTop: i > 0 ? '1px solid var(--wl-border)' : undefined }}>
                {COLS.map((col) => (
                  <td key={col} className="px-4 py-3.5">
                    <div
                      className="h-4 animate-pulse rounded"
                      style={{ background: 'var(--wl-surface-2)', width: col === 'CLIENTE' ? '70%' : '50%' }}
                    />
                  </td>
                ))}
                <td className="px-2 py-3.5" />
              </tr>
            ))}

          {!loading && clients.length === 0 && (
            <tr>
              <td colSpan={COLS.length + 1} className="px-4 py-16 text-center">
                <EmptyState title="Nenhum cliente" description="Nenhum cliente encontrado para os filtros aplicados." />
              </td>
            </tr>
          )}

          {!loading &&
            clients.map((c, idx) => {
              const matriz = matrizDoCliente(c)
              const stats = statsByClient[c.publicId] ?? EMPTY_CLIENT_STATS

              return (
                <tr
                  key={c.publicId}
                  onClick={() => onRowClick?.(c.publicId)}
                  className="transition-colors hover:bg-[var(--wl-surface-2)]"
                  style={{
                    borderTop: idx > 0 ? '1px solid var(--wl-border)' : undefined,
                    cursor: onRowClick ? 'pointer' : undefined,
                    opacity: c.enabled ? 1 : 0.6,
                  }}
                >
                  {/* CLIENTE */}
                  <td className="max-w-[420px] px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-semibold" style={{ color: 'var(--wl-text)' }}>
                        {c.name}
                      </span>
                      <TipoBadge tipo={c.tipo} className="shrink-0" />
                      {!c.enabled && <StatusPill active={false} variant="badge" className="shrink-0" />}
                    </div>
                    <span className="text-[11px] tabular-nums" style={{ color: 'var(--wl-text-muted)' }}>
                      {formatDocumento(matriz?.documento)}
                    </span>
                  </td>

                  {/* CONTATO */}
                  <td className="max-w-[280px] px-4 py-3.5">
                    <span className="block truncate text-[13px]" style={{ color: 'var(--wl-text)' }}>
                      {contatoLabel(contatoPrincipal(matriz))}
                    </span>
                  </td>

                  {/* TICKETS */}
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <TicketCount value={stats.inProgress} label="em andamento" color="var(--status-open)" />
                    <TicketCount value={stats.pending} label="solicitados" color="var(--status-awaiting)" />
                  </td>

                  {/* CONTRATO — módulo ainda não existe */}
                  <td className="px-4 py-3.5">
                    <DevChip />
                  </td>

                  {/* RENOVAÇÃO — depende do módulo de contratos */}
                  <td className="px-4 py-3.5">
                    <span className="text-[13px]" style={{ color: 'var(--wl-text-muted)' }}>
                      —
                    </span>
                  </td>

                  <td className="px-2 py-3.5">
                    <ChevronRight size={15} style={{ color: 'var(--wl-text-muted)' }} />
                  </td>
                </tr>
              )
            })}
        </tbody>
      </table>
    </div>
  )
}

// ── Internos ──────────────────────────────────────────────────────────────────

export function contatoLabel(contato: ContactResponse | null): string {
  if (!contato) return '—'
  if (contato.tipo === 'EMAIL') return contato.valor
  return formatTelefone(contato.valor)
}

function TicketCount({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[12px] leading-[18px]" style={{ color: 'var(--wl-text-muted)' }}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
      <span className="tabular-nums font-medium" style={{ color: 'var(--wl-text)' }}>
        {value}
      </span>
      {label}
    </span>
  )
}
