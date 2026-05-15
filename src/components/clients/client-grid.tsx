import { EmptyState, EntityCard, StatCell, StatusPill, WlAvatar } from '@/components/worklog'
import type { ClientResponse } from '@/api/generated/schemas'

export interface ClientStats {
  total: number
  open: number
  critical: number
}

export interface ClientGridProps {
  clients: ClientResponse[]
  statsByClient: Record<string, ClientStats>
  loading?: boolean
  onCardClick?: (publicId: string) => void
  onViewTickets?: (publicId: string) => void
  onToggleActive?: (publicId: string, active: boolean, name: string) => void
}

const EMPTY_STATS: ClientStats = { total: 0, open: 0, critical: 0 }

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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {clients.map((c) => {
          const isActive = c.enabled !== false
          const stats = statsByClient[c.publicId ?? ''] ?? EMPTY_STATS
          const name = c.name ?? '—'
          // client.email is a pending backend field; line hides until exposed
          const email = (c as { email?: string }).email
          return (
            <EntityCard
              key={c.publicId}
              inactive={!isActive}
              onClick={c.publicId ? () => onCardClick?.(c.publicId!) : undefined}
            >
              {/* Header */}
              <div className="flex items-start gap-3 p-4 pb-3">
                <WlAvatar name={name} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold leading-tight" style={{ color: 'var(--wl-text)' }}>
                    {name}
                  </p>
                  {email && (
                    <p className="truncate text-[11px] leading-tight" style={{ color: 'var(--wl-text-muted)' }}>
                      {email}
                    </p>
                  )}
                </div>
                <StatusPill active={isActive} className="shrink-0" />
              </div>

              {/* Stats */}
              <div className="flex items-end gap-6 px-4 pb-3">
                <StatCell value={stats.total} label="TICKETS" />
                <StatCell value={stats.open} label="ABERTOS" tone={stats.open > 0 ? 'warn' : 'default'} />
                <StatCell value={stats.critical} label="CRÍTICOS" tone={stats.critical > 0 ? 'danger' : 'default'} />
              </div>

              {/* Footer */}
              <div
                className="mt-auto flex items-center justify-between gap-2 px-4 py-3"
                style={{ borderTop: '1px solid var(--wl-border)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => c.publicId && onViewTickets?.(c.publicId)}
                  className="cursor-pointer rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors hover:bg-[var(--wl-surface-2)]"
                  style={{
                    background: 'transparent',
                    color: 'var(--wl-text)',
                    border: '1px solid var(--wl-border)',
                  }}
                >
                  Ver tickets
                </button>
                {onToggleActive && c.publicId && (
                  <button
                    type="button"
                    onClick={() => onToggleActive(c.publicId!, isActive, name)}
                    className="cursor-pointer text-[12px] font-medium transition-opacity hover:opacity-80"
                    style={{ color: isActive ? '#e53e3e' : 'var(--primary)' }}
                  >
                    {isActive ? 'Desativar' : 'Ativar'}
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
      <div className="flex items-start gap-3 p-4 pb-3">
        <div className="h-9 w-9 animate-pulse rounded-full" style={{ background: 'var(--wl-surface-2)' }} />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-3/4 animate-pulse rounded" style={{ background: 'var(--wl-surface-2)' }} />
          <div className="h-3 w-2/3 animate-pulse rounded" style={{ background: 'var(--wl-surface-2)' }} />
        </div>
      </div>
      <div className="flex gap-6 px-4 pb-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-4 w-6 animate-pulse rounded" style={{ background: 'var(--wl-surface-2)' }} />
            <div className="h-2.5 w-12 animate-pulse rounded" style={{ background: 'var(--wl-surface-2)' }} />
          </div>
        ))}
      </div>
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderTop: '1px solid var(--wl-border)' }}
      >
        <div className="h-6 w-20 animate-pulse rounded-md" style={{ background: 'var(--wl-surface-2)' }} />
        <div className="h-3 w-14 animate-pulse rounded" style={{ background: 'var(--wl-surface-2)' }} />
      </div>
    </div>
  )
}
