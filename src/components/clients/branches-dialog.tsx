'use client'

import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Loader2, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { createBranch, useFindBranchesByClient } from '@/api/generated/filiais/filiais'
import { invalidateBranches, invalidateClient, invalidateClients } from '@/api/invalidate'
import {
  canActivateBranch,
  canCreateBranch,
  canDeactivateBranch,
  canPromoteToMatriz,
  contatoPrincipal,
} from '@/api/clients-contract'
import type { BranchRequest, BranchResponse, ClientResponse } from '@/api/clients-contract'
import type { BranchRequest as GeneratedBranchRequest } from '@/api/generated/schemas'
import { apiErrorToMessage } from '@/lib/api-errors'
import { formatDocumento } from '@/lib/documento'
import { formatEndereco } from '@/lib/endereco'
import { StatusPill } from '@/components/worklog'
import { Backdrop, DialogCard, SectionTitle } from './client-form-shell'
import { BranchFields } from './branch-fields'
import { clientFormSchema, emptyBranch, type ClientFormValues } from './client-schema'
import { clientToFormValues, filiaisNovas } from './client-save'
import { contatoLabel } from './client-table'

/** Carrega o que já foi criado quando a sequência de POSTs falha no meio. */
class CriarFilialError extends Error {
  constructor(
    readonly original: unknown,
    readonly criadas: number[],
    readonly falhou: number,
  ) {
    super('falha ao cadastrar filial')
    this.name = 'CriarFilialError'
  }
}

export interface BranchesDialogProps {
  client: ClientResponse
  isAdmin?: boolean
  onClose: () => void
  onEditBranch?: (branch: BranchResponse) => void
  onPromote?: (branch: BranchResponse) => void
  onToggleEnabled?: (branch: BranchResponse) => void
}

/**
 * Lista de filiais e cadastro de novas.
 *
 * As filiais existentes são só leitura aqui — editar abre dialog próprio
 * (o `PATCH` de filial é por filial, e misturar edição com criação em massa
 * tornaria o erro parcial impossível de explicar).
 *
 * Os rascunhos entram no mesmo array `branches` do schema do cliente, sem
 * `publicId`: é assim que `filiaisNovas` os reconhece, e de brinde ganhamos a
 * validação de documento repetido contra as filiais que já existem.
 */
