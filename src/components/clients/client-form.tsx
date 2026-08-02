'use client'

import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v3'
import { X, Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSaveClient, useUpdateClient, useFindClientByPublicId } from '@/api/generated/clientes/clientes'
import { useFindAllSystems } from '@/api/generated/sistemas/sistemas'
import { invalidateClients, invalidateClient } from '@/api/invalidate'
import { CLIENT_TYPE_LABEL, ClientType, MAX_LENGTH } from '@/api/clients-contract'
import type { ClientRequest } from '@/api/clients-contract'
import { isValidDocumento, stripDocumento } from '@/lib/documento'
import { applyApiFieldErrors } from '@/lib/field-errors'
import { apiErrorToMessage } from '@/lib/api-errors'
import type { ClientRequest as GeneratedClientRequest, ClientResponse } from '@/api/generated/schemas'

// ── Schema ────────────────────────────────────────────────────────────────────

// `systemsPublicIds` deixou de ser obrigatório na expansão do cadastro: o
// cliente pode ser criado antes de se saber quais produtos usa.
const clientSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(MAX_LENGTH.clientName),
  systemsPublicIds: z.array(z.string()),
  enabled: z.boolean().optional(),
})

type ClientValues = z.infer<typeof clientSchema>

// O create exige `tipo` e a matriz. `tipo` vem primeiro porque decide se o
// documento é CPF ou CNPJ. Cobertura completa do cadastro (lookup de CNPJ,
// nomeFantasia, endereço, contatos, filiais) entra no Slice 4 do plano em
// docs/plans/expansao-cadastro-clientes.md.
const createSchema = clientSchema
  .extend({
    tipo: z.enum(['PJ', 'PF']),
    documento: z.string().min(1, 'Documento obrigatório'),
  })
  .refine((v) => isValidDocumento(v.documento, v.tipo), {
    path: ['documento'],
    message: 'Documento inválido',
  })

type CreateValues = z.infer<typeof createSchema>

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

export interface ClientCreateDialogProps {
  onClose: () => void
}

export function ClientCreateDialog({ onClose }: ClientCreateDialogProps) {
  const qc = useQueryClient()
  const systemsQ = useFindAllSystems()

  const { register, handleSubmit, control, setValue, setError, formState: { errors } } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { tipo: ClientType.PJ, name: '', documento: '', systemsPublicIds: [] },
  })

  // useWatch em vez de watch(): watch() não é memoizável e o React Compiler
  // desiste de otimizar o componente inteiro.
  const tipo = useWatch({ control, name: 'tipo' })
  const isPj = tipo === ClientType.PJ

  const createMut = useSaveClient({
    mutation: {
      onSuccess: () => {
        invalidateClients(qc)
        toast.success('Cliente criado com sucesso')
        onClose()
      },
      onError: (err) => {
        // 400 traz fieldErrors com caminho aninhado (branches[0].documento);
        // o resto é regra de negócio e vai em toast.
        if (!applyApiFieldErrors(err, setError)) {
          toast.error(apiErrorToMessage(err, 'Não foi possível criar o cliente'))
        }
      },
    },
  })

  function onSubmit(values: CreateValues) {
    // `enabled` não vai: o backend ignora no create e o cliente nasce ativo.
    const payload: ClientRequest = {
      tipo: values.tipo,
      name: values.name,
      systemsPublicIds: values.systemsPublicIds,
      branches: [
        {
          documento: stripDocumento(values.documento),
          isMatriz: true,
        },
      ],
    }
    // O tipo gerado pelo Orval afrouxa obrigatoriedades que a API exige;
    // clients-contract.ts é a fonte da verdade (ver §1.2 do plano).
    createMut.mutate({ data: payload as GeneratedClientRequest })
  }

  return (
    <>
      <Backdrop onClose={onClose} />
      <DialogCard title="Novo cliente" onClose={onClose}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Tipo *" error={errors.tipo?.message}>
            <div className="flex gap-2">
              {([ClientType.PJ, ClientType.PF] as const).map((t) => {
                const active = tipo === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setValue('tipo', t)
                      setValue('documento', '')
                    }}
                    className="flex-1 cursor-pointer rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors"
                    style={{
                      background: active ? 'var(--primary)' : 'var(--wl-surface-2)',
                      border: `1px solid ${active ? 'var(--primary)' : 'var(--wl-border)'}`,
                      color: active ? '#fff' : 'var(--wl-text-muted)',
                    }}
                  >
                    {CLIENT_TYPE_LABEL[t]}
                  </button>
                )
              })}
            </div>
          </FormField>

          <FormField label={isPj ? 'Razão social *' : 'Nome completo *'} error={errors.name?.message}>
            <input
              {...register('name')}
              placeholder={isPj ? 'Nome da empresa' : 'Nome do cliente'}
              className={inputCls}
              style={inputStyle}
              autoFocus
            />
          </FormField>

          <FormField label={isPj ? 'CNPJ *' : 'CPF *'} error={errors.documento?.message}>
            <input
              {...register('documento')}
              placeholder={isPj ? '00.000.000/0000-00' : '000.000.000-00'}
              className={inputCls}
              style={inputStyle}
              inputMode={isPj ? 'text' : 'numeric'}
            />
          </FormField>

          <FormField label="Sistemas" error={errors.systemsPublicIds?.message}>
            <SystemsCheckboxList register={register} systems={systemsQ.data ?? []} loading={systemsQ.isLoading} />
          </FormField>

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
              Criar cliente
            </button>
          </div>
        </form>
      </DialogCard>
    </>
  )
}

