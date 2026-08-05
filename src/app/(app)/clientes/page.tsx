'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { keepPreviousData, useQueryClient } from '@tanstack/react-query'

import { useFindAllClients, useUpdateClient } from '@/api/generated/clientes/clientes'
import { useFindAllTickets } from '@/api/generated/tickets/tickets'
import { ClientGrid } from '@/components/clients/client-grid'
import { ClientTable, type ClientStats } from '@/components/clients/client-table'
import { ClientCreateDialog } from '@/components/clients/client-create-dialog'
import { ConfirmDialog, FilterSelect, MobileFab } from '@/components/worklog'
import { invalidateClients, invalidateClient } from '@/api/invalidate'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { looksLikeDocumento, stripDocumento } from '@/lib/documento'
import { useAuthStore } from '@/state/auth'
import type { ClientResponse } from '@/api/clients-contract'
import type {
  ClientFiltersParams,
  ClientFiltersParamsStatus,
  ClientFiltersParamsTipo,
  PageTicketSummary,
  TicketSummary,
} from '@/api/generated/schemas'

const STATUS_OPTIONS = [
  { label: 'Todos',    value: ''        },
  { label: 'Ativos',   value: 'ATIVO'   },
  { label: 'Inativos', value: 'INATIVO' },
]

const TIPO_OPTIONS = [
  { label: 'PJ e PF',        value: ''   },
  { label: 'Pessoa Jurídica', value: 'PJ' },
  { label: 'Pessoa Física',   value: 'PF' },
]

const OPEN_STATUSES = new Set<TicketSummary['status']>([
  'PENDING',
  'AWAITING_CUSTOMER',
  'AWAITING_DEVELOPMENT',
])

const IN_PROGRESS_STATUSES = new Set<TicketSummary['status']>([
  'AWAITING_CUSTOMER',
  'AWAITING_DEVELOPMENT',
])

