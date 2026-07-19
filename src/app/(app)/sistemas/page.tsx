'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

import {
  useFindAllSystems,
  useUpdateSystem,
} from '@/api/generated/sistemas/sistemas'
import { useFindAllClients } from '@/api/generated/clientes/clientes'
import { useFindAllTickets } from '@/api/generated/tickets/tickets'
import { SystemGrid, type SystemStats } from '@/components/systems/system-grid'
import { SystemDetail } from '@/components/systems/system-detail'
import { SystemCreateDialog, SystemEditFetcher } from '@/components/systems/system-form'
import { invalidateSystems, invalidateSystem } from '@/api/invalidate'
import { useAuthStore } from '@/state/auth'
import { MobileFab } from '@/components/worklog'
import type {
  SystemResponse,
  SystemRequest,
  PageTicketSummary,
  TicketSummary,
} from '@/api/generated/schemas'

const OPEN_STATUSES = new Set<TicketSummary['status']>([
  'PENDING',
  'AWAITING_CUSTOMER',
  'AWAITING_DEVELOPMENT',
])

export default function SistemasPage() {
  const router = useRouter()
  const params = useSearchParams()
  const qc = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const isAdmin = currentUser?.roles?.some((r) => r.role === 'ADMIN') ?? false
  const searchRef = useRef<HTMLInputElement>(null)

  const selectedId = params.get('id') ?? ''
  const [searchInput, setSearchInput] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [toggleTarget, setToggleTarget] = useState<{ publicId: string; name: string; active: boolean } | null>(null)

  // Backend's PATCH /systems/{id} doesn't formally accept `enabled` in its
  // OpenAPI spec, but the response carries the field. We send the cast payload
  // so the toggle works when the backend exposes it; if ignored, the optimistic
  // refresh will revert the UI.
  const updateSystemMut = useUpdateSystem({
    mutation: {
      onSuccess: () => {
        if (toggleTarget) invalidateSystem(qc, toggleTarget.publicId)
        invalidateSystems(qc)
        toast.success(toggleTarget?.active ? 'Sistema desativado' : 'Sistema reativado')
        setToggleTarget(null)
      },
      onError: () => setToggleTarget(null),
    },
  })

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
  const ticketsQ = useFindAllTickets({
    filters: {},
    pageable: { page: 0, size: 500, sort: ['updatedAt,desc'] },
  })

  const systemsData = systemsQ.data

  // Stable index for `systemShortCode`: sort by name, then publicId for ties.
  const orderedSystems = useMemo<SystemResponse[]>(
    () =>
      [...(systemsData ?? [])].sort((a, b) => {
        const an = (a.name ?? '').toLowerCase()
        const bn = (b.name ?? '').toLowerCase()
        if (an !== bn) return an.localeCompare(bn, 'pt-BR')
        return (a.publicId ?? '').localeCompare(b.publicId ?? '')
      }),
    [systemsData],
  )

  const filtered = orderedSystems.filter((s) =>
    !searchInput || (s.name ?? '').toLowerCase().includes(searchInput.toLowerCase())
  )

  // Build client count per system (kept for legacy detail modal use)
  const clientCountBySystem: Record<string, number> = {}
  for (const client of clientsQ.data ?? []) {
    for (const sys of client.systems ?? []) {
      if (sys.publicId) clientCountBySystem[sys.publicId] = (clientCountBySystem[sys.publicId] ?? 0) + 1
    }
  }

  const statsBySystem = useMemo<Record<string, SystemStats>>(() => {
    const page = ticketsQ.data as PageTicketSummary | undefined
    const rows: TicketSummary[] = page?.content ?? []
    const out: Record<string, SystemStats> = {}
    for (const t of rows) {
      const sid = t.system?.publicId
      if (!sid) continue
      const bucket = out[sid] ?? { total: 0, open: 0 }
      bucket.total += 1
      if (OPEN_STATUSES.has(t.status)) bucket.open += 1
      out[sid] = bucket
    }
    return out
  }, [ticketsQ.data])

  function onToggleActive(publicId: string, active: boolean, name: string) {
    if (!isAdmin) return
    setToggleTarget({ publicId, name, active })
  }

  function confirmToggle() {
    if (!toggleTarget) return
    const payload = { enabled: !toggleTarget.active } as unknown as SystemRequest
    updateSystemMut.mutate({ publicId: toggleTarget.publicId, data: payload })
  }

  return (
    <div className="flex h-full flex-col">
      {/* ── Desktop header ── */}
      <div
        className="hidden md:flex h-[52px] shrink-0 items-center gap-3 px-6"
        style={{ borderBottom: '1px solid var(--wl-border)' }}
      >
        <h1 className="text-[18px] font-semibold" style={{ color: 'var(--wl-text)' }}>
          Sistemas
        </h1>

        <div className="flex-1" />

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

        <button
          onClick={() => setShowCreate(true)}
          className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-opacity hover:opacity-85"
          style={{ background: 'var(--primary)', color: '#fff' }}
        >
          + Sistema
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
          Sistemas
        </h1>

        <div className="flex-1" />

        <div
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 flex-1 max-w-[200px]"
          style={{ background: 'var(--wl-surface-2)', border: '1px solid var(--wl-border)' }}
        >
          <Search size={13} style={{ color: 'var(--wl-text-muted)', flexShrink: 0 }} />
          <input
            ref={searchRef}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar..."
            className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-[var(--wl-text-muted)] min-w-0"
            style={{ color: 'var(--wl-text)' }}
          />
        </div>
      </div>

      {/* ── Grid ── */}
      <SystemGrid
        systems={filtered}
        statsBySystem={statsBySystem}
        loading={systemsQ.isLoading}
        onCardClick={openDetail}
        onToggleActive={isAdmin ? onToggleActive : undefined}
      />

      {/* ── Detail modal ── */}
      {selectedId && <SystemDetail publicId={selectedId} onClose={closeDetail} />}

      {/* ── Create dialog ── */}
      {showCreate && <SystemCreateDialog onClose={() => setShowCreate(false)} />}

      {/* ── Edit from row menu (legacy entry) ── */}
      {editId && <SystemEditFetcher publicId={editId} onClose={() => setEditId(null)} />}

      {/* ── Mobile FAB ── */}
      <MobileFab onClick={() => setShowCreate(true)} />

      {/* ── Confirm toggle ── */}
      {toggleTarget && (
        <>
          <div
            className="fixed inset-0 z-[60]"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            onClick={() => !updateSystemMut.isPending && setToggleTarget(null)}
          />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6" style={{ pointerEvents: 'none' }}>
            <div
              className="w-full max-w-sm rounded-xl p-5 shadow-2xl"
              style={{ background: 'var(--wl-surface)', border: '1px solid var(--wl-border)', pointerEvents: 'auto' }}
            >
              <h3 className="mb-1 text-[14px] font-semibold" style={{ color: 'var(--wl-text)' }}>
                {toggleTarget.active ? 'Desativar sistema?' : 'Reativar sistema?'}
              </h3>
              <p className="mb-4 text-[12px]" style={{ color: 'var(--wl-text-muted)' }}>
                {toggleTarget.active
                  ? <>O sistema &quot;{toggleTarget.name}&quot; será marcado como inativo.</>
                  : <>O sistema &quot;{toggleTarget.name}&quot; voltará a ser ativo.</>}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setToggleTarget(null)}
                  disabled={updateSystemMut.isPending}
                  className="cursor-pointer rounded-lg px-3 py-1.5 text-[13px] font-medium transition-opacity hover:opacity-70 disabled:opacity-50"
                  style={{ background: 'var(--wl-surface-2)', color: 'var(--wl-text-muted)', border: '1px solid var(--wl-border)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmToggle}
                  disabled={updateSystemMut.isPending}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-semibold text-white transition-opacity disabled:opacity-50"
                  style={{ background: toggleTarget.active ? 'var(--wl-danger)' : 'var(--primary)' }}
                >
                  {updateSystemMut.isPending && <Loader2 size={13} className="animate-spin" />}
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
