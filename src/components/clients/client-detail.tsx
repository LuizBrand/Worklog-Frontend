'use client'

import { useState } from 'react'
import { X, Loader2, Pencil } from 'lucide-react'

import { useFindClientByPublicId } from '@/api/generated/clientes/clientes'
import { fmtDate } from '@/lib/worklog-meta'
import { ClientStatusBadge } from './client-table'
import { ClientEditDialog } from './client-form'

export interface ClientDetailProps {
  publicId: string
  onClose: () => void
}

export function ClientDetail({ publicId, onClose }: ClientDetailProps) {
  const [showEdit, setShowEdit] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  function handleClose() {
    if (isClosing) return
    setIsClosing(true)
    setTimeout(onClose, 175)
  }

  const clientQ = useFindClientByPublicId(publicId)
  const client = clientQ.data

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
                    <ClientStatusBadge enabled={client?.enabled} />
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