export function BranchesDialog({
  client,
  isAdmin,
  onClose,
  onEditBranch,
  onPromote,
  onToggleEnabled,
}: BranchesDialogProps) {
  const qc = useQueryClient()
  const [erroPorRascunho, setErroPorRascunho] = useState<Record<number, string>>({})

  const branchesQ = useFindBranchesByClient(client.publicId)
  const branches = (branchesQ.data ?? client.branches) as unknown as BranchResponse[]

  const { control, register, setValue, handleSubmit, formState: { errors } } =
    useForm<ClientFormValues>({
      resolver: zodResolver(clientFormSchema),
      defaultValues: clientToFormValues({ ...client, branches }),
    })

  const { fields, append, remove } = useFieldArray({ control, name: 'branches' })

  const salvarMut = useMutation({
    mutationFn: async (values: ClientFormValues) => {
      const novas = filiaisNovas(values)
      // Índices dos rascunhos no formulário, para o erro cair na linha certa.
      const indices = values.branches.flatMap((b, i) => (b.publicId ? [] : [i]))

      const criadas: number[] = []
      for (let k = 0; k < novas.length; k++) {
        try {
          await createBranch(
            client.publicId,
            novas[k] as BranchRequest as GeneratedBranchRequest,
          )
          criadas.push(indices[k])
        } catch (err) {
          // Para no primeiro erro: o que passou já está no servidor, e os
          // rascunhos que faltam continuam no formulário.
          throw new CriarFilialError(err, criadas, indices[k])
        }
      }
      return criadas
    },
    onSuccess: (criadas) => {
      invalidateBranches(qc, client.publicId)
      invalidateClient(qc, client.publicId)
      invalidateClients(qc)
      setErroPorRascunho({})
      toast.success(
        criadas.length === 0
          ? 'Nenhuma filial nova para salvar'
          : criadas.length === 1
            ? 'Filial cadastrada'
            : `${criadas.length} filiais cadastradas`,
      )
      onClose()
    },
    onError: (e) => {
      const parcial = e instanceof CriarFilialError ? e : null
      const err = parcial ? parcial.original : e
      const criadas = parcial?.criadas ?? []
      const falhou = parcial?.falhou ?? -1

      invalidateBranches(qc, client.publicId)
      invalidateClient(qc, client.publicId)
      invalidateClients(qc)

      // Assimetria do backend: o POST de filial devolve 422 com mensagem solta,
      // sem `fieldErrors` — daí o erro inline por rascunho em vez de setError.
      if (falhou >= 0) {
        setErroPorRascunho({ [falhou]: apiErrorToMessage(err, 'Não foi possível cadastrar esta filial') })
      }
      if (criadas.length > 0) {
        toast.warning(`${criadas.length} filial(is) já foram cadastradas antes do erro.`)
      } else {
        toast.error(apiErrorToMessage(err, 'Não foi possível cadastrar a filial'))
      }
    },
  })

  const podeCriar = canCreateBranch(client)
  const rascunhos = fields.filter((f, i) => !f.publicId && i > 0).length

  return (
    <>
      <Backdrop onClose={onClose} />
      <DialogCard
        title="Filiais"
        onClose={onClose}
        wide
        footer={
          <>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg px-4 py-1.5 text-[13px] font-medium transition-opacity hover:opacity-70"
              style={{ background: 'var(--wl-surface-2)', color: 'var(--wl-text-muted)', border: '1px solid var(--wl-border)' }}
            >
              {rascunhos > 0 ? 'Cancelar' : 'Fechar'}
            </button>
            {rascunhos > 0 && (
              <button
                type="submit"
                form="branches-form"
                disabled={salvarMut.isPending}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-opacity disabled:opacity-50"
                style={{ background: 'var(--primary)', color: '#fff' }}
              >
                {salvarMut.isPending && <Loader2 size={13} className="animate-spin" />}
                Salvar
              </button>
            )}
          </>
        }
      >
        <p className="mb-3 text-[12px]" style={{ color: 'var(--wl-text-muted)' }}>
          {client.name}
        </p>

        <form id="branches-form" onSubmit={handleSubmit((v) => salvarMut.mutate(v))} className="space-y-4">
          {branchesQ.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={18} className="animate-spin" style={{ color: 'var(--wl-text-muted)' }} />
            </div>
          ) : (
            <div className="space-y-2">
              {fields.map((field) => {
                if (!field.publicId) return null
                const branch = branches.find((b) => b.publicId === field.publicId)
                if (!branch) return null
                return (
                  <BranchCard
                    key={field.id}
                    branch={branch}
                    client={client}
                    branches={branches}
                    isAdmin={isAdmin}
                    onEdit={onEditBranch}
                    onPromote={onPromote}
                    onToggleEnabled={onToggleEnabled}
                  />
                )
              })}
            </div>
          )}

          <SectionTitle
            action={
              podeCriar ? (
                <button
                  type="button"
                  onClick={() => append({ ...emptyBranch(), isMatriz: false })}
                  className="flex cursor-pointer items-center gap-1 text-[12px] font-medium transition-opacity hover:opacity-70"
                  style={{ color: 'var(--primary)' }}
                >
                  <Plus size={12} /> Adicionar filial
                </button>
              ) : undefined
            }
          >
            Nova filial
          </SectionTitle>

          {!podeCriar && (
            <p className="text-[12px]" style={{ color: 'var(--wl-text-dim)' }}>
              {client.tipo === 'PF'
                ? 'Pessoa física não tem filiais.'
                : 'Cliente inativo não recebe filiais novas.'}
            </p>
          )}

          {podeCriar && rascunhos === 0 && (
            <p className="text-[12px]" style={{ color: 'var(--wl-text-dim)' }}>
              Clique em &quot;Adicionar filial&quot; para cadastrar.
            </p>
          )}

          {fields.map((field, i) => {
            if (field.publicId || i === 0) return null
            return (
              <div
                key={field.id}
                className="space-y-3 rounded-lg p-3"
                style={{
                  border: `1px solid ${erroPorRascunho[i] ? 'var(--wl-danger)' : 'var(--wl-border)'}`,
                }}
              >
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--wl-text-muted)' }}>
                    Filial nova
                  </p>
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-[var(--wl-surface-2)]"
                    style={{ color: 'var(--wl-text-muted)' }}
                    aria-label="Descartar filial nova"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <BranchFields
                  control={control}
                  register={register}
                  setValue={setValue}
                  errors={errors}
                  index={i}
                />

                {erroPorRascunho[i] && (
                  <p className="text-[11px]" style={{ color: 'var(--wl-danger)' }}>
                    {erroPorRascunho[i]}
                  </p>
                )}
              </div>
            )
          })}

          {typeof errors.branches?.message === 'string' && (
            <p className="text-[11px]" style={{ color: 'var(--status-open)' }}>
              {errors.branches.message}
            </p>
          )}
        </form>
      </DialogCard>
    </>
  )
}

