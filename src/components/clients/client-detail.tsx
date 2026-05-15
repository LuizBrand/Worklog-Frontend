'use client'

import { useState } from 'react'
import { X, Loader2, Pencil, Ban, RotateCcw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  useFindClientByPublicId,
  useSoftDeleteClient,
  useUpdateClient,
} from '@/api/generated/clientes/clientes'
import { fmtDate } from '@/lib/worklog-meta'
import { invalidateClients, invalidateClient } from '@/api/invalidate'
import { useAuthStore } from '@/state/auth'
import { StatusPill } from '@/components/worklog'
import { ClientEditDialog } from './client-form'

export interface ClientDetailProps {
  publicId: string
  onClose: () => void
}

export function ClientDetail({ publicId, onClose }: ClientDetailProps) {
  const qc = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const isAdmin = currentUser?.roles?.some((r) => r.role === 'ADMIN') ?? false

  const [showEdit, setShowEdit] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'deactivate' | 'reactivate' | null>(null)

  function handleClose() {
    if (isClosing) return
    setIsClosing(true)
    setTimeout(onClose, 175)
  }

  const clientQ = useFindClientByPublicId(publicId)
  const client = clientQ.data

  const deactivateMut = useSoftDeleteClient({
    mutation: {
      onSuccess: () => {
        invalidateClient(qc, publicId)
        invalidateClients(qc)
        toast.success('Cliente desativado')
        setConfirmAction(null)
      },
      onError: () => setConfirmAction(null),
    },
  })

  const reactivateMut = useUpdateClient({
    mutation: {
      onSuccess: () => {
        invalidateClient(qc, publicId)
        invalidateClients(qc)
        toast.success('Cliente reativado')
        setConfirmAction(null)
      },
      onError: () => setConfirmAction(null),
    },
  })

  function handleReactivate() {
    if (!client) return
    reactivateMut.mutate({
      publicId,
      data: {
        name: client.name ?? '',
        systemsPublicIds: client.systems?.map((s) => s.publicId ?? '').filter(Boolean) ?? [],
        enabled: true,
      },
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 ${isClosing ? 'animate-fade-out-backdrop' : 'animate-fade-in-backdrop'}`}
        onClick={handleClose}
        style={{ background: 'rgba(0,0,0,0.35)' }}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
        style={{ pointerEvents: 'none' }}
      >
        <div
          className={`flex w-full max-w-[600px] flex-col rounded-xl shadow-2xl ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}
          style={{
            background: 'var(--wl-surface)',
            border: '1px solid var(--wl-border)',
            pointerEvents: 'auto',
            maxHeight: 'calc(100dvh - 3rem)',
          }}
        >
          {/* ── Header ── */}
          <div
            className="flex shrink-0 items-center gap-2 px-5 py-3"
            style={{ borderBottom: '1px solid var(--wl-border)' }}
          >
            <h2
              className="min-w-0 flex-1 truncate text-[14px] font-semibold"
              style={{ color: 'var(--wl-text)' }}
            >
              {clientQ.isLoading ? '…' : (client?.name ?? '(sem nome)')}
            </h2>
            {client && (
              <button
                onClick={() => setShowEdit(true)}
                className="flex h-7 w-7 cursor-pointer shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[var(--wl-surface-2)]"
                style={{ color: 'var(--wl-text-muted)' }}
                aria-label="Editar cliente"
                title="Editar"
              >
                <Pencil size={13} />
              </button>
            )}
            {client && isAdmin && (
              client.enabled === false ? (
                <button
                  onClick={() => setConfirmAction('reactivate')}
                  className="flex h-7 w-7 cursor-pointer shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[var(--wl-surface-2)]"
                  style={{ color: 'var(--wl-text-muted)' }}
                  aria-label="Reativar cliente"
                  title="Reativar"
                >
                  <RotateCcw size={13} />
                </button>
              ) : (
                <button
                  onClick={() => setConfirmAction('deactivate')}
                  className="flex h-7 w-7 cursor-pointer shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[var(--wl-surface-2)]"
                  style={{ color: '#e53e3e' }}
                  aria-label="Desativar cliente"
                  title="Desativar"
                >
                  <Ban size={13} />
                </button>
              )
            )}
            <button
              onClick={handleClose}
              className="flex h-7 w-7 cursor-pointer shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[var(--wl-surface-2)]"
              style={{ color: 'var(--wl-text-muted)' }}
              aria-label="Fechar"
            >
              <X size={15} />
            </button>
          </div>

          {/* ── Scrollable body ── */}
          <div className="scroll-hide flex-1 overflow-y-auto px-5 py-4">
            {clientQ.isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={20} className="animate-spin" style={{ color: 'var(--wl-text-muted)' }} />
              </div>
            ) : (
              <div className="space-y-0">
                {/* ── Meta grid ── */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 pb-4">
                  <MetaItem label="STATUS">
                    <StatusPill active={client?.enabled !== false} variant="badge" />
                  </MetaItem>
                  <MetaItem label="CRIADO">
                    <span className="text-[13px]" style={{ color: 'var(--wl-text)' }}>
                      {fmtDate(client?.createdAt)}
                    </span>
                  </MetaItem>
                </div>

                <Divider />

                {/* ── Systems ── */}
                <div className="py-4">
                  <SectionTitle>SISTEMAS ASSOCIADOS</SectionTitle>
                  {!client?.systems || client.systems.length === 0 ? (
                    <p className="text-[13px]" style={{ color: 'var(--wl-text-muted)' }}>
                      Nenhum sistema associado.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {client.systems.map((s) => (
                        <span
                          key={s.publicId}
                          className="rounded px-2 py-1 text-[12px] font-medium"
                          style={{
                            background: 'var(--wl-surface-2)',
                            border: '1px solid var(--wl-border)',
                            color: 'var(--wl-text)',
                          }}
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit dialog ── */}
      {showEdit && client && (
        <ClientEditDialog
          client={client}
          onClose={() => setShowEdit(false)}
        />
      )}

      {/* ── Confirm deactivate/reactivate ── */}
      {confirmAction && client && (
        <ConfirmDialog
          title={confirmAction === 'deactivate' ? 'Desativar cliente?' : 'Reativar cliente?'}
          message={
            confirmAction === 'deactivate'
              ? `O cliente "${client.name ?? ''}" será marcado como inativo.`
              : `O cliente "${client.name ?? ''}" será reativado.`
          }
          confirmLabel={confirmAction === 'deactivate' ? 'Desativar' : 'Reativar'}
          danger={confirmAction === 'deactivate'}
          loading={deactivateMut.isPending || reactivateMut.isPending}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            if (confirmAction === 'deactivate') deactivateMut.mutate({ publicId })
            else handleReactivate()
          }}
        />
      )}
    </>
  )
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  danger,
  loading,
  onCancel,
  onConfirm,
}: {
  title: string
  message: string
  confirmLabel: string
  danger?: boolean
  loading?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <>
      <div className="fixed inset-0 z-[60]" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onCancel} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-6" style={{ pointerEvents: 'none' }}>
        <div
          className="w-full max-w-sm rounded-xl p-5 shadow-2xl"
          style={{ background: 'var(--wl-surface)', border: '1px solid var(--wl-border)', pointerEvents: 'auto' }}
        >
          <h3 className="mb-1 text-[14px] font-semibold" style={{ color: 'var(--wl-text)' }}>{title}</h3>
          <p className="mb-4 text-[12px]" style={{ color: 'var(--wl-text-muted)' }}>{message}</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-[13px] font-medium transition-opacity hover:opacity-70"
              style={{ background: 'var(--wl-surface-2)', color: 'var(--wl-text-muted)', border: '1px solid var(--wl-border)' }}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-opacity disabled:opacity-50"
              style={{ background: danger ? '#e53e3e' : 'var(--primary)', color: '#fff' }}
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function Divider() {
  return (
    <div
      className="-mx-5 h-px"
      style={{ background: 'var(--wl-border)' }}
    />
  )
}

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
