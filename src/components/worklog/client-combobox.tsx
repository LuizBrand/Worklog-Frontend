'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search, Check, X } from 'lucide-react'
import type { FilterOption } from './filter-select'

interface ClientComboboxProps {
  value: string
  onChange: (v: string) => void
  options: FilterOption[]
  emptyLabel?: string
  className?: string
}

interface DropPos {
  top?: number
  bottom?: number
  left: number
  width: number
}

export function ClientCombobox({
  value,
  onChange,
  options,
  emptyLabel = 'Selecionar...',
  className = '',
}: ClientComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [pos, setPos] = useState<DropPos | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selected = options.find((o) => o.value === value)

  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  function openDrop() {
    if (!triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - r.bottom
    if (spaceBelow < 280) {
      setPos({ bottom: window.innerHeight - r.top + 4, left: r.left, width: Math.max(r.width, 256) })
    } else {
      setPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 256) })
    }
    setOpen(true)
    setTimeout(() => searchRef.current?.focus(), 30)
  }

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      const target = e.target as Node
      if (
        panelRef.current && !panelRef.current.contains(target) &&
        triggerRef.current && !triggerRef.current.contains(target)
      ) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function toggle() {
    if (open) {
      setOpen(false)
      setQuery('')
    } else {
      openDrop()
    }
  }

  function select(v: string) {
    onChange(v)
    setOpen(false)
    setQuery('')
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
    setOpen(false)
    setQuery('')
  }

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        className="flex h-[34px] w-full cursor-pointer items-center gap-2 rounded-lg pl-3 pr-2 text-[13px] transition-colors"
        style={{
          background: 'var(--wl-surface-2)',
          border: '1px solid var(--wl-border)',
          color: selected ? 'var(--wl-text)' : 'var(--wl-text-muted)',
          minWidth: 140,
        }}
      >
        <span className="flex-1 truncate text-left">{selected?.label ?? emptyLabel}</span>
        {selected ? (
          <X
            size={12}
            className="shrink-0 opacity-50 hover:opacity-100"
            style={{ color: 'var(--wl-text-muted)' }}
            onClick={clear}
          />
        ) : (
          <ChevronDown
            size={13}
            className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
            style={{ color: 'var(--wl-text-muted)' }}
          />
        )}
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
              <button type="button" onClick={() => setQuery('')}>
                <X size={12} style={{ color: 'var(--wl-text-muted)' }} />
              </button>
            )}
          </div>

          <div className="scroll-hide max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-[12px]" style={{ color: 'var(--wl-text-muted)' }}>
                Nenhum resultado
              </p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => select(o.value)}
                  className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors hover:bg-[var(--wl-surface-2)]"
                  style={{ color: o.value === value ? 'var(--primary)' : 'var(--wl-text)' }}
                >
                  <Check
                    size={12}
                    className={o.value === value ? 'opacity-100' : 'opacity-0'}
                    style={{ color: 'var(--primary)', flexShrink: 0 }}
                  />
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
