'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

import { useFindAllClients } from '@/api/generated/clientes/clientes'
import { ClientTable } from '@/components/clients/client-table'
import { ClientDetail } from '@/components/clients/client-detail'
import { ClientCreateDialog, ClientEditFetcher } from '@/components/clients/client-form'
import { FilterSelect } from '@/components/worklog'
import type { ClientResponse } from '@/api/generated/schemas'

const STATUS_OPTIONS = [
  { label: 'Todos',    value: ''       },
  { label: 'Ativos',   value: 'ATIVO'  },
  { label: 'Inativos', value: 'INATIVO' },
]

export default function ClientesPage() {
  const router = useRouter()
  const params = useSearchParams()
  const searchRef = useRef<HTMLInputElement>(null)

  const selectedId = params.get('id') ?? ''
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ATIVO' | 'INATIVO' | ''>('')
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const routerRef = useRef(router)

  useEffect(() => { routerRef.current = router }, [router])

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

  // Client-side filtering
  const filtered = allClients.filter((c) => {
    const matchesName = !searchInput || (c.name ?? '').toLowerCase().includes(searchInput.toLowerCase())
    const matchesStatus =
      !statusFilter ||
      (statusFilter === 'ATIVO' && c.enabled !== false) ||
      (statusFilter === 'INATIVO' && c.enabled === false)
    return matchesName && matchesStatus
  })

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

        {/* + Novo */}
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

      {/* ── Table ── */}
      <ClientTable
        clients={filtered}
        loading={clientsQ.isLoading}
        onRowClick={openDetail}
        onEdit={(id) => setEditId(id)}
      />

      {/* ── Detail panel ── */}
      {selectedId && <ClientDetail publicId={selectedId} onClose={closeDetail} />}

      {/* ── Create dialog ── */}
      {showCreate && <ClientCreateDialog onClose={() => setShowCreate(false)} />}

      {/* ── Edit from row menu ── */}
      {editId && <ClientEditFetcher publicId={editId} onClose={() => setEditId(null)} />}
    </div>
  )
}

