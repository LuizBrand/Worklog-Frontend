'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v3'
import { X, Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useCreateTicket, useUpdateTicket, useGetTicketByPublicId, useDeleteTicket } from '@/api/generated/tickets/tickets'
import { useFindAllClients } from '@/api/generated/clientes/clientes'
import { useFindAllSystems } from '@/api/generated/sistemas/sistemas'
import { useFindAllUsers } from '@/api/generated/usuários/usuários'
import {
  TicketRequestStatus,
  TicketRequestPriority,
  TicketUpdateRequestStatus,
  TicketUpdateRequestPriority,
} from '@/api/generated/schemas'
import { invalidateTickets, invalidateTicket, invalidateTicketLogs } from '@/api/invalidate'
import { UI_STATUS_WRITABLE, UI_STATUS_EDITABLE, uiToApiStatus } from '@/lib/ticket-status'
import { STATUS_META } from '@/lib/worklog-meta'
import { useAuthStore } from '@/state/auth'
import { FilterSelect, ClientCombobox } from '@/components/worklog'
import type { TicketResponse } from '@/api/generated/schemas'
import type { UiWritableStatus } from '@/lib/ticket-status'

// ── Schemas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  description: z.string().optional(),
  clientId: z.string().min(1, 'Selecione um cliente'),
  systemId: z.string().min(1, 'Selecione um sistema'),
  status: z.string().min(1, 'Selecione um status'),
  priority: z.string().min(1, 'Selecione uma prioridade'),
  userId: z.string().optional(),
})

const PRIORITY_OPTIONS: { value: TicketRequestPriority; label: string }[] = [
  { value: TicketRequestPriority.CRITICAL, label: 'Crítica' },
  { value: TicketRequestPriority.HIGH, label: 'Alta' },
  { value: TicketRequestPriority.MEDIUM, label: 'Média' },
  { value: TicketRequestPriority.LOW, label: 'Baixa' },
]

