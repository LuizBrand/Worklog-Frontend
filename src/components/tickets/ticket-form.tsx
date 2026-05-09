'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v3'
import { X, Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useCreateTicket, useUpdateTicket } from '@/api/generated/tickets/tickets'
import { useFindAllClients } from '@/api/generated/clientes/clientes'
import { useFindAllSystems } from '@/api/generated/sistemas/sistemas'
import { useFindAllUsers } from '@/api/generated/usuários/usuários'
import { TicketRequestStatus } from '@/api/generated/schemas'
import { invalidateTickets, invalidateTicket, invalidateTicketLogs } from '@/api/invalidate'
import { UI_STATUS_WRITABLE, uiToApiStatus } from '@/lib/ticket-status'
import { STATUS_META } from '@/lib/worklog-meta'
import { useAuthStore } from '@/state/auth'
import type { TicketResponse } from '@/api/generated/schemas'
import type { UiWritableStatus } from '@/lib/ticket-status'

// ── Schemas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  description: z.string().optional(),
  clientId: z.string().min(1, 'Selecione um cliente'),
  systemId: z.string().min(1, 'Selecione um sistema'),
  status: z.string().min(1, 'Selecione um status'),
  userId: z.string().optional(),
})

const editSchema = z.object({
  title: z.string().min(1, 'Título não pode ser vazio').optional().or(z.literal('')),
  description: z.string().optional(),
  solution: z.string().optional(),
})

type CreateValues = z.infer<typeof createSchema>
type EditValues = z.infer<typeof editSchema>

// ── Shared primitives ─────────────────────────────────────────────────────────

function Backdrop({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40"
      onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.45)' }}
    />
  )
}

