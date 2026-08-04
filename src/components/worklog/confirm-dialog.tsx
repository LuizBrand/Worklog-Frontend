'use client'

import { Loader2 } from 'lucide-react'

export interface ConfirmDialogProps {
  title: string
  message: React.ReactNode
  confirmLabel: string
  cancelLabel?: string
  danger?: boolean
  loading?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  danger,
  loading,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <>
      <div
        className="fixed inset-0 z-[60]"
        style={{ background: 'rgba(0,0,0,0.45)' }}
        onClick={() => !loading && onCancel()}
      />
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-6"
        style={{ pointerEvents: 'none' }}
      >
        <div
          className="w-full max-w-sm rounded-xl p-5 shadow-2xl"
          style={{
            background: 'var(--wl-surface)',
            border: '1px solid var(--wl-border)',
            pointerEvents: 'auto',
          }}
        >
          <h3 className="mb-1 text-[14px] font-semibold" style={{ color: 'var(--wl-text)' }}>
            {title}
          </h3>
          <p className="mb-4 text-[12px]" style={{ color: 'var(--wl-text-muted)' }}>
            {message}
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              disabled={loading}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-[13px] font-medium transition-opacity hover:opacity-70 disabled:opacity-50"
              style={{
                background: 'var(--wl-surface-2)',
                color: 'var(--wl-text-muted)',
                border: '1px solid var(--wl-border)',
              }}
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ background: danger ? 'var(--wl-danger)' : 'var(--primary)' }}
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
