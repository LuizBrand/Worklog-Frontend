'use client'

import { ShieldCheck } from 'lucide-react'

import { EmptyState, WlAvatar } from '@/components/worklog'
import type { UserResponse } from '@/api/generated/schemas'
import { RoleResponseRole } from '@/api/generated/schemas'

export function UserRoleBadge({ roles }: { roles?: UserResponse['roles'] }) {
  const isAdmin = roles?.some((r) => r.role === RoleResponseRole.ADMIN) ?? false
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={
        isAdmin
          ? { background: 'rgba(99,102,241,0.14)', color: 'var(--primary)' }
          : { background: 'var(--wl-surface-2)', color: 'var(--wl-text-muted)', border: '1px solid var(--wl-border)' }
      }
    >
      <ShieldCheck size={10} />
      {isAdmin ? 'Admin' : 'User'}
    </span>
  )
}

export interface UserGridProps {
  users: UserResponse[]
  loading?: boolean
  onCardClick?: (publicId: string) => void
  onToggleActive?: (publicId: string, active: boolean, name: string) => void
}

export function UserGrid({ users, loading, onCardClick, onToggleActive }: UserGridProps) {
  if (loading) {
    return (
      <div className="scroll-hide flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <UserCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState title="Nenhum usuário" description="Nenhum usuário encontrado." />
      </div>
    )
  }

  return (
    <div className="scroll-hide flex-1 overflow-y-auto p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {users.map((u) => {
          // `enabled` is not on UserResponse schema; treat undefined as active.
          const isActive = (u as { enabled?: boolean }).enabled !== false
          const name = u.name ?? '—'
          const email = u.email ?? '—'
          return (
            <div
              key={u.publicId}
              onClick={() => u.publicId && onCardClick?.(u.publicId)}
              className="group relative flex flex-col rounded-xl transition-colors"
              style={{
                background: 'var(--wl-surface)',
                border: '1px solid var(--wl-border)',
                opacity: isActive ? 1 : 0.55,
                cursor: onCardClick ? 'pointer' : undefined,
              }}
            >
              {/* Decorative status dot (top-right) */}
              <span
                aria-hidden="true"
                className="absolute right-3 top-3 inline-block h-2 w-2 rounded-full"
                style={{ background: isActive ? '#22c55e' : 'var(--wl-text-muted)' }}
              />

              {/* Centered body */}
              <div className="flex flex-col items-center gap-1.5 px-4 pb-4 pt-5">
                <WlAvatar name={name} size={56} />
                <p
                  className="mt-2 max-w-full truncate text-[13px] font-semibold leading-tight"
                  style={{ color: 'var(--wl-text)' }}
                  title={name}
                >
                  {name}
                </p>
                <p
                  className="max-w-full truncate text-[11px] leading-tight"
                  style={{ color: 'var(--wl-text-muted)' }}
                  title={email}
                >
                  {email}
                </p>
                <div className="mt-1">
                  <UserRoleBadge roles={u.roles} />
                </div>
              </div>

              {/* Footer button (admin-only) */}
              {onToggleActive && u.publicId && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleActive(u.publicId!, isActive, name)
                  }}
                  className="cursor-pointer px-4 py-3 text-center text-[12px] font-medium transition-colors hover:bg-[var(--wl-surface-2)]"
                  style={{
                    borderTop: '1px solid var(--wl-border)',
                    color: isActive ? '#e53e3e' : 'var(--primary)',
                  }}
                >
                  {isActive ? 'Desativar' : 'Reativar'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function UserCardSkeleton() {
  return (
    <div
      className="flex flex-col rounded-xl"
      style={{ background: 'var(--wl-surface)', border: '1px solid var(--wl-border)' }}
    >
      <div className="flex flex-col items-center gap-2 px-4 pb-4 pt-5">
        <div className="h-14 w-14 animate-pulse rounded-full" style={{ background: 'var(--wl-surface-2)' }} />
        <div className="mt-2 h-3.5 w-2/3 animate-pulse rounded" style={{ background: 'var(--wl-surface-2)' }} />
        <div className="h-3 w-3/4 animate-pulse rounded" style={{ background: 'var(--wl-surface-2)' }} />
        <div className="h-4 w-14 animate-pulse rounded-full" style={{ background: 'var(--wl-surface-2)' }} />
      </div>
      <div
        className="h-10"
        style={{ borderTop: '1px solid var(--wl-border)', background: 'var(--wl-surface-2)' }}
      />
    </div>
  )
}