// ── Internos ──────────────────────────────────────────────────────────────────

function BranchCard({
  branch,
  client,
  branches,
  isAdmin,
  onEdit,
  onPromote,
  onToggleEnabled,
}: {
  branch: BranchResponse
  client: ClientResponse
  branches: BranchResponse[]
  isAdmin?: boolean
  onEdit?: (b: BranchResponse) => void
  onPromote?: (b: BranchResponse) => void
  onToggleEnabled?: (b: BranchResponse) => void
}) {
  const contato = contatoPrincipal(branch)
  const endereco = formatEndereco(branch.address)
  const podePromover = canPromoteToMatriz(branch, client)
  const podeInativar = canDeactivateBranch(branch, client)
  const podeReativar = canActivateBranch(branch, client, branches)

  return (
    <div
      className="rounded-lg p-3"
      style={{
        background: 'var(--wl-surface-2)',
        border: '1px solid var(--wl-border)',
        opacity: branch.enabled ? 1 : 0.65,
      }}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span className="truncate text-[13px] font-semibold" style={{ color: 'var(--wl-text)' }}>
          {branch.apelido || formatDocumento(branch.documento)}
        </span>
        {branch.isMatriz && (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{ color: 'var(--primary)', background: 'color-mix(in oklab, var(--primary) 16%, transparent)' }}
          >
            <Building2 size={9} /> Matriz
          </span>
        )}
        {!branch.enabled && <StatusPill active={false} variant="badge" className="shrink-0" />}

        <div className="flex-1" />

        {podePromover && onPromote && (
          <IconButton label="Definir como matriz" onClick={() => onPromote(branch)}>
            <Star size={13} />
          </IconButton>
        )}
        {isAdmin && podeInativar && onToggleEnabled && (
          <IconButton label="Inativar filial" danger onClick={() => onToggleEnabled(branch)}>
            <Trash2 size={13} />
          </IconButton>
        )}
        {isAdmin && podeReativar && onToggleEnabled && (
          <IconButton label="Reativar filial" onClick={() => onToggleEnabled(branch)}>
            <Star size={13} />
          </IconButton>
        )}
        {onEdit && (
          <IconButton label="Editar filial" onClick={() => onEdit(branch)}>
            <Pencil size={13} />
          </IconButton>
        )}
      </div>

      <div className="grid gap-x-4 gap-y-0.5 text-[12px] sm:grid-cols-2" style={{ color: 'var(--wl-text-muted)' }}>
        {/* Sem apelido o título já é o documento — não repetir. */}
        {branch.apelido && <span className="tabular-nums">{formatDocumento(branch.documento)}</span>}
        {branch.inscricaoEstadual && <span>IE: {branch.inscricaoEstadual}</span>}
        {contato && <span className="truncate">Contato: {contatoLabel(contato)}</span>}
        {endereco && <span className="truncate sm:col-span-2">{endereco}</span>}
      </div>
    </div>
  )
}

function IconButton({
  label,
  danger,
  onClick,
  children,
}: {
  label: string
  danger?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-[var(--wl-surface)]"
      style={{ color: danger ? 'var(--wl-danger)' : 'var(--wl-text-muted)' }}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  )
}
