import { EmptyState, EntityCard, StatCell, StatusPill, WlAvatar } from '@/components/worklog'
import { avatarColor, getInitials, systemShortCode } from '@/lib/worklog-meta'
import type { SystemResponse } from '@/api/generated/schemas'

export interface SystemStats {
  total: number
  open: number
}

export interface SystemGridProps {
  systems: SystemResponse[]
  statsBySystem: Record<string, SystemStats>
  loading?: boolean
  onCardClick?: (publicId: string) => void
  onToggleActive?: (publicId: string, active: boolean, name: string) => void
}

const EMPTY_STATS: SystemStats = { total: 0, open: 0 }

const GRID_PATTERN =
  'repeating-linear-gradient(0deg, transparent 0 18px, rgba(255,255,255,0.04) 18px 19px), ' +
  'repeating-linear-gradient(90deg, transparent 0 18px, rgba(255,255,255,0.04) 18px 19px)'

// Hex color with appended alpha pair (00–ff). Centralized so the
// background/glow tints stay in sync.
function withAlpha(hex: string, hexAlpha: string): string {
  return `${hex}${hexAlpha}`
}

export function SystemGrid({
  systems,
  statsBySystem,
  loading,
  onCardClick,
  onToggleActive,
}: SystemGridProps) {
  if (loading) {
    return (
      <div className="scroll-hide flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <SystemCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (systems.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState title="Nenhum sistema" description="Nenhum sistema encontrado." />
      </div>
    )
  }

  return (
    <div className="scroll-hide flex-1 overflow-y-auto p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {systems.map((s, idx) => {
          const isActive = s.enabled !== false
          const stats = statsBySystem[s.publicId ?? ''] ?? EMPTY_STATS
          const name = s.name ?? '—'
          // system.description is a pending backend field; renders `—` placeholder
          // so the slot stays reserved until the backend exposes the value.
          const description = (s as { description?: string }).description ?? '—'
          const initials = getInitials(name)
          const color = avatarColor(initials)
          // Layered header background: grid pattern over a radial color-tint
          // centered on the avatar (creates the "glow" effect).
          const headerBackground =
            `${GRID_PATTERN}, ` +
            `radial-gradient(circle at center, ${withAlpha(color, '4d')} 0%, ${withAlpha(color, '26')} 55%, ${withAlpha(color, '10')} 100%)`
          return (
            <EntityCard
              key={s.publicId}
              inactive={!isActive}
              onClick={s.publicId ? () => onCardClick?.(s.publicId!) : undefined}
            >
              {/* Header */}
              <div
                className="relative flex h-[88px] items-center justify-center overflow-hidden rounded-t-xl"
                style={{
                  background: headerBackground,
                  borderBottom: '1px solid var(--wl-border-2)',
                }}
              >
                <span
                  className="absolute left-3 top-2 font-mono text-[10px] tracking-wider"
                  style={{ color: 'var(--wl-text-muted)' }}
                >
                  {systemShortCode(idx)}
                </span>
                <div className="absolute right-3 top-2">
                  <StatusPill active={isActive} />
                </div>
                <WlAvatar
                  name={name}
                  size={56}
                  className="rounded-lg"
                  style={{
                    boxShadow: `0 0 24px ${withAlpha(color, '80')}, 0 0 8px ${withAlpha(color, 'aa')}`,
                    filter: 'brightness(1.18) saturate(1.1)',
                  }}
                />
              </div>

              {/* Body */}
              <div className="flex flex-col gap-1 p-4 pb-3">
                <p className="truncate text-[14px] font-semibold leading-tight" style={{ color: 'var(--wl-text)' }}>
                  {name}
                </p>
                <p
                  className="line-clamp-2 text-[12px] leading-snug"
                  style={{ color: 'var(--wl-text-muted)' }}
                >
                  {description}
                </p>
              </div>

              {/* Inset separator */}
              <div className="mx-4 border-t" style={{ borderColor: 'var(--wl-border-2)' }} />

              {/* Footer */}
              <div
                className="mt-auto flex items-center justify-between gap-3 px-4 py-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-end gap-5">
                  <StatCell value={stats.total} label="TOTAL" />
                  <StatCell value={stats.open} label="ABERTOS" tone={stats.open > 0 ? 'warn' : 'default'} />
                </div>
                {onToggleActive && s.publicId && (
                  <button
                    type="button"
                    onClick={() => onToggleActive(s.publicId!, isActive, name)}
                    className="cursor-pointer rounded-md px-3 py-1.5 text-[12px] font-medium transition-opacity hover:opacity-80"
                    style={{ color: isActive ? 'var(--wl-danger)' : 'var(--primary)' }}
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

function SystemCardSkeleton() {
  return (
    <div
      className="flex flex-col rounded-xl"
      style={{ background: 'var(--wl-surface)', border: '1px solid var(--wl-border)' }}
    >
      <div
        className="h-[88px] rounded-t-xl"
        style={{ background: 'var(--wl-surface-2)', borderBottom: '1px solid var(--wl-border-2)' }}
      />
      <div className="space-y-1.5 p-4">
        <div className="h-4 w-1/2 animate-pulse rounded" style={{ background: 'var(--wl-surface-2)' }} />
        <div className="h-3 w-3/4 animate-pulse rounded" style={{ background: 'var(--wl-surface-2)' }} />
      </div>
      <div className="mx-4 border-t" style={{ borderColor: 'var(--wl-border-2)' }} />
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex gap-5">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-1">
              <div className="h-4 w-6 animate-pulse rounded" style={{ background: 'var(--wl-surface-2)' }} />
              <div className="h-2.5 w-10 animate-pulse rounded" style={{ background: 'var(--wl-surface-2)' }} />
            </div>
          ))}
        </div>
        <div className="h-3 w-14 animate-pulse rounded" style={{ background: 'var(--wl-surface-2)' }} />
      </div>
    </div>
  )
}
