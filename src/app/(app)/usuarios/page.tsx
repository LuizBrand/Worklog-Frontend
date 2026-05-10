'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, ShieldOff } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useFindAllUsers, useDeactiveUserByPublicId } from '@/api/generated/usuários/usuários'
import { useAuthStore } from '@/state/auth'
import { invalidateUsers } from '@/api/invalidate'
import { UserTable } from '@/components/users/user-table'

export default function UsuariosPage() {
  const router = useRouter()
  const params = useSearchParams()
  const qc = useQueryClient()
  const searchRef = useRef<HTMLInputElement>(null)

  const currentUser = useAuthStore((s) => s.user)
  const isAdmin = currentUser?.roles?.some((r) => r.role === 'ADMIN') ?? false

  const [searchInput, setSearchInput] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const routerRef = useRef(router)
  useEffect(() => { routerRef.current = router }, [router])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const usersQ = useFindAllUsers()

  const deactivateMut = useDeactiveUserByPublicId({
    mutation: {
      onSuccess: () => {
        invalidateUsers(qc)
        toast.success('Usuário desativado')
        setConfirmId(null)
      },
      onError: () => {
        toast.error('Erro ao desativar usuário')
        setConfirmId(null)
      },
    },
  })

  const filtered = (usersQ.data ?? []).filter((u) =>
    !searchInput ||
    (u.name ?? '').toLowerCase().includes(searchInput.toLowerCase()) ||
    (u.email ?? '').toLowerCase().includes(searchInput.toLowerCase())
  )

  if (!isAdmin) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <ShieldOff size={32} style={{ color: 'var(--wl-text-muted)' }} />
        <p className="text-[14px] font-medium" style={{ color: 'var(--wl-text-muted)' }}>
          Acesso restrito a administradores
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div
        className="flex h-[52px] shrink-0 items-center gap-3 px-6"
        style={{ borderBottom: '1px solid var(--wl-border)' }}
      >
        <h1 className="text-[18px] font-semibold" style={{ color: 'var(--wl-text)' }}>
          Usuários
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
      </div>

      {/* Table */}
      <UserTable
        users={filtered}
        loading={usersQ.isLoading}
        onDeactivate={(id) => setConfirmId(id)}
      />

      {/* Deactivate confirm overlay */}
      {confirmId && (
        <>
          <div
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            onClick={() => setConfirmId(null)}
          />
          <div
            className="fixed left-1/2 top-1/2 z-[60] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl p-6 shadow-2xl"
            style={{ background: 'var(--wl-surface)', border: '1px solid var(--wl-border)' }}
          >
            <p className="mb-1 text-[15px] font-semibold" style={{ color: 'var(--wl-text)' }}>
              Desativar usuário?
            </p>
            <p className="mb-5 text-[13px]" style={{ color: 'var(--wl-text-muted)' }}>
              O usuário perderá acesso ao sistema. Esta ação não pode ser desfeita pelo painel.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmId(null)}
                className="cursor-pointer rounded-lg px-4 py-1.5 text-[13px] font-medium transition-opacity hover:opacity-70"
                style={{ background: 'var(--wl-surface-2)', color: 'var(--wl-text-muted)', border: '1px solid var(--wl-border)' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => deactivateMut.mutate({ publicId: confirmId })}
                disabled={deactivateMut.isPending}
                className="cursor-pointer rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-opacity disabled:opacity-50 hover:opacity-85"
                style={{ background: '#ef4444', color: '#fff' }}
              >
                Desativar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
