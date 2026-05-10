'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'

export interface FilterOption {
  value: string
  label: string
}

interface FilterSelectProps {
  value: string
  onChange: (v: string) => void
  options: FilterOption[]
  /** Extra classes on the outer wrapper — use "w-full" for form fields */
  className?: string
}

interface DropPos {
  top?: number
  bottom?: number
  left: number
  minWidth: number
}

export function FilterSelect({ value, onChange, options, className = '' }: FilterSelectProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<DropPos | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const current = options.find((o) => o.value === value) ?? options[0]

  function openDrop() {
    if (!triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - r.bottom
    if (spaceBelow < 200) {
      setPos({ bottom: window.innerHeight - r.top + 4, left: r.left, minWidth: r.width })
    } else {
      setPos({ top: r.bottom + 4, left: r.left, minWidth: r.width })
    }
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      const target = e.target as Node
      if (
        wrapRef.current && !wrapRef.current.contains(target) &&
        triggerRef.current && !triggerRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function select(v: string) {
    onChange(v)
    setOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openDrop())}
        className="flex h-[34px] w-full cursor-pointer items-center gap-2 rounded-lg pl-3 pr-2.5 text-[13px] transition-colors"
        style={{
          background: 'var(--wl-surface-2)',
          border: '1px solid var(--wl-border)',
          color: value ? 'var(--wl-text)' : 'var(--wl-text-muted)',
          minWidth: 140,
        }}
      >
        <span className="flex-1 truncate text-left">{current?.label}</span>
        <ChevronDown
          size={13}
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--wl-text-muted)' }}
        />
      </button>

      {open && pos && createPortal(
        <div
          ref={wrapRef}
          className="overflow-hidden rounded-lg py-1 shadow-xl"
          style={{
            position: 'fixed',
            zIndex: 9999,
            ...pos,
            background: 'var(--wl-surface)',
            border: '1px solid var(--wl-border)',
          }}
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => select(o.value)}
              className="flex w-full cursor-pointer items-center gap-2 whitespace-nowrap px-3 py-2 text-left text-[13px] transition-colors hover:bg-[var(--wl-surface-2)]"
              style={{ color: o.value === value ? 'var(--primary)' : 'var(--wl-text)' }}
            >
              <Check
                size={12}
                className={o.value === value ? 'opacity-100' : 'opacity-0'}
                style={{ color: 'var(--primary)', flexShrink: 0 }}
              />
              {o.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}
