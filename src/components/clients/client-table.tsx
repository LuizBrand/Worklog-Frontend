import { useState } from 'react'
import { MoreHorizontal, Eye, Pencil, Ban } from 'lucide-react'

import { EmptyState } from '@/components/worklog'
import { fmtDate } from '@/lib/worklog-meta'
import type { ClientResponse } from '@/api/generated/schemas'

export interface ClientTableProps {
  clients: ClientResponse[]
  loading?: boolean
  onRowClick?: (publicId: string) => void
  onEdit?: (publicId: string) => void
  onDeactivate?: (publicId: string, name: string) => void
}

const COLS = ['NOME', 'SISTEMAS', 'CRIADO', 'STATUS'] as const

export function ClientTable({ clients, loading, onRowClick, onEdit, onDeactivate }: ClientTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  function closeMenu() { setOpenMenuId(null) }

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
                  <td key={col} className="px-4 py-3">
                    <div
                      className="h-4 animate-pulse rounded"
                      style={{ background: 'var(--wl-surface-2)', width: col === 'NOME' ? '60%' : '40%' }}
                    />
                  </td>
                ))}
                <td className="px-2 py-3" />
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
              const systemNames = c.systems?.map((s) => s.name).filter(Boolean) ?? []
              const isMenuOpen = openMenuId === c.publicId

              return (
                <tr
                  key={c.publicId}
                  onClick={() => c.publicId && onRowClick?.(c.publicId)}
                  className="group transition-colors hover:bg-[var(--wl-surface-2)]"
                  style={{
                    borderTop: idx > 0 ? '1px solid var(--wl-border)' : undefined,
                    cursor: onRowClick ? 'pointer' : undefined,
                  }}
                >
                  {/* NOME */}
                  <td className="px-4 py-3">
                    <span
                      className="text-[13px] font-medium"
                      style={{ color: 'var(--wl-text)' }}
                    >
                      {c.name ?? '—'}
                    </span>
                  </td>

                  {/* SISTEMAS */}
                  <td className="max-w-[320px] px-4 py-3">
                    <span className="text-[13px]" style={{ color: 'var(--wl-text-muted)' }}>
                      {systemNames.length === 0
                        ? '—'
                        : systemNames.slice(0, 3).join(', ') +
                          (systemNames.length > 3 ? ` +${systemNames.length - 3}` : '')}
                    </span>
                  </td>

                  {/* CRIADO */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="text-[12px] tabular-nums" style={{ color: 'var(--wl-text-muted)' }}>
                      {fmtDate(c.createdAt)}
                    </span>
                  </td>

                  {/* STATUS */}
                  <td className="px-4 py-3">
                    <ClientStatusBadge enabled={c.enabled} />
                  </td>

                  {/* AÇÕES */}
                  <td
                    className="relative px-2 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setOpenMenuId(isMenuOpen ? null : (c.publicId ?? null))}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-[var(--wl-surface-2)]"
                      style={{ color: 'var(--wl-text-muted)' }}
                      title="Ações"
                      aria-label="Ações do cliente"
                    >
                      <MoreHorizontal size={15} />
                    </button>

                    {isMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={closeMenu} />
                        <div
                          className="absolute right-0 top-full z-20 mt-1 min-w-[160px] overflow-hidden rounded-lg py-1 shadow-lg"
                          style={{
                            background: 'var(--wl-surface)',
                            border: '1px solid var(--wl-border)',
                          }}
                        >
                          <MenuItem
                            icon={<Eye size={13} />}
                            label="Ver detalhes"
                            onClick={() => { closeMenu(); if (c.publicId) onRowClick?.(c.publicId) }}
                          />
                          <MenuItem
                            icon={<Pencil size={13} />}
                            label="Editar"
                            onClick={() => { closeMenu(); if (c.publicId) onEdit?.(c.publicId) }}
                          />
                          {onDeactivate && c.enabled !== false && (
                            <>
                              <div style={{ height: 1, background: 'var(--wl-border)', margin: '4px 0' }} />
                              <MenuItem
                                icon={<Ban size={13} />}
                                label="Desativar"
                                danger
                                onClick={() => {
                                  closeMenu()
                                  if (c.publicId) onDeactivate(c.publicId, c.name ?? '')
                                }}
                              />
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              )
            })}
        </tbody>
      </table>
    </div>
  )
}

// ── Internal helpers ──────────────────────────────────────────────────────────

export function ClientStatusBadge({ enabled }: { enabled?: boolean }) {
  const isActive = enabled !== false
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
      style={{
        background: isActive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.1)',
        color: isActive ? '#22c55e' : '#ef4444',
      }}
    >
      {isActive ? 'Ativo' : 'Inativo'}
    </span>
  )
}

function MenuItem({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  danger?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-[13px] transition-colors hover:bg-[var(--wl-surface-2)]"
      style={{ color: danger ? '#e53e3e' : 'var(--wl-text)' }}
    >
      {icon}
      {label}
    </button>
  )
}