function DialogCard({ children, onClose, title }: {
  children: React.ReactNode
  onClose: () => void
  title: string
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="flex w-full max-w-lg flex-col rounded-xl shadow-2xl"
        style={{
          background: 'var(--wl-surface)',
          border: '1px solid var(--wl-border)',
          pointerEvents: 'auto',
          maxHeight: 'calc(100dvh - 2rem)',
        }}
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-center justify-between px-5 py-3.5"
          style={{ borderBottom: '1px solid var(--wl-border)' }}
        >
          <h2 className="text-[15px] font-semibold" style={{ color: 'var(--wl-text)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-[var(--wl-surface-2)]"
            style={{ color: 'var(--wl-text-muted)' }}
            aria-label="Fechar"
          >
            <X size={15} />
          </button>
        </div>
        {/* Body */}
        <div className="scroll-hide flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

function FormField({ label, error, children }: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--wl-text-muted)' }}>
        {label}
      </label>
      {children}
      {error && (
        <p className="text-[11px]" style={{ color: 'var(--status-open)' }}>{error}</p>
      )}
    </div>
  )
}

const inputCls = 'w-full rounded-lg px-3 py-2 text-[13px] outline-none transition-colors placeholder:text-[var(--wl-text-dim)] focus:ring-1 focus:ring-[var(--primary)]'
const inputStyle = {
  background: 'var(--wl-surface-2)',
  border: '1px solid var(--wl-border)',
  color: 'var(--wl-text)',
}

// ── Create dialog ─────────────────────────────────────────────────────────────

export interface TicketCreateDialogProps {
  onClose: () => void
}

export function TicketCreateDialog({ onClose }: TicketCreateDialogProps) {
  const qc = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const isAdmin = currentUser?.roles?.some((r) => r.role === 'ADMIN') ?? false

  const clientsQ = useFindAllClients({ filtersParams: {} })
  const systemsQ = useFindAllSystems()
  const usersQ = useFindAllUsers({ query: { enabled: isAdmin } })

  const { register, handleSubmit, formState: { errors } } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      status: TicketRequestStatus.PENDING,
      userId: currentUser?.publicId ?? '',
    },
  })

  const createMut = useCreateTicket({
    mutation: {
      onSuccess: () => {
        invalidateTickets(qc)
        toast.success('Ticket criado com sucesso')
        onClose()
      },
      onError: () => {
        toast.error('Erro ao criar ticket')
      },
    },
  })

  function onSubmit(values: CreateValues) {
    createMut.mutate({
      data: {
        title: values.title,
        description: values.description || undefined,
        clientId: values.clientId,
        systemId: values.systemId,
        status: values.status as TicketRequestStatus,
        userId: values.userId || currentUser?.publicId || undefined,
      },
    })
  }

  return (
    <>
      <Backdrop onClose={onClose} />
      <DialogCard title="Novo ticket" onClose={onClose}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Título *" error={errors.title?.message}>
            <input
              {...register('title')}
              placeholder="Descreva o problema brevemente"
              className={inputCls}
              style={inputStyle}
              autoFocus
            />
          </FormField>

          <FormField label="Descrição" error={errors.description?.message}>
            <textarea
              {...register('description')}
              placeholder="Detalhes adicionais (opcional)"
              rows={3}
              className={`${inputCls} resize-none`}
              style={inputStyle}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Cliente *" error={errors.clientId?.message}>
              <select {...register('clientId')} className={inputCls} style={inputStyle}>
                <option value="">Selecionar...</option>
                {(clientsQ.data ?? []).map((c) => (
                  <option key={c.publicId} value={c.publicId ?? ''}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Sistema *" error={errors.systemId?.message}>
              <select {...register('systemId')} className={inputCls} style={inputStyle}>
                <option value="">Selecionar...</option>
                {(systemsQ.data ?? []).map((s) => (
                  <option key={s.publicId} value={s.publicId ?? ''}>
                    {s.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Status" error={errors.status?.message}>
            <select {...register('status')} className={inputCls} style={inputStyle}>
              {UI_STATUS_WRITABLE.map((ui) => (
                <option key={ui} value={uiToApiStatus(ui as UiWritableStatus)}>
                  {STATUS_META[ui as UiWritableStatus].label}
                </option>
              ))}
            </select>
          </FormField>

          {isAdmin && (
            <FormField label="Autor" error={errors.userId?.message}>
              <select {...register('userId')} className={inputCls} style={inputStyle}>
                {(usersQ.data ?? []).map((u) => (
                  <option key={u.publicId} value={u.publicId ?? ''}>
                    {u.name ?? u.email}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-1.5 text-[13px] font-medium transition-opacity hover:opacity-70"
              style={{ background: 'var(--wl-surface-2)', color: 'var(--wl-text-muted)', border: '1px solid var(--wl-border)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMut.isPending}
              className="flex items-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-opacity disabled:opacity-50"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              {createMut.isPending && <Loader2 size={13} className="animate-spin" />}
              Criar ticket
            </button>
          </div>
        </form>
      </DialogCard>
    </>
  )
}

// ── Edit dialog ───────────────────────────────────────────────────────────────

export interface TicketEditDialogProps {
  ticket: TicketResponse
  onClose: () => void
}

export function TicketEditDialog({ ticket, onClose }: TicketEditDialogProps) {
  const qc = useQueryClient()

  const { register, handleSubmit, formState: { errors } } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: ticket.title ?? '',
      description: ticket.description ?? '',
      solution: ticket.solution ?? '',
    },
  })

  const updateMut = useUpdateTicket({
    mutation: {
      onSuccess: () => {
        if (ticket.publicId) {
          invalidateTicket(qc, ticket.publicId)
          invalidateTicketLogs(qc, ticket.publicId)
          invalidateTickets(qc)
        }
        toast.success('Ticket atualizado')
        onClose()
      },
      onError: () => {
        toast.error('Erro ao atualizar ticket')
      },
    },
  })

  function onSubmit(values: EditValues) {
    if (!ticket.publicId) return
    updateMut.mutate({
      ticketPublicId: ticket.publicId,
      data: {
        title: values.title || undefined,
        description: values.description || undefined,
        solution: values.solution || undefined,
      },
    })
  }

  return (
    <>
      <Backdrop onClose={onClose} />
      <DialogCard title="Editar ticket" onClose={onClose}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Título" error={errors.title?.message}>
            <input
              {...register('title')}
              className={inputCls}
              style={inputStyle}
              autoFocus
            />
          </FormField>

          <FormField label="Descrição" error={errors.description?.message}>
            <textarea
              {...register('description')}
              rows={3}
              className={`${inputCls} resize-none`}
              style={inputStyle}
            />
          </FormField>

          <FormField label="Solução / nota" error={errors.solution?.message}>
            <textarea
              {...register('solution')}
              rows={2}
              placeholder="Resolução ou observação (opcional)"
              className={`${inputCls} resize-none`}
              style={inputStyle}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-1.5 text-[13px] font-medium transition-opacity hover:opacity-70"
              style={{ background: 'var(--wl-surface-2)', color: 'var(--wl-text-muted)', border: '1px solid var(--wl-border)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateMut.isPending}
              className="flex items-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-opacity disabled:opacity-50"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              {updateMut.isPending && <Loader2 size={13} className="animate-spin" />}
              Salvar
            </button>
          </div>
        </form>
      </DialogCard>
    </>
  )
}
