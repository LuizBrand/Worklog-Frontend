'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

import { useFindAllTickets } from '@/api/generated/tickets/tickets'
import { useFindAllClients } from '@/api/generated/clientes/clientes'
import { TicketFiltersParamsStatus } from '@/api/generated/schemas'
import { TicketTable } from '@/components/tickets/ticket-table'
import { TicketDetail } from '@/components/tickets/ticket-detail'
import type { PageTicketSummary } from '@/api/generated/schemas'
import { STATUS_META } from '@/lib/worklog-meta'
import { UI_STATUS_WRITABLE, uiToApiStatus } from '@/lib/ticket-status'
import type { UiWritableStatus } from '@/lib/ticket-status'

const STATUS_OPTIONS = [
  { label: 'Todos status', value: '' },
  ...UI_STATUS_WRITABLE.map((s) => ({
    label: STATUS_META[s as UiWritableStatus].label,
    value: uiToApiStatus(s as UiWritableStatus),
  })),
]

export default function TicketsPage() {
  const router = useRouter()
  const params = useSearchParams()
  const searchRef = useRef<HTMLInputElement>(null)

  const q = params.get('q') ?? ''
  const status = (params.get('status') ?? '') as TicketFiltersParamsStatus | ''
  const clientId = params.get('clientId') ?? ''
  const page = Number(params.get('page') ?? '0')
  const selectedId = params.get('id') ?? ''

  const [searchInput, setSearchInput] = useState(q)
  const routerRef = useRef(router)

  useEffect(() => { routerRef.current = router }, [router])

  // Debounce search → URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = new URLSearchParams(window.location.search)
      if (searchInput) next.set('q', searchInput)
      else next.delete('q')
      next.delete('page')
      routerRef.current.replace(`/tickets?${next.toString()}`)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  // "/" focuses search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Escape closes detail panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedId) closeDetail()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString())
      if (value) next.set(key, value)
      else next.delete(key)
      if (key !== 'page' && key !== 'id') next.delete('page')
      router.replace(`/tickets?${next.toString()}`)
    },
    [params, router],
  )

  function openDetail(publicId: string) {
    setParam('id', publicId)
  }

  function closeDetail() {
    const next = new URLSearchParams(params.toString())
    next.delete('id')
    router.replace(`/tickets?${next.toString()}`)
  }

  const ticketsQ = useFindAllTickets({
    filters: {
      title: q || undefined,
      status: (status as TicketFiltersParamsStatus) || undefined,
      clientId: clientId || undefined,
    },
    pageable: { page, size: 20, sort: ['updatedAt,desc'] },
  })

  const clientsQ = useFindAllClients({ filtersParams: {} })

  // Cast: OpenAPI spec has 200/401 schemas swapped — see memory/gotchas.md
  const page_data = ticketsQ.data as PageTicketSummary | undefined
  const tickets = page_data?.content ?? []
  const totalPages = page_data?.totalPages ?? 1
  const totalElements = page_data?.totalElements ?? 0

  return (
    <div className="flex h-full flex-col">
      {/* ── Page header ── */}
      <div
        className="flex shrink-0 items-center gap-3 px-6 py-3"
        style={{ borderBottom: '1px solid var(--wl-border)' }}
      >
        <h1 className="text-[18px] font-semibold" style={{ color: 'var(--wl-text)' }}>
          Tickets
        </h1>

        <div className="flex-1" />

        {/* Search */}
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-1.5"
          style={{
            background: 'var(--wl-surface-2)',
            border: '1px solid var(--wl-border)',
            minWidth: 220,
          }}
        >
          <Search size={14} style={{ color: 'var(--wl-text-muted)', flexShrink: 0 }} />
          <input
            ref={searchRef}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar... ( / )"
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-[var(--wl-text-muted)]"
            style={{ color: 'var(--wl-text)' }}
          />
        </div>

        {/* Status filter */}
        <FilterSelect value={status} onChange={(v) => setParam('status', v)}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </FilterSelect>

        {/* Client filter */}
        <FilterSelect value={clientId} onChange={(v) => setParam('clientId', v)}>
          <option value="">Todos clientes</option>
          {(clientsQ.data ?? []).map((c) => (
            <option key={c.publicId} value={c.publicId ?? ''}>
              {c.name}
            </option>
          ))}
        </FilterSelect>

        {/* + Novo */}
        <button
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-opacity hover:opacity-85"
          style={{ background: 'var(--primary)', color: '#fff' }}
          disabled
          title="Em breve"
        >
          + Novo
          <kbd
            className="flex h-4 w-4 items-center justify-center rounded text-[10px] font-bold"
            style={{ background: 'rgba(255,255,255,0.25)', color: '#fff' }}
          >
            C
          </kbd>
        </button>
      </div>

      {/* ── Table ── */}
      <TicketTable tickets={tickets} loading={ticketsQ.isLoading} onRowClick={openDetail} />

      {/* ── Pagination ── */}
      {!ticketsQ.isLoading && totalPages > 1 && (
        <div
          className="flex shrink-0 items-center justify-between px-6 py-3"
          style={{ borderTop: '1px solid var(--wl-border)' }}
        >
          <span className="text-[12px]" style={{ color: 'var(--wl-text-muted)' }}>
            {totalElements} ticket{totalElements !== 1 ? 's' : ''}
          </span>

          <div className="flex items-center gap-3">
            <button
              disabled={page === 0}
              onClick={() => setParam('page', String(page - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-md transition-opacity disabled:opacity-30 hover:bg-[var(--wl-surface-2)]"
              style={{ color: 'var(--wl-text-muted)' }}
              aria-label="Página anterior"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="text-[12px] tabular-nums" style={{ color: 'var(--wl-text-muted)' }}>
              Página {page + 1} de {totalPages}
            </span>

            <button
              disabled={page >= totalPages - 1}
              onClick={() => setParam('page', String(page + 1))}
              className="flex h-7 w-7 items-center justify-center rounded-md transition-opacity disabled:opacity-30 hover:bg-[var(--wl-surface-2)]"
              style={{ color: 'var(--wl-text-muted)' }}
              aria-label="Próxima página"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Detail panel ── */}
      {selectedId && <TicketDetail publicId={selectedId} onClose={closeDetail} />}
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[34px] appearance-none rounded-lg py-0 pl-3 pr-8 text-[13px] outline-none transition-colors"
        style={{
          background: 'var(--wl-surface-2)',
          border: '1px solid var(--wl-border)',
          color: value ? 'var(--wl-text)' : 'var(--wl-text-muted)',
        }}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
        style={{ color: 'var(--wl-text-muted)' }}
      />
    </div>
  )
}
