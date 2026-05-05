'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { X, Loader2 } from 'lucide-react'

import {
  useGetTicketByPublicId,
  getGetTicketByPublicIdQueryKey,
  useGetTicketLogs,
  getGetTicketLogsQueryKey,
  useUpdateTicket,
} from '@/api/generated/tickets/tickets'
import { StatusChip, WlAvatar } from '@/components/worklog'
import { apiToUiStatus, uiToApiStatus } from '@/lib/ticket-status'
import { STATUS_META, fmtDate } from '@/lib/worklog-meta'
import type { PageTicketLogResponse } from '@/api/generated/schemas'
import { TicketUpdateRequestStatus } from '@/api/generated/schemas'
import type { ApiTicketStatus, UiWritableStatus } from '@/lib/ticket-status'
import { TicketActivity } from './ticket-activity'

// All status buttons shown in panel; CANCELLED is disabled (backend gap)
const STATUS_BUTTONS: Array<{ status: UiWritableStatus | 'CANCELLED'; label: string }> = [
  { status: 'OPEN', label: 'Aberto' },
  { status: 'IN_PROGRESS', label: 'Em andamento' },
  { status: 'RESOLVED', label: 'Resolvido' },
  { status: 'CANCELLED', label: 'Cancelado' },
]

function shortId(publicId: string | undefined): string {
  if (!publicId) return '—'
  return publicId.slice(0, 8)
}

export interface TicketDetailProps {
  publicId: string
  onClose: () => void
}

