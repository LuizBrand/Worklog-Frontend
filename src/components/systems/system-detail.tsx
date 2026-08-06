'use client'

import { useState } from 'react'
import { X, Loader2, Pencil } from 'lucide-react'

import { useFindSystemByPublicId } from '@/api/generated/sistemas/sistemas'
import { useFindAllClients } from '@/api/generated/clientes/clientes'
import { SystemEditDialog } from './system-form'

export interface SystemDetailProps {
  publicId: string
  onClose: () => void
}

export function SystemDetail({ publicId, onClose }: SystemDetailProps) {
  const [showEdit, setShowEdit] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  function handleClose() {
    if (isClosing) return
    setIsClosing(true)
    setTimeout(onClose, 175)
  }

  const systemQ = useFindSystemByPublicId(publicId)
  const system = systemQ.data

  // Fetch all clients and filter client-side to find those using this system
  // `pageable` vazio: sem `page`/`size` a resposta continua sendo o array cru
  // de sempre (§6 do contrato). Só a listagem de clientes pagina.
  const clientsQ = useFindAllClients({ filtersParams: {}, pageable: {} })
  const relatedClients = (clientsQ.data ?? []).filter(
    (c) => c.systems?.some((s) => s.publicId === publicId)
  )

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 ${isClosing ? 'animate-fade-out-backdrop' : 'animate-fade-in-backdrop'}`}
        onClick={handleClose}
        style={{ background: 'rgba(0,0,0,0.35)' }}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ pointerEvents: 'none' }}>
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
            <h2 className="min-w-0 flex-1 truncate text-[14px] font-semibold" style={{ color: 'var(--wl-text)' }}>
              {systemQ.isLoading ? '…' : (system?.name ?? '(sem nome)')}
            </h2>
            {system && (
              <button
                onClick={() => setShowEdit(true)}
                className="flex h-7 w-7 cursor-pointer shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[var(--wl-surface-2)]"
                style={{ color: 'var(--wl-text-muted)' }}
                aria-label="Editar sistema"
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

          {/* ── Body ── */}
          <div className="scroll-hide flex-1 overflow-y-auto px-5 py-4">
            {systemQ.isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={20} className="animate-spin" style={{ color: 'var(--wl-text-muted)' }} />
              </div>
            ) : (
              <div>
                <SectionTitle>CLIENTES QUE USAM ESTE SISTEMA</SectionTitle>
                {clientsQ.isLoading ? (
                  <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--wl-text-muted)' }}>
                    <Loader2 size={13} className="animate-spin" /> Carregando…
                  </div>
                ) : relatedClients.length === 0 ? (
                  <p className="text-[13px]" style={{ color: 'var(--wl-text-muted)' }}>
                    Nenhum cliente associado a este sistema.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {relatedClients.map((c) => (
                      <div
                        key={c.publicId}
                        className="flex items-center gap-2 rounded-lg px-3 py-2"
                        style={{ background: 'var(--wl-surface-2)' }}
                      >
                        <span className="text-[13px] font-medium" style={{ color: 'var(--wl-text)' }}>
                          {c.name}
                        </span>
                        {c.enabled === false && (
                          <span
                            className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                            style={{ background: 'color-mix(in oklab, var(--wl-danger) 11%, transparent)', color: 'var(--wl-danger)' }}
                          >
                            Inativo
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit dialog ── */}
      {showEdit && system && (
        <SystemEditDialog system={system} onClose={() => setShowEdit(false)} />
      )}
    </>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--wl-text-muted)' }}>
      {children}
    </p>
  )
}
