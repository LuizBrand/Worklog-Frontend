'use client'

import { MoreHorizontal, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

import { EmptyState, WlAvatar } from '@/components/worklog'
import { fmtDate } from '@/lib/worklog-meta'
import type { UserResponse } from '@/api/generated/schemas'
import { RoleResponseRole } from '@/api/generated/schemas'

export function UserRoleBadge({ roles }: { roles?: UserResponse['roles'] }) {
  const isAdmin = roles?.some((r) => r.role === RoleResponseRole.ADMIN) ?? false
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={
        isAdmin
          ? { background: 'rgba(99,102,241,0.14)', color: 'var(--primary)' }
          : { background: 'var(--wl-surface-2)', color: 'var(--wl-text-muted)', border: '1px solid var(--wl-border)' }
      }
    >
      <ShieldCheck size={10} />
      {isAdmin ? 'Admin' : 'Usuário'}
    </span>
  )
}

export interface UserTableProps {
  users: UserResponse[]
  loading?: boolean
  onDeactivate?: (publicId: string) => void
}

export function UserTable({ users, loading, onDeactivate }: UserTableProps) {
  const [menuId, setMenuId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="scroll-hide flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-4"
              style={{ background: 'var(--wl-surface)', border: '1px solid var(--wl-border)' }}
            >
              <div className="mb-3 h-10 w-10 animate-pulse rounded-full" style={{ background: 'var(--wl-surface-2)' }} />
              <div className="mb-1.5 h-3.5 w-3/4 animate-pulse rounded" style={{ background: 'var(--wl-surface-2)' }} />
              <div className="mb-2 h-3 w-full animate-pulse rounded" style={{ background: 'var(--wl-surface-2)' }} />
              <div className="h-5 w-16 animate-pulse rounded-full" style={{ background: 'var(--wl-surface-2)' }} />
            </div>
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
    <div className="scroll-hide flex-1 overflow-y-auto p-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {users.map((u) => (
          <div
            key={u.publicId}
            className="group relative rounded-xl p-4"
            style={{ background: 'var(--wl-surface)', border: '1px solid var(--wl-border)' }}
          >
            {/* 3-dot menu */}
            <div className="absolute right-2.5 top-2.5">
              <button
                onClick={() => setMenuId(menuId === u.publicId ? null : (u.publicId ?? null))}
                className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md opacity-0 transition-all group-hover:opacity-100 hover:bg-[var(--wl-surface-2)]"
                style={{ color: 'var(--wl-text-muted)' }}
              >
                <MoreHorizontal size={13} />
              </button>

              {menuId === u.publicId && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuId(null)} />
                  <div
                    className="absolute right-0 top-7 z-20 w-32 overflow-hidden rounded-lg py-1 shadow-lg"
                    style={{ background: 'var(--wl-surface)', border: '1px solid var(--wl-border)' }}
                  >
                    <button
                      onClick={() => { setMenuId(null); if (u.publicId) onDeactivate?.(u.publicId) }}
                      className="flex w-full cursor-pointer items-center px-3 py-2 text-[13px] transition-colors hover:bg-[var(--wl-surface-2)]"
                      style={{ color: '#ef4444' }}
                    >
                      Desativar
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Avatar */}
            <div className="mb-3">
              <WlAvatar name={u.name ?? u.email ?? '?'} size={40} />
            </div>

            {/* Name */}
            <p className="mb-0.5 truncate pr-6 text-[13px] font-semibold leading-snug" style={{ color: 'var(--wl-text)' }}>
              {u.name ?? '—'}
            </p>

            {/* Email */}
            <p className="mb-2.5 truncate text-[11px]" style={{ color: 'var(--wl-text-muted)' }}>
              {u.email ?? '—'}
            </p>

            {/* Role + date row */}
            <div className="flex items-center justify-between gap-2">
              <UserRoleBadge roles={u.roles} />
              <span className="shrink-0 text-[11px]" style={{ color: 'var(--wl-text-muted)' }}>
                {fmtDate(u.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