const editSchema = z.object({
  title: z.string().min(1, 'Título não pode ser vazio').optional().or(z.literal('')),
  description: z.string().optional(),
  solution: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  userId: z.string().optional(),
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
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-[var(--wl-surface-2)]"
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

const inputCls =
  'w-full rounded-lg border px-3 py-2 text-[13px] outline-none transition-colors ' +
  'bg-transparent border-[var(--wl-border)] text-[var(--wl-text)] ' +
  'placeholder:text-[var(--wl-text-dim)] focus:border-[var(--primary)]'

// ── Create dialog ─────────────────────────────────────────────────────────────

export interface TicketCreateDialogProps {
  onClose: () => void
}

export function TicketCreateDialog({ onClose }: TicketCreateDialogProps) {
  const qc = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const isAdmin = currentUser?.roles?.some((r) => r.role === 'ADMIN') ?? false

  // `pageable` vazio: sem `page`/`size` a resposta continua sendo o array cru
  // de sempre (§6 do contrato). Só a listagem de clientes pagina.
  const clientsQ = useFindAllClients({ filtersParams: {}, pageable: {} })
  const systemsQ = useFindAllSystems()
  const usersQ = useFindAllUsers({ query: { enabled: isAdmin } })

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      status: TicketRequestStatus.PENDING,
      priority: TicketRequestPriority.MEDIUM,
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
        priority: values.priority as TicketRequestPriority,
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
              autoFocus
            />
          </FormField>

          <FormField label="Descrição" error={errors.description?.message}>
            <textarea
              {...register('description')}
              placeholder="Detalhes adicionais (opcional)"
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Cliente *" error={errors.clientId?.message}>
              <ClientCombobox
                className="w-full"
                value={watch('clientId') ?? ''}
                onChange={(v) => setValue('clientId', v, { shouldValidate: true })}
                options={(clientsQ.data ?? []).filter((c) => c.enabled !== false).map((c) => ({ value: c.publicId ?? '', label: c.name ?? '' }))}
                emptyLabel="Selecionar..."
              />
            </FormField>

            <FormField label="Sistema *" error={errors.systemId?.message}>
              <FilterSelect
                className="w-full"
                value={watch('systemId') ?? ''}
                onChange={(v) => setValue('systemId', v, { shouldValidate: true })}
                options={[
                  { value: '', label: 'Selecionar...' },
                  ...(systemsQ.data ?? [])
                    .filter((s) => s.enabled !== false)
                    .map((s) => ({ value: s.publicId ?? '', label: s.name ?? '' })),
                ]}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Status" error={errors.status?.message}>
              <FilterSelect
                className="w-full"
                value={watch('status') ?? ''}
                onChange={(v) => setValue('status', v, { shouldValidate: true })}
                options={UI_STATUS_WRITABLE.map((ui) => ({
                  value: uiToApiStatus(ui as UiWritableStatus),
                  label: STATUS_META[ui as UiWritableStatus].label,
                }))}
              />
            </FormField>

            <FormField label="Prioridade" error={errors.priority?.message}>
              <FilterSelect
                className="w-full"
                value={watch('priority') ?? ''}
                onChange={(v) => setValue('priority', v, { shouldValidate: true })}
                options={PRIORITY_OPTIONS}
              />
            </FormField>
          </div>

          {isAdmin && (
            <FormField label="Responsável" error={errors.userId?.message}>
              <ClientCombobox
                className="w-full"
                value={watch('userId') ?? ''}
                onChange={(v) => setValue('userId', v, { shouldValidate: true })}
                options={(usersQ.data ?? []).map((u) => ({ value: u.publicId ?? '', label: u.name ?? u.email ?? '' }))}
                emptyLabel="Selecionar..."
              />
            </FormField>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg px-4 py-1.5 text-[13px] font-medium transition-opacity hover:opacity-70"
              style={{ background: 'var(--wl-surface-2)', color: 'var(--wl-text-muted)', border: '1px solid var(--wl-border)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMut.isPending}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-opacity disabled:opacity-50"
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
  const currentUser = useAuthStore((s) => s.user)
  const isAdmin = currentUser?.roles?.some((r) => r.role === 'ADMIN') ?? false

  const usersQ = useFindAllUsers({ query: { enabled: isAdmin } })

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: ticket.title ?? '',
      description: ticket.description ?? '',
      solution: ticket.solution ?? '',
      status: ticket.status ?? TicketUpdateRequestStatus.PENDING,
      priority: ticket.priority ?? TicketUpdateRequestPriority.MEDIUM,
      userId: ticket.user?.publicId ?? '',
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
        status: (values.status || undefined) as TicketUpdateRequestStatus | undefined,
        priority: (values.priority || undefined) as TicketUpdateRequestPriority | undefined,
        userId: isAdmin ? (values.userId || undefined) : undefined,
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
              autoFocus
            />
          </FormField>

          <FormField label="Descrição" error={errors.description?.message}>
            <textarea
              {...register('description')}
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </FormField>

          <FormField label="Solução / nota" error={errors.solution?.message}>
            <textarea
              {...register('solution')}
              rows={2}
              placeholder="Resolução ou observação (opcional)"
              className={`${inputCls} resize-none`}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Status" error={errors.status?.message}>
              <FilterSelect
                className="w-full"
                value={watch('status') ?? ''}
                onChange={(v) => setValue('status', v, { shouldValidate: true })}
                options={UI_STATUS_EDITABLE.map((ui) => ({
                  value: uiToApiStatus(ui as UiWritableStatus),
                  label: STATUS_META[ui as UiWritableStatus].label,
                }))}
              />
            </FormField>

            <FormField label="Prioridade" error={errors.priority?.message}>
              <FilterSelect
                className="w-full"
                value={watch('priority') ?? ''}
                onChange={(v) => setValue('priority', v, { shouldValidate: true })}
                options={PRIORITY_OPTIONS}
              />
            </FormField>
          </div>

          {isAdmin && (
            <FormField label="Responsável" error={errors.userId?.message}>
              <ClientCombobox
                className="w-full"
                value={watch('userId') ?? ''}
                onChange={(v) => setValue('userId', v, { shouldValidate: true })}
                options={(usersQ.data ?? []).map((u) => ({ value: u.publicId ?? '', label: u.name ?? u.email ?? '' }))}
                emptyLabel="Selecionar..."
              />
            </FormField>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg px-4 py-1.5 text-[13px] font-medium transition-opacity hover:opacity-70"
              style={{ background: 'var(--wl-surface-2)', color: 'var(--wl-text-muted)', border: '1px solid var(--wl-border)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateMut.isPending}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-opacity disabled:opacity-50"
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

// ── Edit fetcher (opens edit dialog by publicId) ──────────────────────────────

export interface TicketEditFetcherProps {
  publicId: string
  onClose: () => void
}

export function TicketEditFetcher({ publicId, onClose }: TicketEditFetcherProps) {
  const ticketQ = useGetTicketByPublicId(publicId)
  if (!ticketQ.data) return null
  return <TicketEditDialog ticket={ticketQ.data} onClose={onClose} />
}

// ── Standalone delete confirm dialog ─────────────────────────────────────────

export interface TicketDeleteDialogProps {
  publicId: string
  onClose: () => void
}

export function TicketDeleteDialog({ publicId, onClose }: TicketDeleteDialogProps) {
  const qc = useQueryClient()

  const deleteMut = useDeleteTicket({
    mutation: {
      onSuccess: () => {
        invalidateTickets(qc)
        toast.success('Ticket excluído')
        onClose()
      },
    },
  })

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        style={{ background: 'rgba(0,0,0,0.45)' }}
      />
      <div
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl p-6 shadow-2xl"
        style={{ background: 'var(--wl-surface)', border: '1px solid var(--wl-border)' }}
      >
        <h3 className="text-[15px] font-semibold" style={{ color: 'var(--wl-text)' }}>
          Excluir ticket?
        </h3>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--wl-text-muted)' }}>
          Esta ação não pode ser desfeita.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg px-4 py-1.5 text-[13px] font-medium"
            style={{ background: 'var(--wl-surface-2)', color: 'var(--wl-text-muted)', border: '1px solid var(--wl-border)' }}
          >
            Cancelar
          </button>
          <button
            onClick={() => deleteMut.mutate({ publicId })}
            disabled={deleteMut.isPending}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-semibold disabled:opacity-50"
            style={{ background: 'var(--wl-danger)', color: '#fff' }}
          >
            {deleteMut.isPending && <Loader2 size={13} className="animate-spin" />}
            Excluir
          </button>
        </div>
      </div>
    </>
  )
}
