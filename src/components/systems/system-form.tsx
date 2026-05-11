'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v3'
import { X, Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSaveSystem, useUpdateSystem, useFindSystemByPublicId } from '@/api/generated/sistemas/sistemas'
import { invalidateSystems, invalidateSystem } from '@/api/invalidate'
import type { SystemResponse } from '@/api/generated/schemas'

const systemSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
})

type SystemValues = z.infer<typeof systemSchema>

// ── Shared primitives ─────────────────────────────────────────────────────────

function Backdrop({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40" onClick={onClose} style={{ background: 'rgba(0,0,0,0.45)' }} />
  )
}

function DialogCard({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ pointerEvents: 'none' }}>
      <div
        className="flex w-full max-w-md flex-col rounded-xl shadow-2xl"
        style={{
          background: 'var(--wl-surface)',
          border: '1px solid var(--wl-border)',
          pointerEvents: 'auto',
          maxHeight: 'calc(100dvh - 2rem)',
        }}
      >
        <div
          className="flex shrink-0 items-center justify-between px-5 py-3.5"
          style={{ borderBottom: '1px solid var(--wl-border)' }}
        >
          <h2 className="text-[15px] font-semibold" style={{ color: 'var(--wl-text)' }}>{title}</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-[var(--wl-surface-2)]"
            style={{ color: 'var(--wl-text-muted)' }}
            aria-label="Fechar"
          >
            <X size={15} />
          </button>
        </div>
        <div className="scroll-hide flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

const inputCls = 'w-full rounded-lg px-3 py-2 text-[13px] outline-none transition-colors placeholder:text-[var(--wl-text-dim)] focus:ring-1 focus:ring-[var(--primary)]'
const inputStyle = { background: 'var(--wl-surface-2)', border: '1px solid var(--wl-border)', color: 'var(--wl-text)' }

// ── Create ────────────────────────────────────────────────────────────────────

export function SystemCreateDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()

  const { register, handleSubmit, formState: { errors } } = useForm<SystemValues>({
    resolver: zodResolver(systemSchema),
    defaultValues: { name: '' },
  })

  const createMut = useSaveSystem({
    mutation: {
      onSuccess: () => { invalidateSystems(qc); toast.success('Sistema criado'); onClose() },
    },
  })

  return (
    <>
      <Backdrop onClose={onClose} />
      <DialogCard title="Novo sistema" onClose={onClose}>
        <form onSubmit={handleSubmit((v) => createMut.mutate({ data: { name: v.name } }))} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--wl-text-muted)' }}>
              Nome *
            </label>
            <input {...register('name')} placeholder="Nome do sistema" className={inputCls} style={inputStyle} autoFocus />
            {errors.name && <p className="text-[11px]" style={{ color: 'var(--status-open)' }}>{errors.name.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="cursor-pointer rounded-lg px-4 py-1.5 text-[13px] font-medium transition-opacity hover:opacity-70" style={{ background: 'var(--wl-surface-2)', color: 'var(--wl-text-muted)', border: '1px solid var(--wl-border)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={createMut.isPending} className="flex cursor-pointer items-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-opacity disabled:opacity-50" style={{ background: 'var(--primary)', color: '#fff' }}>
              {createMut.isPending && <Loader2 size={13} className="animate-spin" />}
              Criar sistema
            </button>
          </div>
        </form>
      </DialogCard>
    </>
  )
}

// ── Edit ──────────────────────────────────────────────────────────────────────

export function SystemEditDialog({ system, onClose }: { system: SystemResponse; onClose: () => void }) {
  const qc = useQueryClient()

  const { register, handleSubmit, formState: { errors } } = useForm<SystemValues>({
    resolver: zodResolver(systemSchema),
    defaultValues: { name: system.name ?? '' },
  })

  const updateMut = useUpdateSystem({
    mutation: {
      onSuccess: () => {
        if (system.publicId) { invalidateSystem(qc, system.publicId); invalidateSystems(qc) }
        toast.success('Sistema atualizado')
        onClose()
      },
    },
  })

  function onSubmit(v: SystemValues) {
    if (!system.publicId) return
    updateMut.mutate({ publicId: system.publicId, data: { name: v.name } })
  }

  return (
    <>
      <Backdrop onClose={onClose} />
      <DialogCard title="Editar sistema" onClose={onClose}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--wl-text-muted)' }}>
              Nome *
            </label>
            <input {...register('name')} className={inputCls} style={inputStyle} autoFocus />
            {errors.name && <p className="text-[11px]" style={{ color: 'var(--status-open)' }}>{errors.name.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="cursor-pointer rounded-lg px-4 py-1.5 text-[13px] font-medium transition-opacity hover:opacity-70" style={{ background: 'var(--wl-surface-2)', color: 'var(--wl-text-muted)', border: '1px solid var(--wl-border)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={updateMut.isPending} className="flex cursor-pointer items-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-opacity disabled:opacity-50" style={{ background: 'var(--primary)', color: '#fff' }}>
              {updateMut.isPending && <Loader2 size={13} className="animate-spin" />}
              Salvar
            </button>
          </div>
        </form>
      </DialogCard>
    </>
  )
}

// ── Edit fetcher ──────────────────────────────────────────────────────────────

export function SystemEditFetcher({ publicId, onClose }: { publicId: string; onClose: () => void }) {
  const q = useFindSystemByPublicId(publicId)
  if (!q.data) return null
  return <SystemEditDialog system={q.data} onClose={onClose} />
}
