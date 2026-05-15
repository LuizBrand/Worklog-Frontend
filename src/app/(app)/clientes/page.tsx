'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

import {
  useFindAllClients,
  useSoftDeleteClient,
  useUpdateClient,
} from '@/api/generated/clientes/clientes'
import { useFindAllTickets } from '@/api/generated/tickets/tickets'
import { ClientGrid, type ClientStats } from '@/components/clients/client-grid'
import { ClientDetail } from '@/components/clients/client-detail'
import { ClientCreateDialog, ClientEditFetcher } from '@/components/clients/client-form'
import { FilterSelect } from '@/components/worklog'
import { invalidateClients, invalidateClient } from '@/api/invalidate'
import { useAuthStore } from '@/state/auth'
import type { ClientResponse, PageTicketSummary, TicketSummary } from '@/api/generated/schemas'

const STATUS_OPTIONS = [
  { label: 'Todos',    value: ''       },
  { label: 'Ativos',   value: 'ATIVO'  },
  { label: 'Inativos', value: 'INATIVO' },
]

const OPEN_STATUSES = new Set<TicketSummary['status']>([
  'PENDING',
  'AWAITING_CUSTOMER',
  'AWAITING_DEVELOPMENT',
])

export default function ClientesPage() {
  const router = useRouter()
  const params = useSearchParams()
  const qc = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const isAdmin = currentUser?.roles?.some((r) => r.role === 'ADMIN') ?? false
  const searchRef = useRef<HTMLInputElement>(null)

  const selectedId = params.get('id') ?? ''
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ATIVO' | 'INATIVO' | ''>('')
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [toggleTarget, setToggleTarget] = useState<{ publicId: string; name: string; active: boolean } | null>(null)

  const deactivateMut = useSoftDeleteClient({
    mutation: {
      onSuccess: () => {
        if (toggleTarget) invalidateClient(qc, toggleTarget.publicId)
        invalidateClients(qc)
        toast.success('Cliente desativado')
        setToggleTarget(null)
      },
      onError: () => setToggleTarget(null),
    },
  })

  const reactivateMut = useUpdateClient({
    mutation: {
      onSuccess: () => {
        if (toggleTarget) invalidateClient(qc, toggleTarget.publicId)
        invalidateClients(qc)
        toast.success('Cliente reativado')
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
      router.replace(`/clientes?${next.toString()}`)
    },
    [params, router],
  )

  function openDetail(publicId: string) { setParam('id', publicId) }

  function closeDetail() {
    const next = new URLSearchParams(params.toString())
    next.delete('id')
    router.replace(`/clientes?${next.toString()}`)
  }

  // Fetch all clients (no pagination on this endpoint)
  const clientsQ = useFindAllClients({ filtersParams: {} })
  const allClients: ClientResponse[] = clientsQ.data ?? []

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
      const bucket = out[cid] ?? { total: 0, open: 0, critical: 0 }
      bucket.total += 1
      if (OPEN_STATUSES.has(t.status)) {
        bucket.open += 1
        if (t.priority === 'CRITICAL') bucket.critical += 1
      }
      out[cid] = bucket
    }
    return out
  }, [ticketsQ.data])

  // Client-side filtering
  const filtered = allClients.filter((c) => {
    const matchesName = !searchInput || (c.name ?? '').toLowerCase().includes(searchInput.toLowerCase())
    const matchesStatus =
      !statusFilter ||
      (statusFilter === 'ATIVO' && c.enabled !== false) ||
      (statusFilter === 'INATIVO' && c.enabled === false)
    return matchesName && matchesStatus
  })

  function onToggleActive(publicId: string, active: boolean, name: string) {
    if (!isAdmin) return
    setToggleTarget({ publicId, name, active })
  }

  function confirmToggle() {
    if (!toggleTarget) return
    if (toggleTarget.active) {
      deactivateMut.mutate({ publicId: toggleTarget.publicId })
    } else {
      // Reactivate via PATCH; backend has no dedicated reactivate endpoint
      reactivateMut.mutate({ publicId: toggleTarget.publicId, data: { enabled: true } })
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* ── Page header ── */}
      <div
        className="flex h-[52px] shrink-0 items-center gap-3 px-6"
        style={{ borderBottom: '1px solid var(--wl-border)' }}
      >
        <h1 className="text-[18px] font-semibold" style={{ color: 'var(--wl-text)' }}>
          Clientes
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
        <FilterSelect value={statusFilter} onChange={(v) => setStatusFilter(v as typeof statusFilter)} options={STATUS_OPTIONS} />

        {/* + Cliente */}
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

      {/* ── Grid ── */}
      <ClientGrid
        clients={filtered}
        statsByClient={statsByClient}
        loading={clientsQ.isLoading}
        onCardClick={openDetail}
        onViewTickets={(publicId) => router.push(`/tickets?clientId=${publicId}`)}
        onToggleActive={isAdmin ? onToggleActive : undefined}
      />

      {/* ── Detail panel ── */}
      {selectedId && <ClientDetail publicId={selectedId} onClose={closeDetail} />}

      {/* ── Create dialog ── */}
      {showCreate && <ClientCreateDialog onClose={() => setShowCreate(false)} />}

      {/* ── Edit from row menu (legacy entry) ── */}
      {editId && <ClientEditFetcher publicId={editId} onClose={() => setEditId(null)} />}

      {/* ── Confirm deactivate/activate ── */}
      {toggleTarget && (
        <>
          <div
            className="fixed inset-0 z-[60]"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            onClick={() => !deactivateMut.isPending && !reactivateMut.isPending && setToggleTarget(null)}
          />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6" style={{ pointerEvents: 'none' }}>
            <div
              className="w-full max-w-sm rounded-xl p-5 shadow-2xl"
              style={{ background: 'var(--wl-surface)', border: '1px solid var(--wl-border)', pointerEvents: 'auto' }}
            >
              <h3 className="mb-1 text-[14px] font-semibold" style={{ color: 'var(--wl-text)' }}>
                {toggleTarget.active ? 'Desativar cliente?' : 'Reativar cliente?'}
              </h3>
              <p className="mb-4 text-[12px]" style={{ color: 'var(--wl-text-muted)' }}>
                {toggleTarget.active
                  ? <>O cliente &quot;{toggleTarget.name}&quot; será marcado como inativo.</>
                  : <>O cliente &quot;{toggleTarget.name}&quot; voltará a ser ativo.</>}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setToggleTarget(null)}
                  disabled={deactivateMut.isPending || reactivateMut.isPending}
                  className="cursor-pointer rounded-lg px-3 py-1.5 text-[13px] font-medium transition-opacity hover:opacity-70 disabled:opacity-50"
                  style={{ background: 'var(--wl-surface-2)', color: 'var(--wl-text-muted)', border: '1px solid var(--wl-border)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmToggle}
                  disabled={deactivateMut.isPending || reactivateMut.isPending}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-semibold text-white transition-opacity disabled:opacity-50"
                  style={{ background: toggleTarget.active ? '#e53e3e' : 'var(--primary)' }}
                >
                  {(deactivateMut.isPending || reactivateMut.isPending) && <Loader2 size={13} className="animate-spin" />}
                  {toggleTarget.active ? 'Desativar' : 'Reativar'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
