import { useState } from 'react'
import { MoreHorizontal, Eye, Pencil, Trash2, ChevronRight } from 'lucide-react'

import { StatusChip, StatusPill, WlAvatar, EmptyState, PriorityDot } from '@/components/worklog'
import { apiToUiStatus } from '@/lib/ticket-status'
import { fmtDateTime, PRIORITY_META, STATUS_META } from '@/lib/worklog-meta'
import type { TicketSummary } from '@/api/generated/schemas'
import type { ApiTicketStatus } from '@/lib/ticket-status'
import type { TicketPriority } from '@/lib/worklog-meta'

function fmtId(publicId: string | undefined): string {
  if (!publicId) return '—'
  return publicId.slice(0, 6)
}

export interface TicketTableProps {
  tickets: TicketSummary[]
  loading?: boolean
  onRowClick?: (publicId: string) => void
  onEdit?: (publicId: string) => void
  onDelete?: (publicId: string) => void
}

const COLS = ['ID', 'TÍTULO', 'STATUS', 'PRIORIDADE', 'CLIENTE', 'SISTEMA', 'RESPONSÁVEL', 'ATUALIZADO'] as const

export function TicketTable({ tickets, loading, onRowClick, onEdit, onDelete }: TicketTableProps) {
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
            {/* Actions column */}
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
                      style={{ background: 'var(--wl-surface-2)', width: col === 'TÍTULO' ? '70%' : '60%' }}
                    />
                  </td>
                ))}
                <td className="px-2 py-3" />
              </tr>
            ))}

          {!loading && tickets.length === 0 && (
            <tr>
              <td colSpan={COLS.length + 1} className="px-4 py-16 text-center">
                <EmptyState title="Nenhum ticket" description="Nenhum ticket encontrado para os filtros aplicados." />
              </td>
            </tr>
          )}

          {!loading &&
            tickets.map((t, idx) => {
              const uiStatus = t.status ? apiToUiStatus(t.status as ApiTicketStatus) : 'OPEN'
              const clientName = t.client?.name ?? '—'
              const authorName = t.user?.name ?? '—'
              const isMenuOpen = openMenuId === t.publicId

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

                  {/* PRIORIDADE */}
                  <td className="px-4 py-3">
                    {t.priority ? (
                      <PriorityPill priority={t.priority as TicketPriority} />
                    ) : (
                      <span className="text-[13px]" style={{ color: 'var(--wl-text-muted)' }}>—</span>
                    )}
                  </td>

                  {/* CLIENTE */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-medium" style={{ color: 'var(--wl-text)' }}>
                        {clientName}
                      </span>
                      {t.client?.enabled === false && <StatusPill active={false} variant="badge" />}
                    </div>
                  </td>

                  {/* SISTEMA */}
                  <td className="px-4 py-3">
                    <span className="text-[13px]" style={{ color: 'var(--wl-text-muted)' }}>
                      {t.system?.name ?? '—'}
                    </span>
                  </td>

                  {/* RESPONSÁVEL */}
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

                  {/* AÇÕES */}
                  <td
                    className="relative px-2 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setOpenMenuId(isMenuOpen ? null : (t.publicId ?? null))}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-[var(--wl-surface-2)]"
                      style={{ color: 'var(--wl-text-muted)' }}
                      title="Ações"
                      aria-label="Ações do ticket"
                    >
                      <MoreHorizontal size={15} />
                    </button>

                    {isMenuOpen && (
                      <>
                        {/* Click-away overlay */}
                        <div className="fixed inset-0 z-10" onClick={closeMenu} />

                        {/* Dropdown */}
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
                            onClick={() => { closeMenu(); if (t.publicId) onRowClick?.(t.publicId) }}
                          />
                          <MenuItem
                            icon={<Pencil size={13} />}
                            label="Editar"
                            onClick={() => { closeMenu(); if (t.publicId) onEdit?.(t.publicId) }}
                          />
                          <div style={{ height: 1, background: 'var(--wl-border)', margin: '4px 0' }} />
                          <MenuItem
                            icon={<Trash2 size={13} />}
                            label="Excluir"
                            danger
                            onClick={() => { closeMenu(); if (t.publicId) onDelete?.(t.publicId) }}
                          />
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

// ── Mobile card list ─────────────────────────────────────────────────────────

export interface MobileTicketCardsProps {
  tickets: TicketSummary[]
  loading?: boolean
  onTicketClick?: (publicId: string) => void
  onEdit?: (publicId: string) => void
  onDelete?: (publicId: string) => void
}

export function MobileTicketCards({ tickets, loading, onTicketClick, onEdit, onDelete }: MobileTicketCardsProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="flex flex-col">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-[82px] animate-pulse"
            style={{ borderBottom: '1px solid var(--wl-border)' }}
          />
        ))}
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <div className="py-16">
        <EmptyState title="Nenhum ticket" description="Nenhum ticket encontrado para os filtros aplicados." />
      </div>
    )
  }

  return (
    <div>
      {tickets.map((t) => {
        const uiStatus = t.status ? apiToUiStatus(t.status as ApiTicketStatus) : 'OPEN'
        const meta = STATUS_META[uiStatus]
        const priority = t.priority as TicketPriority | undefined
        const clientName = t.client?.name ?? '—'
        const systemName = t.system?.name
        const isMenuOpen = openMenuId === t.publicId

        return (
          <div key={t.publicId} className="relative" style={{ borderBottom: '1px solid var(--wl-border)' }}>
            <div className="flex items-stretch">
              {/* Left status accent */}
              <div
                className="ml-4 w-[3px] shrink-0 rounded-full my-3"
                style={{ background: meta.color }}
              />

              {/* Card body */}
              <button
                onClick={() => t.publicId && onTicketClick?.(t.publicId)}
                className="flex-1 min-w-0 text-left px-3 py-3 transition-colors active:bg-[var(--wl-surface-2)]"
              >
                {/* Row 1: Title + short ID + chevron */}
                <div className="flex items-start gap-2">
                  <p
                    className="flex-1 text-[13px] font-medium leading-snug line-clamp-2"
                    style={{ color: 'var(--wl-text)' }}
                  >
                    {t.title ?? '(sem título)'}
                  </p>
                  <div className="flex shrink-0 items-center gap-0.5 mt-0.5">
                    <span className="font-mono text-[10px]" style={{ color: 'var(--wl-text-muted)' }}>
                      {t.publicId ? `t-${t.publicId.slice(0, 4)}` : '—'}
                    </span>
                    <ChevronRight size={13} style={{ color: 'var(--wl-text-muted)' }} />
                  </div>
                </div>

                {/* Row 2: Status chip + Priority */}
                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                  <StatusChip status={uiStatus} size="sm" />
                  {priority && <PriorityDot priority={priority} />}
                </div>

                {/* Row 3: Client + System badge */}
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[12px]" style={{ color: 'var(--wl-text-muted)' }}>
                    {clientName}
                  </span>
                  {systemName && (
                    <>
                      <span className="text-[11px]" style={{ color: 'var(--wl-text-muted)' }}>·</span>
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{
                          background: 'color-mix(in oklch, var(--primary) 18%, transparent)',
                          color: 'var(--primary)',
                        }}
                      >
                        {systemName}
                      </span>
                    </>
                  )}
                </div>
              </button>

              {/* Row action menu */}
              <div
                className="relative flex shrink-0 items-center pr-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setOpenMenuId(isMenuOpen ? null : (t.publicId ?? null))}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-[var(--wl-surface-2)]"
                  style={{ color: 'var(--wl-text-muted)' }}
                  aria-label="Ações"
                >
                  <MoreHorizontal size={15} />
                </button>

                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                    <div
                      className="absolute right-2 top-full z-20 mt-1 min-w-[160px] overflow-hidden rounded-lg py-1 shadow-lg"
                      style={{ background: 'var(--wl-surface)', border: '1px solid var(--wl-border)' }}
                    >
                      <MenuItem
                        icon={<Eye size={13} />}
                        label="Ver detalhes"
                        onClick={() => { setOpenMenuId(null); if (t.publicId) onTicketClick?.(t.publicId) }}
                      />
                      <MenuItem
                        icon={<Pencil size={13} />}
                        label="Editar"
                        onClick={() => { setOpenMenuId(null); if (t.publicId) onEdit?.(t.publicId) }}
                      />
                      <div style={{ height: 1, background: 'var(--wl-border)', margin: '4px 0' }} />
                      <MenuItem
                        icon={<Trash2 size={13} />}
                        label="Excluir"
                        danger
                        onClick={() => { setOpenMenuId(null); if (t.publicId) onDelete?.(t.publicId) }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function PriorityPill({ priority }: { priority: TicketPriority }) {
  const meta = PRIORITY_META[priority]
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ color: meta.color, border: `1px solid ${meta.color}33`, background: `${meta.color}14` }}
    >
      {meta.label}
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
