'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react'

import { useFindAllTickets } from '@/api/generated/tickets/tickets'
import { useFindAllClients } from '@/api/generated/clientes/clientes'
import { TicketFiltersParamsStatus } from '@/api/generated/schemas'
import { TicketTable, MobileTicketCards } from '@/components/tickets/ticket-table'
import { TicketDetail } from '@/components/tickets/ticket-detail'
import { TicketCreateDialog, TicketEditFetcher, TicketDeleteDialog } from '@/components/tickets/ticket-form'
import { FilterSelect, ClientCombobox, MobileFab } from '@/components/worklog'
import { STATUS_META } from '@/lib/worklog-meta'
import { UI_STATUS_WRITABLE, uiToApiStatus } from '@/lib/ticket-status'
import type { UiWritableStatus } from '@/lib/ticket-status'
import type { PageTicketSummary } from '@/api/generated/schemas'

const STATUS_OPTIONS = [
  { label: 'Todos status', value: '' },
  ...UI_STATUS_WRITABLE.map((s) => ({
    label: STATUS_META[s as UiWritableStatus].label,
    value: uiToApiStatus(s as UiWritableStatus),
  })),
]

// Status chips shown on mobile — maps UI status to API status value
const MOBILE_STATUS_CHIPS = [
  { label: 'Todos', value: '' as TicketFiltersParamsStatus | '', icon: null, color: null },
  {
    label: 'Abertos',
    value: TicketFiltersParamsStatus.PENDING as TicketFiltersParamsStatus | '',
    icon: STATUS_META.OPEN.icon,
    color: STATUS_META.OPEN.color,
  },
  {
    label: 'Andamento',
    value: TicketFiltersParamsStatus.AWAITING_CUSTOMER as TicketFiltersParamsStatus | '',
    icon: STATUS_META.IN_PROGRESS.icon,
    color: STATUS_META.IN_PROGRESS.color,
  },
  {
    label: 'Aguard. dev',
    value: TicketFiltersParamsStatus.AWAITING_DEVELOPMENT as TicketFiltersParamsStatus | '',
    icon: STATUS_META.AWAITING_DEV.icon,
    color: STATUS_META.AWAITING_DEV.color,
  },
  {
    label: 'Resolvidos',
    value: TicketFiltersParamsStatus.COMPLETED as TicketFiltersParamsStatus | '',
    icon: STATUS_META.RESOLVED.icon,
    color: STATUS_META.RESOLVED.color,
  },
] as const

