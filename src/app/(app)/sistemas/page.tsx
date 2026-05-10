'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

import { useFindAllSystems } from '@/api/generated/sistemas/sistemas'
import { useFindAllClients } from '@/api/generated/clientes/clientes'
import { SystemTable } from '@/components/systems/system-table'
import { SystemDetail } from '@/components/systems/system-detail'
import { SystemCreateDialog, SystemEditFetcher } from '@/components/systems/system-form'
import type { SystemResponse } from '@/api/generated/schemas'

export default function SistemasPage() {
  const router = useRouter()
  const params = useSearchParams()
  const searchRef = useRef<HTMLInputElement>(null)

  const selectedId = params.get('id') ?? ''
  const [searchInput, setSearchInput] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const routerRef = useRef(router)

  useEffect(() => { routerRef.current = router }, [router])

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
      router.replace(`/sistemas?${next.toString()}`)
    },
    [params, router],
  )

  function openDetail(publicId: string) { setParam('id', publicId) }
  function closeDetail() {
    const next = new URLSearchParams(params.toString())
    next.delete('id')
    router.replace(`/sistemas?${next.toString()}`)
  }

  const systemsQ = useFindAllSystems()
  const clientsQ = useFindAllClients({ filtersParams: {} })

  const allSystems: SystemResponse[] = systemsQ.data ?? []

  const filtered = allSystems.filter((s) =>
    !searchInput || (s.name ?? '').toLowerCase().includes(searchInput.toLowerCase())
  )

  // Build client count per system for the grid cards
  const clientCountBySystem: Record<string, number> = {}
  for (const client of clientsQ.data ?? []) {
    for (const sys of client.systems ?? []) {
      if (sys.publicId) clientCountBySystem[sys.publicId] = (clientCountBySystem[sys.publicId] ?? 0) + 1
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <div
        className="flex h-[52px] shrink-0 items-center gap-3 px-6"
        style={{ borderBottom: '1px solid var(--wl-border)' }}
      >
        <h1 className="text-[18px] font-semibold" style={{ color: 'var(--wl-text)' }}>
          Sistemas
        </h1>

        <div className="flex-1" />

        {/* Search */}
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-1.5"
          style={{ background: 'var(--wl-surface-2)', border: '1px solid var(--wl-border)', minWidth: 220 }}
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

      {/* ── Grid ── */}
      <SystemTable
        systems={filtered}
        clientCountBySystem={clientCountBySystem}
        loading={systemsQ.isLoading}
        onRowClick={openDetail}
        onEdit={(id) => setEditId(id)}
      />

      {/* ── Detail modal ── */}
      {selectedId && <SystemDetail publicId={selectedId} onClose={closeDetail} />}

      {/* ── Create dialog ── */}
      {showCreate && <SystemCreateDialog onClose={() => setShowCreate(false)} />}

      {/* ── Edit from row menu ── */}
      {editId && <SystemEditFetcher publicId={editId} onClose={() => setEditId(null)} />}
    </div>
  )
}
