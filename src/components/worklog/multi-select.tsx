'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Search, X } from 'lucide-react'

import type { FilterOption } from './filter-select'

export interface MultiSelectProps {
  value: string[]
  onChange: (value: string[]) => void
  options: FilterOption[]
  placeholder?: string
  /** Ícone dentro do campo, à esquerda — mesmo padrão dos inputs do formulário. */
  icon?: React.ReactNode
  disabled?: boolean
  className?: string
}

interface DropPos {
  top?: number
  bottom?: number
  left: number
  width: number
}

/**
 * Campo de seleção múltipla: clica, abre a lista, marca o que quiser.
 *
 * Substitui a grade de checkboxes que ocupava meia tela do formulário de
 * cliente. Segue o mesmo padrão de portal do `ClientCombobox` — a lista fica
 * fora da árvore do dialog para não ser cortada pelo `overflow` dele.
 */
export function MultiSelect({
  value,
  onChange,
  options,
  placeholder = 'Selecionar...',
  icon,
  disabled,
  className = '',
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [pos, setPos] = useState<DropPos | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selecionadas = options.filter((o) => value.includes(o.value))

  const filtradas = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options

  function abrir() {
    if (!triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    const espacoAbaixo = window.innerHeight - r.bottom
    if (espacoAbaixo < 280) {
      setPos({ bottom: window.innerHeight - r.top + 4, left: r.left, width: r.width })
    } else {
      setPos({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    setOpen(true)
    setTimeout(() => searchRef.current?.focus(), 30)
  }

  useEffect(() => {
    if (!open) return
    function fora(e: MouseEvent) {
      const alvo = e.target as Node
      if (
        panelRef.current && !panelRef.current.contains(alvo) &&
        triggerRef.current && !triggerRef.current.contains(alvo)
      ) {
        setOpen(false)
        setQuery('')
      }
    }
    function escape(e: KeyboardEvent) {
      // Fecha só a lista; o Escape do dialog não pode fechar o formulário junto.
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', escape, true)
    return () => {
      document.removeEventListener('mousedown', fora)
      document.removeEventListener('keydown', escape, true)
    }
  }, [open])

  function alternar(v: string) {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  }

  const resumo =
    selecionadas.length === 0
      ? placeholder
      : selecionadas.length <= 2
        ? selecionadas.map((o) => o.label).join(', ')
        : `${selecionadas.length} selecionados`

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : abrir())}
        className="flex w-full cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          // Mesmo fundo do dialog: o contraste vem da borda, que ganha a cor
          // primária quando a lista está aberta.
          background: 'var(--wl-surface)',
          borderColor: open ? 'var(--primary)' : 'var(--wl-border)',
          color: selecionadas.length > 0 ? 'var(--wl-text)' : 'var(--wl-text-dim)',
        }}
      >
        {icon && <span className="flex shrink-0 items-center">{icon}</span>}
        <span className="flex-1 truncate text-left">{resumo}</span>
        <ChevronDown
          size={13}
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--wl-text-muted)' }}
        />
      </button>

      {open && pos && createPortal(
        <div
          ref={panelRef}
          className="overflow-hidden rounded-lg shadow-xl"
          style={{
            position: 'fixed',
            zIndex: 9999,
            ...pos,
            background: 'var(--wl-surface)',
            border: '1px solid var(--wl-border)',
          }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{ borderBottom: '1px solid var(--wl-border)' }}
          >
            <Search size={13} style={{ color: 'var(--wl-text-muted)', flexShrink: 0 }} />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar..."
              className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-[var(--wl-text-muted)]"
              style={{ color: 'var(--wl-text)' }}
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Limpar busca">
                <X size={12} style={{ color: 'var(--wl-text-muted)' }} />
              </button>
            )}
          </div>

          <div className="scroll-hide max-h-56 overflow-y-auto py-1">
            {filtradas.length === 0 ? (
              <p className="px-3 py-2 text-[12px]" style={{ color: 'var(--wl-text-muted)' }}>
                Nenhum resultado
              </p>
            ) : (
              filtradas.map((o) => {
                const marcado = value.includes(o.value)
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => alternar(o.value)}
                    aria-pressed={marcado}
                    className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors hover:bg-[var(--wl-surface-2)]"
                    style={{ color: marcado ? 'var(--primary)' : 'var(--wl-text)' }}
                  >
                    <Check
                      size={12}
                      className={marcado ? 'opacity-100' : 'opacity-0'}
                      style={{ color: 'var(--primary)', flexShrink: 0 }}
                    />
                    {o.label}
                  </button>
                )
              })
            )}
          </div>

          {selecionadas.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="w-full cursor-pointer px-3 py-2 text-left text-[12px] transition-colors hover:bg-[var(--wl-surface-2)]"
              style={{ borderTop: '1px solid var(--wl-border)', color: 'var(--wl-text-muted)' }}
            >
              Limpar seleção
            </button>
          )}
        </div>,
        document.body,
      )}
    </div>
  )
}