export function TicketDetail({ publicId, onClose }: TicketDetailProps) {
  const qc = useQueryClient()
  const [note, setNote] = useState('')

  const ticketQ = useGetTicketByPublicId(publicId)
  // Cast: API declares return as TicketLogResponse but returns PageTicketLogResponse (schema swap gotcha)
  const logsQ = useGetTicketLogs(publicId, {
    pageable: { page: 0, size: 50, sort: ['changeDate,desc'] },
  })
  const logsData = logsQ.data as PageTicketLogResponse | undefined
  const logs = logsData?.content ?? []

  const updateMut = useUpdateTicket({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetTicketByPublicIdQueryKey(publicId) })
        qc.invalidateQueries({ queryKey: getGetTicketLogsQueryKey(publicId) })
      },
    },
  })

  const ticket = ticketQ.data
  const currentUiStatus = ticket?.status
    ? apiToUiStatus(ticket.status as ApiTicketStatus)
    : null

  function handleStatusChange(ui: UiWritableStatus) {
    if (currentUiStatus === ui || updateMut.isPending) return
    updateMut.mutate({
      ticketPublicId: publicId,
      data: { status: uiToApiStatus(ui) as TicketUpdateRequestStatus },
    })
  }

  function handleSaveNote() {
    const trimmed = note.trim()
    if (!trimmed || updateMut.isPending) return
    updateMut.mutate(
      { ticketPublicId: publicId, data: { solution: trimmed } },
      { onSuccess: () => setNote('') },
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        style={{ background: 'rgba(0,0,0,0.35)' }}
      />

      {/* Panel */}
      <div
        className="fixed inset-y-0 right-0 z-50 flex w-full flex-col sm:w-[480px]"
        style={{
          background: 'var(--wl-surface)',
          borderLeft: '1px solid var(--wl-border)',
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex shrink-0 items-center gap-2 px-5 py-3"
          style={{ borderBottom: '1px solid var(--wl-border)' }}
        >
          <span
            className="shrink-0 font-mono text-[12px]"
            style={{ color: 'var(--wl-text-muted)' }}
          >
            {shortId(ticket?.publicId)}
          </span>
          {currentUiStatus && (
            <>
              <span style={{ color: 'var(--wl-border-2)' }}>•</span>
              <StatusChip status={currentUiStatus} size="sm" />
            </>
          )}
          <h2
            className="min-w-0 flex-1 truncate text-[14px] font-semibold"
            style={{ color: 'var(--wl-text)' }}
          >
            {ticketQ.isLoading ? '…' : (ticket?.title ?? '(sem título)')}
          </h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[var(--wl-surface-2)]"
            style={{ color: 'var(--wl-text-muted)' }}
            aria-label="Fechar"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="scroll-hide flex-1 overflow-y-auto px-5 py-4">
          {ticketQ.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={20} className="animate-spin" style={{ color: 'var(--wl-text-muted)' }} />
            </div>
          ) : (
            <div className="space-y-5">
              {/* ── Meta grid ── */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <MetaItem label="STATUS">
                  {currentUiStatus && <StatusChip status={currentUiStatus} size="sm" />}
                </MetaItem>
                <MetaItem label="CLIENTE">
                  <span className="text-[13px]" style={{ color: 'var(--wl-text)' }}>
                    {ticket?.client?.name ?? '—'}
                  </span>
                </MetaItem>
                <MetaItem label="SISTEMA">
                  <span className="text-[13px]" style={{ color: 'var(--primary)' }}>
                    {ticket?.system?.name ?? '—'}
                  </span>
                </MetaItem>
                <MetaItem label="AUTOR">
                  {ticket?.user ? (
                    <div className="flex items-center gap-1.5">
                      <WlAvatar name={ticket.user.name ?? ''} size={18} />
                      <span className="text-[13px]" style={{ color: 'var(--wl-text)' }}>
                        {ticket.user.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[13px]" style={{ color: 'var(--wl-text-muted)' }}>—</span>
                  )}
                </MetaItem>
                <MetaItem label="CRIADO">
                  <span className="text-[13px]" style={{ color: 'var(--wl-text)' }}>
                    {fmtDate(ticket?.createdAt)}
                  </span>
                </MetaItem>
                <MetaItem label="ATUALIZADO">
                  <span className="text-[13px]" style={{ color: 'var(--wl-text)' }}>
                    {fmtDate(ticket?.updatedAt)}
                  </span>
                </MetaItem>
              </div>

              {/* ── Status change ── */}
              <div>
                <p
                  className="mb-2 text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--wl-text-muted)' }}
                >
                  Mudar status:
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {STATUS_BUTTONS.map(({ status, label }) => {
                    const isCancelled = status === 'CANCELLED'
                    const isActive = currentUiStatus === status
                    const meta = STATUS_META[status as keyof typeof STATUS_META]

                    return (
                      <button
                        key={status}
                        disabled={isCancelled || updateMut.isPending}
                        onClick={() =>
                          !isCancelled && handleStatusChange(status as UiWritableStatus)
                        }
                        className="rounded px-2.5 py-1 text-[12px] font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                        style={
                          isActive
                            ? {
                                background: meta.background,
                                color: meta.color,
                                border: `1px solid ${meta.color}55`,
                              }
                            : {
                                background: 'var(--wl-surface-2)',
                                color: 'var(--wl-text-muted)',
                                border: '1px solid var(--wl-border)',
                              }
                        }
                      >
                        {label}
                      </button>
                    )
                  })}
                  {updateMut.isPending && (
                    <Loader2
                      size={14}
                      className="animate-spin"
                      style={{ color: 'var(--wl-text-muted)' }}
                    />
                  )}
                </div>
              </div>

              {/* ── Description ── */}
              {ticket?.description && (
                <div>
                  <SectionTitle>DESCRIÇÃO</SectionTitle>
                  <p
                    className="text-[13px] leading-relaxed"
                    style={{ color: 'var(--wl-text)' }}
                  >
                    {ticket.description}
                  </p>
                </div>
              )}

              {/* ── Activity ── */}
              <div>
                <SectionTitle>HISTÓRICO DE ALTERAÇÕES</SectionTitle>
                {logsQ.isLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2
                      size={16}
                      className="animate-spin"
                      style={{ color: 'var(--wl-text-muted)' }}
                    />
                  </div>
                ) : (
                  <TicketActivity logs={logs} />
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer: add note ── */}
        <div
          className="shrink-0 space-y-2 px-5 py-3"
          style={{ borderTop: '1px solid var(--wl-border)' }}
        >
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Adicionar nota..."
            rows={2}
            className="w-full resize-none rounded-lg px-3 py-2 text-[13px] outline-none transition-colors placeholder:text-[var(--wl-text-dim)] focus:ring-1 focus:ring-[var(--primary)]"
            style={{
              background: 'var(--wl-surface-2)',
              border: '1px solid var(--wl-border)',
              color: 'var(--wl-text)',
            }}
          />
          <div className="flex justify-end">
            <button
              onClick={handleSaveNote}
              disabled={!note.trim() || updateMut.isPending}
              className="rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-opacity disabled:opacity-40"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              {updateMut.isPending ? 'Salvando…' : 'Salvar nota'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function MetaItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p
        className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide"
        style={{ color: 'var(--wl-text-muted)' }}
      >
        {label}
      </p>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-2 text-[11px] font-semibold uppercase tracking-wide"
      style={{ color: 'var(--wl-text-muted)' }}
    >
      {children}
    </p>
  )
}
