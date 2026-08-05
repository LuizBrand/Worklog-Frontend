'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

/** Casca visual dos dialogs de cliente. Extraída do antigo `client-form.tsx`. */

export function Backdrop({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40"
      onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.45)' }}
    />
  )
}

export function DialogCard({
  children,
  footer,
  onClose,
  title,
  wide,
}: {
  children: React.ReactNode
  footer?: React.ReactNode
  onClose: () => void
  title: string
  /** O formulário completo (endereço, contatos, filiais) não cabe em `max-w-lg`. */
  wide?: boolean
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ pointerEvents: 'none' }}>
      <div
        className={`flex w-full flex-col rounded-xl shadow-2xl ${wide ? 'max-w-2xl' : 'max-w-lg'}`}
        style={{
          background: 'var(--wl-surface)',
          border: '1px solid var(--wl-border)',
          pointerEvents: 'auto',
          maxHeight: 'calc(100dvh - 2rem)',
        }}
      >
        <div
          className="flex shrink-0 items-center justify-between px-5 py-3.5"
          style={{ borderBottom: '1px solid var(--wl-border)' }}
        >
          <h2 className="text-[15px] font-semibold" style={{ color: 'var(--wl-text)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-[var(--wl-surface-2)]"
            style={{ color: 'var(--wl-text-muted)' }}
            aria-label="Fechar"
          >
            <X size={15} />
          </button>
        </div>

        <div className="scroll-hide flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {/* Rodapé fixo: o formulário é alto e os botões não podem sumir no scroll. */}
        {footer && (
          <div
            className="flex shrink-0 justify-end gap-2 px-5 py-3"
            style={{ borderTop: '1px solid var(--wl-border)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function FormField({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label
        className="text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: 'var(--wl-text-muted)' }}
      >
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="text-[11px]" style={{ color: 'var(--wl-text-dim)' }}>
          {hint}
        </p>
      )}
      {error && (
        <p className="text-[11px]" style={{ color: 'var(--status-open)' }}>
          {error}
        </p>
      )}
    </div>
  )
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <h3
        className="text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: 'var(--wl-text-muted)' }}
      >
        {children}
      </h3>
      <div className="h-px flex-1" style={{ background: 'var(--wl-border)' }} />
      {action}
    </div>
  )
}

export const inputCls =
  'w-full rounded-lg px-3 py-2 text-[13px] outline-none transition-colors placeholder:text-[var(--wl-text-dim)] focus:ring-1 focus:ring-[var(--primary)]'

export const inputStyle = {
  background: 'var(--wl-surface-2)',
  border: '1px solid var(--wl-border)',
  color: 'var(--wl-text)',
}