// ── Edit dialog ───────────────────────────────────────────────────────────────

export interface ClientEditDialogProps {
  client: ClientResponse
  onClose: () => void
}

export function ClientEditDialog({ client, onClose }: ClientEditDialogProps) {
  const qc = useQueryClient()
  const systemsQ = useFindAllSystems()

  const { register, handleSubmit, formState: { errors } } = useForm<ClientValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client.name ?? '',
      systemsPublicIds: client.systems?.map((s) => s.publicId ?? '').filter(Boolean) ?? [],
      enabled: client.enabled ?? true,
    },
  })

  const updateMut = useUpdateClient({
    mutation: {
      onSuccess: () => {
        if (client.publicId) {
          invalidateClient(qc, client.publicId)
          invalidateClients(qc)
        }
        toast.success('Cliente atualizado')
        onClose()
      },
    },
  })

  function onSubmit(values: ClientValues) {
    if (!client.publicId) return
    updateMut.mutate({
      publicId: client.publicId,
      data: {
        name: values.name,
        systemsPublicIds: values.systemsPublicIds,
        enabled: values.enabled,
      },
    })
  }

  return (
    <>
      <Backdrop onClose={onClose} />
      <DialogCard title="Editar cliente" onClose={onClose}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Nome *" error={errors.name?.message}>
            <input
              {...register('name')}
              className={inputCls}
              style={inputStyle}
              autoFocus
            />
          </FormField>

          <FormField label="Sistemas" error={errors.systemsPublicIds?.message}>
            <SystemsCheckboxList register={register} systems={systemsQ.data ?? []} loading={systemsQ.isLoading} />
          </FormField>

          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              {...register('enabled')}
              className="cursor-pointer accent-[var(--primary)]"
            />
            <span className="text-[13px]" style={{ color: 'var(--wl-text)' }}>
              Cliente ativo
            </span>
          </label>

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

export interface ClientEditFetcherProps {
  publicId: string
  onClose: () => void
}

export function ClientEditFetcher({ publicId, onClose }: ClientEditFetcherProps) {
  const clientQ = useFindClientByPublicId(publicId)
  if (!clientQ.data) return null
  return <ClientEditDialog client={clientQ.data} onClose={onClose} />
}

// ── Internal helpers ──────────────────────────────────────────────────────────

import type { Path, UseFormRegister } from 'react-hook-form'
import type { SystemResponse } from '@/api/generated/schemas'

// Genérico porque create e edit têm schemas diferentes, mas os dois carregam
// `systemsPublicIds`.
function SystemsCheckboxList<T extends { systemsPublicIds: string[] }>({
  register,
  systems,
  loading,
}: {
  register: UseFormRegister<T>
  systems: SystemResponse[]
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-[13px]" style={{ color: 'var(--wl-text-muted)' }}>
        <Loader2 size={13} className="animate-spin" /> Carregando sistemas…
      </div>
    )
  }
  if (systems.length === 0) {
    return (
      <p className="px-3 py-2 text-[13px]" style={{ color: 'var(--wl-text-muted)' }}>
        Nenhum sistema disponível.
      </p>
    )
  }
  return (
    <div
      className="scroll-hide max-h-48 overflow-y-auto rounded-lg p-3 grid grid-cols-2 gap-x-4 gap-y-2"
      style={inputStyle}
    >
      {systems.map((s) => (
        <label
          key={s.publicId}
          className="flex cursor-pointer items-center gap-2.5"
        >
          <input
            type="checkbox"
            value={s.publicId ?? ''}
            {...register('systemsPublicIds' as Path<T>)}
            className="cursor-pointer accent-[var(--primary)]"
          />
          <span className="text-[13px]" style={{ color: 'var(--wl-text)' }}>
            {s.name}
          </span>
        </label>
      ))}
    </div>
  )
}
