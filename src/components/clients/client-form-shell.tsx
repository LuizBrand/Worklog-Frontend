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
  subtitle,
  icon,
  wide,
}: {
  children: React.ReactNode
  footer?: React.ReactNode
  onClose: () => void
  title: string
  subtitle?: string
  icon?: React.ReactNode
  /** Reservado para dialogs de listagem (filiais), que precisam de mais espaço. */
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
        className={`flex w-full flex-col rounded-xl shadow-2xl ${wide ? 'max-w-2xl' : 'max-w-[540px]'}`}
        style={{
          background: 'var(--wl-surface)',
          border: '1px solid var(--wl-border)',
          pointerEvents: 'auto',
          maxHeight: 'calc(100dvh - 2rem)',
        }}
      >
        {/* Sem linha divisória: o mockup separa header, corpo e rodapé só por espaço. */}
        <div className="flex shrink-0 items-start gap-3 px-5 pb-2 pt-5">
          {icon && (
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: 'color-mix(in oklab, var(--primary) 16%, transparent)',
                color: 'var(--primary)',
              }}
            >
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-semibold leading-tight" style={{ color: 'var(--wl-text)' }}>
              {title}
            </h2>
            {subtitle && (
              <p className="text-[12px]" style={{ color: 'var(--wl-text-muted)' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-[var(--wl-surface-2)]"
            style={{ color: 'var(--wl-text-muted)' }}
            aria-label="Fechar"
          >
            <X size={15} />
          </button>
        </div>

        <div className="scroll-hide flex-1 overflow-y-auto px-5 py-3">{children}</div>

        {/* Rodapé fixo, também sem divisória: o formulário é alto e os botões
            não podem sumir no scroll. */}
        {footer && <div className="flex shrink-0 justify-end gap-2 px-5 pb-5 pt-2">{footer}</div>}
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
      {/* Caixa normal, como o mockup — não o caixa-alta espaçado de antes. */}
      <label className="block text-[12px]" style={{ color: 'var(--wl-text-muted)' }}>
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

/**
 * Campo de formulário: **mesmo fundo do dialog**, sem preenchimento próprio.
 *
 * O contraste vem da borda — discreta em repouso, na cor primária quando o
 * campo está em foco. A borda mora aqui, em classe, e não em `style` inline,
 * justamente para o `focus:` conseguir sobrescrevê-la: estilo inline ganha de
 * classe e o foco não apareceria.
 */
export const inputCls =
  'w-full rounded-lg border px-3 py-2 text-[13px] outline-none transition-colors ' +
  'bg-transparent border-[var(--wl-border)] text-[var(--wl-text)] ' +
  'placeholder:text-[var(--wl-text-dim)] focus:border-[var(--primary)]'

/**
 * `<select>` precisa de fundo explícito: com `transparent`, a lista de opções
 * nativa fica ilegível em parte dos navegadores, que a pinta com o fundo do
 * próprio elemento.
 *
 * Escrito por extenso, e não como `${inputCls} bg-…`: as duas classes de fundo
 * teriam a mesma especificidade e quem venceria seria a ordem do CSS gerado —
 * a mesma armadilha que já colapsou um campo para 26px neste módulo.
 */
export const selectCls =
  'w-full cursor-pointer rounded-lg border px-3 py-2 text-[13px] outline-none transition-colors ' +
  'bg-[var(--wl-surface)] border-[var(--wl-border)] text-[var(--wl-text)] ' +
  'focus:border-[var(--primary)]'

/**
 * Input com ícone dentro, à esquerda — o padrão visual do mockup.
 *
 * O ícone é decorativo (`aria-hidden`): quem nomeia o campo é o `label` do
 * `FormField` em volta.
 */
export function IconInput({
  icon,
  acao,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ReactNode
  /** Botão à direita, dentro do campo — a lupa de consulta de CNPJ. */
  acao?: React.ReactNode
}) {
  return (
    <div className="relative">
      {icon && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center"
          style={{ color: 'var(--wl-text-dim)' }}
        >
          {icon}
        </span>
      )}
      <input
        {...props}
        className={`${inputCls} ${icon ? 'pl-9' : ''} ${acao ? 'pr-9' : ''} ${props.className ?? ''}`}
        style={props.style}
      />
      {acao && <span className="absolute right-1.5 top-1/2 -translate-y-1/2">{acao}</span>}
    </div>
  )
}