export default function TicketsPage() {
  const router = useRouter()
  const params = useSearchParams()
  const searchRef = useRef<HTMLInputElement>(null)
  const mobileSearchRef = useRef<HTMLInputElement>(null)

  const q = params.get('q') ?? ''
  const status = (params.get('status') ?? '') as TicketFiltersParamsStatus | ''
  const clientId = params.get('clientId') ?? ''
  const page = Number(params.get('page') ?? '0')
  const selectedId = params.get('id') ?? ''

  const [searchInput, setSearchInput] = useState(q)
  const [showCreate, setShowCreate] = useState(() => params.get('create') === '1')
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const routerRef = useRef(router)

  useEffect(() => { routerRef.current = router }, [router])

  // Remove ?create=1 from URL after dialog is opened
  useEffect(() => {
    if (params.get('create') === '1') {
      const next = new URLSearchParams(params.toString())
      next.delete('create')
      router.replace(`/tickets?${next.toString()}`)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  // "/" focuses search; "c" opens create dialog
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus() }
      if (e.key === 'c' || e.key === 'C') { e.preventDefault(); setShowCreate(true) }
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

  // `pageable` vazio: sem `page`/`size` a resposta continua sendo o array cru
  // de sempre (§6 do contrato). Só a listagem de clientes pagina.
  const clientsQ = useFindAllClients({ filtersParams: {}, pageable: {} })

  // Cast: OpenAPI spec has 200/401 schemas swapped — see memory/gotchas.md
  const page_data = ticketsQ.data as PageTicketSummary | undefined
  const tickets = page_data?.content ?? []
  const totalPages = page_data?.totalPages ?? 1
  const totalElements = page_data?.totalElements ?? 0

  const clientOptions = (clientsQ.data ?? []).map((c) => ({
    value: c.publicId ?? '',
    label: c.name ?? '',
  }))

  const hasActiveFilter = !!clientId

  return (
    <div className="flex h-full flex-col">

      {/* ── Desktop header ── */}
      <div
        className="hidden md:flex h-[52px] shrink-0 items-center gap-3 px-6"
        style={{ borderBottom: '1px solid var(--wl-border)' }}
      >
        <h1 className="text-[18px] font-semibold" style={{ color: 'var(--wl-text)' }}>
          Tickets
        </h1>

        <div className="flex-1" />

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

        <FilterSelect value={status} onChange={(v) => setParam('status', v)} options={STATUS_OPTIONS} />

        <ClientCombobox
          value={clientId}
          onChange={(v) => setParam('clientId', v)}
          options={clientOptions}
          emptyLabel="Todos clientes"
        />

        <button
          onClick={() => setShowCreate(true)}
          className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-opacity hover:opacity-85"
          style={{ background: 'var(--primary)', color: '#fff' }}
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

      {/* ── Mobile header ── */}
      <div
        className="md:hidden flex h-[52px] shrink-0 items-center gap-2 px-4"
        style={{ borderBottom: '1px solid var(--wl-border)' }}
      >
        <h1 className="text-[18px] font-semibold" style={{ color: 'var(--wl-text)' }}>
          Tickets
        </h1>

        <div className="flex-1" />

        {/* Filter icon — opens client filter panel */}
        <button
          onClick={() => setMobileFilterOpen((v) => !v)}
          className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-[var(--wl-surface-2)]"
          style={{ color: hasActiveFilter ? 'var(--primary)' : 'var(--wl-text-muted)' }}
          aria-label="Filtros"
        >
          <Filter size={18} />
          {hasActiveFilter && (
            <span
              className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
              style={{ background: 'var(--primary)' }}
            />
          )}
        </button>
      </div>

      {/* ── Mobile search bar ── */}
      <div className="md:hidden px-4 pt-3 pb-2">
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ background: 'var(--wl-surface-2)', border: '1px solid var(--wl-border)' }}
        >
          <Search size={14} style={{ color: 'var(--wl-text-muted)', flexShrink: 0 }} />
          <input
            ref={mobileSearchRef}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar tickets..."
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-[var(--wl-text-muted)]"
            style={{ color: 'var(--wl-text)' }}
          />
          {searchInput && (
            <button onClick={() => setSearchInput('')} className="cursor-pointer">
              <X size={13} style={{ color: 'var(--wl-text-muted)' }} />
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile status chips ── */}
      <div className="md:hidden flex gap-2 px-4 pb-3 overflow-x-auto scroll-hide">
        {MOBILE_STATUS_CHIPS.map((chip) => {
          const active = status === chip.value
          const Icon = chip.icon
          return (
            <button
              key={chip.value}
              onClick={() => setParam('status', chip.value)}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium whitespace-nowrap transition-colors"
              style={{
                border: `1px solid ${active ? 'var(--primary)' : 'var(--wl-border)'}`,
                background: active
                  ? 'color-mix(in oklch, var(--primary) 15%, transparent)'
                  : 'var(--wl-surface-2)',
                color: active ? 'var(--primary)' : chip.color ?? 'var(--wl-text-muted)',
              }}
            >
              {Icon && (
                <Icon
                  size={11}
                  style={{ color: active ? 'var(--primary)' : chip.color ?? 'var(--wl-text-muted)' }}
                />
              )}
              {chip.label}
            </button>
          )
        })}
      </div>

      {/* ── Mobile filter panel (client filter) ── */}
      {mobileFilterOpen && (
        <div
          className="md:hidden px-4 pb-3"
          style={{ borderBottom: '1px solid var(--wl-border)' }}
        >
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--wl-text-muted)' }}>
            Cliente
          </p>
          <ClientCombobox
            value={clientId}
            onChange={(v) => setParam('clientId', v)}
            options={clientOptions}
            emptyLabel="Todos os clientes"
            className="w-full"
          />
        </div>
      )}

      {/* ── Desktop table ── */}
      <div className="hidden md:flex flex-1 flex-col overflow-hidden">
        <TicketTable
          tickets={tickets}
          loading={ticketsQ.isLoading}
          onRowClick={openDetail}
          onEdit={(id) => setEditId(id)}
          onDelete={(id) => setDeleteId(id)}
        />
      </div>

      {/* ── Mobile card list ── */}
      <div className="md:hidden flex-1 overflow-y-auto scroll-hide">
        <MobileTicketCards
          tickets={tickets}
          loading={ticketsQ.isLoading}
          onTicketClick={openDetail}
          onEdit={(id) => setEditId(id)}
          onDelete={(id) => setDeleteId(id)}
        />
      </div>

      {/* ── Desktop pagination ── */}
      {!ticketsQ.isLoading && totalPages > 1 && (
        <div
          className="hidden md:flex shrink-0 items-center justify-between px-6 py-3"
          style={{ borderTop: '1px solid var(--wl-border)' }}
        >
          <span className="text-[12px]" style={{ color: 'var(--wl-text-muted)' }}>
            {totalElements} ticket{totalElements !== 1 ? 's' : ''}
          </span>

          <div className="flex items-center gap-3">
            <button
              disabled={page === 0}
              onClick={() => setParam('page', String(page - 1))}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-opacity disabled:opacity-30 hover:bg-[var(--wl-surface-2)]"
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
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-opacity disabled:opacity-30 hover:bg-[var(--wl-surface-2)]"
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

      {/* ── Create dialog ── */}
      {showCreate && <TicketCreateDialog onClose={() => setShowCreate(false)} />}

      {/* ── Edit / Delete from row menu ── */}
      {editId && <TicketEditFetcher publicId={editId} onClose={() => setEditId(null)} />}
      {deleteId && <TicketDeleteDialog publicId={deleteId} onClose={() => setDeleteId(null)} />}

      {/* ── Mobile FAB ── */}
      <MobileFab onClick={() => setShowCreate(true)} />
    </div>
  )
}
