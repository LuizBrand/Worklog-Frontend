'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { intervaloDaPagina, paginasVisiveis } from '@/lib/pagination'

export interface PaginationProps {
  /** Página atual, base 0 — igual ao `number` do envelope do Spring. */
  page: number
  totalPages: number
  totalElements: number
  /** Itens desta página; menor que `size` na última. */
  numberOfElements: number
  size: number
  onChange: (page: number) => void
  className?: string
}

export function Pagination({
  page,
  totalPages,
  totalElements,
  numberOfElements,
  size,
  onChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const { primeiro, ultimo } = intervaloDaPagina(page, size, numberOfElements)

  return (
    <div className={`flex flex-col items-center gap-1.5 py-4 ${className ?? ''}`}>
      <div className="flex items-center gap-1">
        <Seta
          label="Página anterior"
          disabled={page === 0}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={14} />
        </Seta>

        {paginasVisiveis(page, totalPages).map((p, i) =>
          p === null ? (
            <span
              key={`gap-${i}`}
              className="px-1 text-[12px]"
              style={{ color: 'var(--wl-text-dim)' }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className="flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-lg px-2 text-[13px] font-medium tabular-nums transition-colors"
              style={
                p === page
                  ? { background: 'var(--primary)', color: '#fff' }
                  : { color: 'var(--wl-text-muted)' }
              }
            >
              {p + 1}
            </button>
          ),
        )}

        <Seta
          label="Próxima página"
          disabled={page >= totalPages - 1}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={14} />
        </Seta>
      </div>

      <span className="text-[12px] tabular-nums" style={{ color: 'var(--wl-text-muted)' }}>
        {primeiro}–{ultimo} de {totalElements}
      </span>
    </div>
  )
}

// ── Internos ──────────────────────────────────────────────────────────────────

function Seta({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-[var(--wl-surface-2)] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
      style={{ color: 'var(--wl-text-muted)' }}
    >
      {children}
    </button>
  )
}