export default function ClientesPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const isAdmin = currentUser?.roles?.some((r) => r.role === 'ADMIN') ?? false
  const searchRef = useRef<HTMLInputElement>(null)

  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClientFiltersParamsStatus | ''>('')
  const [tipoFilter, setTipoFilter] = useState<ClientFiltersParamsTipo | ''>('')
  const [showCreate, setShowCreate] = useState(false)
  const [toggleTarget, setToggleTarget] = useState<{ publicId: string; name: string; active: boolean } | null>(null)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  // Um caminho só para ativar e inativar (§8 do contrato recomenda o PATCH e
  // não expor o DELETE; reativar só existe pelo PATCH de qualquer forma).
  const toggleMut = useUpdateClient({
    mutation: {
      onSuccess: (_data, vars) => {
        invalidateClient(qc, vars.publicId)
        invalidateClients(qc)
        toast.success(toggleTarget?.active ? 'Cliente desativado' : 'Cliente reativado')
        setToggleTarget(null)
      },
      onError: () => setToggleTarget(null),
    },
  })

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

  function openDetail(publicId: string) {
    router.push(`/clientes/${publicId}`)
  }

  // Busca única: documento casa por igualdade exata contra qualquer filial,
  // nome é LIKE parcial. `looksLikeDocumento` decide em qual filtro o texto vai.
  const search = useDebouncedValue(searchInput.trim(), 300)
  const filtersParams = useMemo<ClientFiltersParams>(() => {
    const f: ClientFiltersParams = {}
    if (search) {
      if (looksLikeDocumento(search)) f.documento = stripDocumento(search)
      else f.name = search
    }
    if (statusFilter) f.status = statusFilter
    if (tipoFilter) f.tipo = tipoFilter
    return f
  }, [search, statusFilter, tipoFilter])

  // Sem paginação neste endpoint. `keepPreviousData` evita o skeleton piscar a
  // cada tecla enquanto o filtro novo carrega.
  const clientsQ = useFindAllClients(
    { filtersParams },
    { query: { placeholderData: keepPreviousData } },
  )
  // Fronteira do Orval: o gerado marca todo campo sem @NotNull como opcional.
  // `src/api/clients-contract.ts` é a obrigatoriedade real.
  const clients = (clientsQ.data ?? []) as unknown as ClientResponse[]

  // Fetch a large page of tickets and aggregate stats client-side.
  // No dedicated aggregation endpoint exists; acceptable while volume is low.
  const ticketsQ = useFindAllTickets({
    filters: {},
    pageable: { page: 0, size: 500, sort: ['updatedAt,desc'] },
  })

  const statsByClient = useMemo<Record<string, ClientStats>>(() => {
    const page = ticketsQ.data as PageTicketSummary | undefined
    const rows: TicketSummary[] = page?.content ?? []
    const out: Record<string, ClientStats> = {}
    for (const t of rows) {
      const cid = t.client?.publicId
      if (!cid) continue
      const bucket = out[cid] ?? { total: 0, open: 0, critical: 0, pending: 0, inProgress: 0 }
      bucket.total += 1
      if (OPEN_STATUSES.has(t.status)) {
        bucket.open += 1
        if (t.priority === 'CRITICAL') bucket.critical += 1
      }
      if (t.status === 'PENDING') bucket.pending += 1
      if (IN_PROGRESS_STATUSES.has(t.status)) bucket.inProgress += 1
      out[cid] = bucket
    }
    return out
  }, [ticketsQ.data])

  const hasFilter = Boolean(statusFilter || tipoFilter)

  function onToggleActive(publicId: string, active: boolean, name: string) {
    if (!isAdmin) return
    setToggleTarget({ publicId, name, active })
  }

  function confirmToggle() {
    if (!toggleTarget) return
    toggleMut.mutate({ publicId: toggleTarget.publicId, data: { enabled: !toggleTarget.active } })
  }

  return (
    <div className="flex h-full flex-col">
      {/* ── Desktop header ── */}
      <div
        className="hidden md:flex h-[52px] shrink-0 items-center gap-3 px-6"
        style={{ borderBottom: '1px solid var(--wl-border)' }}
      >
        <h1 className="text-[18px] font-semibold" style={{ color: 'var(--wl-text)' }}>
          Clientes
        </h1>
        {!clientsQ.isLoading && (
          <span className="text-[12px]" style={{ color: 'var(--wl-text-muted)' }}>
            {clients.length} {clients.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}
          </span>
        )}

        <div className="flex-1" />

        <div
          className="flex items-center gap-2 rounded-lg px-3 py-1.5"
          style={{ background: 'var(--wl-surface-2)', border: '1px solid var(--wl-border)', minWidth: 280 }}
        >
          <Search size={14} style={{ color: 'var(--wl-text-muted)', flexShrink: 0 }} />
          <input
            ref={searchRef}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nome, CNPJ ou CPF ( / )"
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-[var(--wl-text-muted)]"
            style={{ color: 'var(--wl-text)' }}
          />
        </div>

        <FilterSelect
          value={tipoFilter}
          onChange={(v) => setTipoFilter(v as typeof tipoFilter)}
          options={TIPO_OPTIONS}
        />
        <FilterSelect
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as typeof statusFilter)}
          options={STATUS_OPTIONS}
        />

        <button
          onClick={() => setShowCreate(true)}
          className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-opacity hover:opacity-85"
          style={{ background: 'var(--primary)', color: '#fff' }}
        >
          + Cliente
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
          Clientes
        </h1>

        <div className="flex-1" />

        {/* Search (mobile) */}
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 flex-1 max-w-[180px]"
          style={{ background: 'var(--wl-surface-2)', border: '1px solid var(--wl-border)' }}
        >
          <Search size={13} style={{ color: 'var(--wl-text-muted)', flexShrink: 0 }} />
          <input
            ref={searchRef}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Nome, CNPJ ou CPF"
            className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-[var(--wl-text-muted)] min-w-0"
            style={{ color: 'var(--wl-text)' }}
          />
        </div>

        {/* Filter icon */}
        <button
          onClick={() => setMobileFilterOpen((v) => !v)}
          className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-[var(--wl-surface-2)]"
          style={{ color: hasFilter ? 'var(--primary)' : 'var(--wl-text-muted)' }}
          aria-label="Filtros"
        >
          <Filter size={18} />
          {hasFilter && (
            <span
              className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
              style={{ background: 'var(--primary)' }}
            />
          )}
        </button>
      </div>

      {/* ── Mobile filter panel ── */}
      {mobileFilterOpen && (
        <div
          className="md:hidden flex flex-col gap-2 px-4 py-3"
          style={{ borderBottom: '1px solid var(--wl-border)' }}
        >
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                active={statusFilter === opt.value}
                onClick={() => setStatusFilter(opt.value as typeof statusFilter)}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {TIPO_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                active={tipoFilter === opt.value}
                onClick={() => setTipoFilter(opt.value as typeof tipoFilter)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Tabela (desktop) ── */}
      <div className="hidden md:flex md:flex-1 md:min-h-0 md:flex-col">
        <ClientTable
          clients={clients}
          statsByClient={statsByClient}
          loading={clientsQ.isLoading}
          onRowClick={openDetail}
        />
      </div>

      {/* ── Cards (mobile) ── */}
      <div className="flex flex-1 min-h-0 flex-col md:hidden">
        <ClientGrid
          clients={clients}
          statsByClient={statsByClient}
          loading={clientsQ.isLoading}
          onCardClick={openDetail}
          onViewTickets={(publicId) => router.push(`/tickets?clientId=${publicId}`)}
          onToggleActive={isAdmin ? onToggleActive : undefined}
        />
      </div>

      {/* ── Create dialog ── */}
      {showCreate && <ClientCreateDialog onClose={() => setShowCreate(false)} />}

      {/* ── Mobile FAB ── */}
      <MobileFab onClick={() => setShowCreate(true)} />

      {/* ── Confirm deactivate/activate ── */}
      {toggleTarget && (
        <ConfirmDialog
          title={toggleTarget.active ? 'Desativar cliente?' : 'Reativar cliente?'}
          message={
            toggleTarget.active
              ? `O cliente "${toggleTarget.name}" será marcado como inativo.`
              : `O cliente "${toggleTarget.name}" voltará a ser ativo.`
          }
          confirmLabel={toggleTarget.active ? 'Desativar' : 'Reativar'}
          danger={toggleTarget.active}
          loading={toggleMut.isPending}
          onCancel={() => setToggleTarget(null)}
          onConfirm={confirmToggle}
        />
      )}
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex shrink-0 cursor-pointer items-center rounded-full px-3 py-1.5 text-[12px] font-medium whitespace-nowrap transition-colors"
      style={{
        border: `1px solid ${active ? 'var(--primary)' : 'var(--wl-border)'}`,
        background: active ? 'color-mix(in oklch, var(--primary) 15%, transparent)' : 'var(--wl-surface-2)',
        color: active ? 'var(--primary)' : 'var(--wl-text-muted)',
      }}
    >
      {label}
    </button>
  )
}
