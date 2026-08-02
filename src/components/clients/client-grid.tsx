import { EmptyState, EntityCard, StatCell, StatusPill, TipoBadge, WlAvatar } from '@/components/worklog'
import { contatoPrincipal, matrizDoCliente } from '@/api/clients-contract'
import type { ClientResponse } from '@/api/clients-contract'
import { formatDocumento } from '@/lib/documento'
import { contatoLabel, EMPTY_CLIENT_STATS, type ClientStats } from './client-table'

export interface ClientGridProps {
  clients: ClientResponse[]
  statsByClient: Record<string, ClientStats>
  loading?: boolean
  onCardClick?: (publicId: string) => void
  onViewTickets?: (publicId: string) => void
  onToggleActive?: (publicId: string, active: boolean, name: string) => void
}

export function ClientGrid({
  clients,
  statsByClient,
  loading,
  onCardClick,
  onViewTickets,
  onToggleActive,
}: ClientGridProps) {
  if (loading) {
    return (
      <div className="scroll-hide flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <ClientCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState title="Nenhum cliente" description="Nenhum cliente encontrado para os filtros aplicados." />
      </div>
    )
  }

  return (
    <div className="scroll-hide flex-1 overflow-y-auto p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {clients.map((c) => {
          const matriz = matrizDoCliente(c)
          const stats = statsByClient[c.publicId] ?? EMPTY_CLIENT_STATS
          return (
            <EntityCard
              key={c.publicId}
              inactive={!c.enabled}
              onClick={() => onCardClick?.(c.publicId)}
            >
              {/* Header */}
              <div className="flex items-start gap-3 px-4 pb-3 pt-4">
                <WlAvatar name={c.name} size={40} className="shrink-0 rounded-md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-[13px] font-semibold leading-tight" style={{ color: 'var(--wl-text)' }}>
                      {c.name}
                    </p>
                    <TipoBadge tipo={c.tipo} className="shrink-0" />
                  </div>
                  <p className="truncate text-[11px] leading-tight" style={{ color: 'var(--wl-text-muted)' }}>
                    {contatoLabel(contatoPrincipal(matriz))}
                  </p>
                  <p
                    className="truncate text-[11px] tabular-nums leading-tight"
                    style={{ color: 'var(--wl-text-dim)' }}
                  >
                    {formatDocumento(matriz?.documento)}
                  </p>
                </div>
                <StatusPill active={c.enabled} className="shrink-0" />
              </div>

              {/* Inset separator */}
              <div className="mx-4 border-t" style={{ borderColor: 'var(--wl-border-2)' }} />

              {/* Stats: 3 evenly distributed columns */}
              <div className="grid grid-cols-3 px-4 py-3">
                <StatCell value={stats.total} label="TICKETS" />
                <StatCell value={stats.open} label="ABERTOS" tone={stats.open > 0 ? 'warn' : 'default'} />
                <StatCell value={stats.critical} label="CRÍTICOS" tone={stats.critical > 0 ? 'danger' : 'default'} />
              </div>

              {/* Inset separator */}
              <div className="mx-4 border-t" style={{ borderColor: 'var(--wl-border-2)' }} />

              {/* Footer */}
              <div
                className="mt-auto flex items-center gap-2 px-4 py-3"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => onViewTickets?.(c.publicId)}
                  className="flex-1 cursor-pointer rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors hover:bg-[var(--wl-surface-2)]"
                  style={{
                    background: 'transparent',
                    color: 'var(--wl-text)',
                    border: '1px solid var(--wl-border)',
                  }}
                >
                  Ver tickets
                </button>
                {onToggleActive && (
                  <button
                    type="button"
                    onClick={() => onToggleActive(c.publicId, c.enabled, c.name)}
                    className="cursor-pointer rounded-md px-3 py-1.5 text-[12px] font-medium transition-opacity hover:opacity-80"
                    style={{ color: c.enabled ? 'var(--wl-danger)' : 'var(--primary)' }}
                  >
                    {c.enabled ? 'Desativar' : 'Ativar'}
                  </button>
                )}
              </div>
            </EntityCard>
          )
        })}
      </div>
    </div>
  )
}

function ClientCardSkeleton() {
  return (
    <div
      className="flex flex-col rounded-xl"
      style={{ background: 'var(--wl-surface)', border: '1px solid var(--wl-border)' }}
    >
      <div className="flex items-start gap-3 px-4 pb-3 pt-4">
        <div className="h-10 w-10 animate-pulse rounded-md" style={{ background: 'var(--wl-surface-2)' }} />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-3/4 animate-pulse rounded" style={{ background: 'var(--wl-surface-2)' }} />
          <div className="h-3 w-2/3 animate-pulse rounded" style={{ background: 'var(--wl-surface-2)' }} />
          <div className="h-3 w-1/2 animate-pulse rounded" style={{ background: 'var(--wl-surface-2)' }} />
        </div>
      </div>
      <div className="mx-4 border-t" style={{ borderColor: 'var(--wl-border-2)' }} />
      <div className="grid grid-cols-3 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-4 w-6 animate-pulse rounded" style={{ background: 'var(--wl-surface-2)' }} />
            <div className="h-2.5 w-12 animate-pulse rounded" style={{ background: 'var(--wl-surface-2)' }} />
          </div>
        ))}
      </div>
      <div className="mx-4 border-t" style={{ borderColor: 'var(--wl-border-2)' }} />
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="h-7 flex-1 animate-pulse rounded-md" style={{ background: 'var(--wl-surface-2)' }} />
        <div className="h-3 w-16 animate-pulse rounded" style={{ background: 'var(--wl-surface-2)' }} />
      </div>
    </div>
  )
}
