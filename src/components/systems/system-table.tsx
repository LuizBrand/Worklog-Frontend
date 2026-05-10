import { Layers, Pencil } from 'lucide-react'

import { EmptyState } from '@/components/worklog'
import type { SystemResponse } from '@/api/generated/schemas'

export interface SystemGridProps {
  systems: SystemResponse[]
  clientCountBySystem: Record<string, number>
  loading?: boolean
  onRowClick?: (publicId: string) => void
  onEdit?: (publicId: string) => void
}

export function SystemTable({ systems, clientCountBySystem, loading, onRowClick, onEdit }: SystemGridProps) {
  if (loading) {
    return (
      <div className="scroll-hide flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-4"
              style={{ background: 'var(--wl-surface)', border: '1px solid var(--wl-border)' }}
            >
              <div className="mb-3 h-8 w-8 animate-pulse rounded-lg" style={{ background: 'var(--wl-surface-2)' }} />
              <div className="mb-1.5 h-3.5 w-2/3 animate-pulse rounded" style={{ background: 'var(--wl-surface-2)' }} />
              <div className="h-5 w-20 animate-pulse rounded-full" style={{ background: 'var(--wl-surface-2)' }} />
            </div>
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
    <div className="scroll-hide flex-1 overflow-y-auto p-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {systems.map((s) => {
          const count = clientCountBySystem[s.publicId ?? ''] ?? 0

          return (
            <div
              key={s.publicId}
              onClick={() => s.publicId && onRowClick?.(s.publicId)}
              className="group relative cursor-pointer rounded-xl p-4 transition-colors hover:bg-[var(--wl-surface-2)]"
              style={{ background: 'var(--wl-surface)', border: '1px solid var(--wl-border)' }}
            >
              {/* Edit button */}
              <button
                onClick={(e) => { e.stopPropagation(); if (s.publicId) onEdit?.(s.publicId) }}
                className="absolute right-2.5 top-2.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md opacity-0 transition-all group-hover:opacity-100 hover:bg-[var(--wl-surface-2)]"
                style={{ color: 'var(--wl-text-muted)' }}
                aria-label="Editar sistema"
                title="Editar"
              >
                <Pencil size={12} />
              </button>

              {/* Icon */}
              <div
                className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: 'rgba(99,102,241,0.12)' }}
              >
                <Layers size={14} style={{ color: 'var(--primary)' }} />
              </div>

              {/* Name + client count row */}
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[13px] font-semibold leading-snug" style={{ color: 'var(--wl-text)' }}>
                  {s.name ?? '—'}
                </p>
                {count === 0 ? (
                  <span className="shrink-0 text-[11px]" style={{ color: 'var(--wl-text-muted)' }}>0 clientes</span>
                ) : (
                  <span
                    className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{ background: 'rgba(99,102,241,0.14)', color: 'var(--primary)' }}
                  >
                    {count} {count === 1 ? 'cliente' : 'clientes'}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
