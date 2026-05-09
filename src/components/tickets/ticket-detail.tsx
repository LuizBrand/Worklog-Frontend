'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { X, Loader2, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  useGetTicketByPublicId,
  getGetTicketByPublicIdQueryKey,
  useGetTicketLogs,
  getGetTicketLogsQueryKey,
  useUpdateTicket,
  useDeleteTicket,
} from '@/api/generated/tickets/tickets'
import { StatusChip, WlAvatar } from '@/components/worklog'
import { apiToUiStatus, uiToApiStatus } from '@/lib/ticket-status'
import { STATUS_META, fmtDate } from '@/lib/worklog-meta'
import type { PageTicketLogResponse } from '@/api/generated/schemas'
import { TicketUpdateRequestStatus } from '@/api/generated/schemas'
import type { ApiTicketStatus, UiWritableStatus } from '@/lib/ticket-status'
import { invalidateTickets } from '@/api/invalidate'
import { TicketEditDialog } from './ticket-form'
import { TicketActivity } from './ticket-activity'

// All status buttons shown in panel; CANCELLED is disabled (backend gap)
const STATUS_BUTTONS: Array<{ status: UiWritableStatus | 'CANCELLED'; label: string }> = [
  { status: 'OPEN', label: 'Aberto' },
  { status: 'IN_PROGRESS', label: 'Em andamento' },
  { status: 'RESOLVED', label: 'Resolvido' },
  { status: 'CANCELLED', label: 'Cancelado' },
]


export interface TicketDetailProps {
  publicId: string
  onClose: () => void
}

export function TicketDetail({ publicId, onClose }: TicketDetailProps) {
  const qc = useQueryClient()
  const [note, setNote] = useState('')
  const [showEdit, setShowEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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
        invalidateTickets(qc)
      },
    },
  })

  const deleteMut = useDeleteTicket({
    mutation: {
      onSuccess: () => {
        invalidateTickets(qc)
        toast.success('Ticket excluído')
        onClose()
      },
      onError: () => {
        toast.error('Erro ao excluir ticket')
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
          {currentUiStatus && (
            <StatusChip status={currentUiStatus} iconOnly />
          )}
          <h2
            className="min-w-0 flex-1 truncate text-[14px] font-semibold"
            style={{ color: 'var(--wl-text)' }}
          >
            {ticketQ.isLoading ? '…' : (ticket?.title ?? '(sem título)')}
          </h2>
          {ticket && (
            <button
              onClick={() => setShowEdit(true)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[var(--wl-surface-2)]"
              style={{ color: 'var(--wl-text-muted)' }}
              aria-label="Editar ticket"
              title="Editar"
            >
              <Pencil size={13} />
            </button>
          )}
          {ticket && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[var(--wl-surface-2)]"
              style={{ color: '#e53e3e' }}
              aria-label="Excluir ticket"
              title="Excluir"
            >
              <Trash2 size={13} />
            </button>
          )}
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
            <div className="divide-y" style={{ '--tw-divide-color': 'var(--wl-border)' } as React.CSSProperties}>
              {/* ── Meta grid ── */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 pb-4">
                <MetaItem label="STATUS">
                  {currentUiStatus && <StatusChip status={currentUiStatus} size="sm" />}
                </MetaItem>
                <MetaItem label="CLIENTE">
                  <span className="text-[13px] font-medium" style={{ color: 'var(--wl-text)' }}>
                    {ticket?.client?.name ?? '—'}
                  </span>
                </MetaItem>
                <MetaItem label="SISTEMA">
                  <span className="text-[13px]" style={{ color: 'var(--wl-text-muted)' }}>
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
              <div className="py-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-[12px]" style={{ color: 'var(--wl-text-muted)' }}>
                    Mudar status:
                  </span>
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
                        className="text-[13px] transition-opacity disabled:cursor-not-allowed disabled:opacity-35 hover:opacity-70"
                        style={{
                          color: isCancelled ? 'var(--wl-text-muted)' : meta.color,
                          fontWeight: isActive ? 700 : 500,
                          textDecoration: isActive ? 'underline' : 'none',
                          textUnderlineOffset: '3px',
                        }}
                      >
                        {label}
                      </button>
                    )
                  })}
                  {updateMut.isPending && (
                    <Loader2
                      size={13}
                      className="animate-spin"
                      style={{ color: 'var(--wl-text-muted)' }}
                    />
                  )}
                </div>
              </div>

              {/* ── Description ── */}
              {ticket?.description && (
                <div className="py-4">
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
              <div className="pt-4">
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

      {/* ── Delete confirm ── */}
      {showDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 z-[60]"
            onClick={() => setShowDeleteConfirm(false)}
            style={{ background: 'rgba(0,0,0,0.5)' }}
          />
          <div
            className="fixed left-1/2 top-1/2 z-[70] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl p-6 shadow-2xl"
            style={{ background: 'var(--wl-surface)', border: '1px solid var(--wl-border)' }}
          >
            <h3 className="text-[15px] font-semibold" style={{ color: 'var(--wl-text)' }}>
              Excluir ticket?
            </h3>
            <p className="mt-1 text-[13px]" style={{ color: 'var(--wl-text-muted)' }}>
              Esta ação não pode ser desfeita.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg px-4 py-1.5 text-[13px] font-medium"
                style={{ background: 'var(--wl-surface-2)', color: 'var(--wl-text-muted)', border: '1px solid var(--wl-border)' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMut.mutate({ publicId })}
                disabled={deleteMut.isPending}
                className="flex items-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-semibold disabled:opacity-50"
                style={{ background: '#e53e3e', color: '#fff' }}
              >
                {deleteMut.isPending && <Loader2 size={13} className="animate-spin" />}
                Excluir
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Edit dialog ── */}
      {showEdit && ticket && (
        <TicketEditDialog ticket={ticket} onClose={() => setShowEdit(false)} />
      )}
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
