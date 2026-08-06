'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Info, Loader2, Pencil } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { updateClient } from '@/api/generated/clientes/clientes'
import { createBranch, updateBranch } from '@/api/generated/filiais/filiais'
import { invalidateBranches, invalidateClient, invalidateClients } from '@/api/invalidate'
import { matrizDoCliente } from '@/api/clients-contract'
import type { BranchRequest, ClientResponse } from '@/api/clients-contract'
import type {
  BranchRequest as GeneratedBranchRequest,
  BranchUpdateRequest as GeneratedBranchUpdateRequest,
  ClientUpdateRequest as GeneratedClientUpdateRequest,
} from '@/api/generated/schemas'
import { applyApiFieldErrors } from '@/lib/field-errors'
import { apiErrorToMessage } from '@/lib/api-errors'
import { Backdrop, DialogCard } from './client-form-shell'
import { ClientFormFields } from './client-form-fields'
import { clientFormSchema, type ClientFormValues } from './client-schema'
import {
  clientToFormValues,
  filiaisNovas,
  toBranchUpdateRequest,
  toClientUpdateRequest,
} from './client-save'

export interface ClientEditDialogProps {
  client: ClientResponse
  onClose: () => void
}

/** Etapa concluída, para o toast dizer o que passou antes do erro. */
type Etapa = 'cliente' | 'matriz' | 'filial'

const ETAPA_LABEL: Record<Etapa, string> = {
  cliente: 'dados do cliente',
  matriz: 'matriz',
  filial: 'filiais',
}

/** Carrega o que já tinha sido salvo quando a sequência falhou no meio. */
class SaveParcialError extends Error {
  constructor(
    readonly original: unknown,
    readonly concluidas: Etapa[],
  ) {
    super('falha ao salvar cliente')
    this.name = 'SaveParcialError'
  }
}

export function ClientEditDialog({ client, onClose }: ClientEditDialogProps) {
  const qc = useQueryClient()
  const matriz = matrizDoCliente(client)

  const { control, register, setValue, getValues, handleSubmit, setError, formState: { errors } } =
    useForm<ClientFormValues>({
      resolver: zodResolver(clientFormSchema),
      defaultValues: clientToFormValues(client),
    })

  /**
   * `PATCH /clients` ignora `branches` (§4.4), mas o dialog edita a matriz junto
   * com o cliente. Então salvar é uma sequência: cliente → matriz → filiais
   * novas. Para no primeiro erro e diz o que já tinha passado.
   *
   * **Não é atômico e não tem como ser** — daí o aviso no rodapé do formulário
   * em vez de fingir transação.
   */
  const saveMut = useMutation({
    mutationFn: async (values: ClientFormValues) => {
      const concluidas: Etapa[] = []
      try {
        const clientPatch = toClientUpdateRequest(client, values)
        if (clientPatch) {
          await updateClient(client.publicId, clientPatch as GeneratedClientUpdateRequest)
          concluidas.push('cliente')
        }

        const matrizValues = values.branches.find((b) => b.publicId === matriz?.publicId)
        if (matriz && matrizValues) {
          const branchPatch = toBranchUpdateRequest(matriz, matrizValues)
          if (branchPatch) {
            await updateBranch(
              client.publicId,
              matriz.publicId,
              branchPatch as GeneratedBranchUpdateRequest,
            )
            concluidas.push('matriz')
          }
        }

        const novas = filiaisNovas(values)
        for (const filial of novas) {
          await createBranch(client.publicId, filial as BranchRequest as GeneratedBranchRequest)
        }
        if (novas.length > 0) concluidas.push('filial')
      } catch (err) {
        throw new SaveParcialError(err, concluidas)
      }

      return concluidas
    },
    onSuccess: (concluidas) => {
      invalidateClient(qc, client.publicId)
      invalidateBranches(qc, client.publicId)
      invalidateClients(qc)
      toast.success(concluidas.length === 0 ? 'Nada para salvar' : 'Cliente atualizado')
      onClose()
    },
    onError: (err) => {
      // A sequência não é atômica: o que passou antes do erro ficou salvo, e o
      // formulário continua aberto com o que falta. Recarrega para a tela não
      // mentir sobre o estado.
      invalidateClient(qc, client.publicId)
      invalidateBranches(qc, client.publicId)
      invalidateClients(qc)

      const parcial = err instanceof SaveParcialError ? err : null
      const original = parcial ? parcial.original : err
      const salvo = parcial?.concluidas ?? []

      if (!applyApiFieldErrors(original, setError)) {
        toast.error(apiErrorToMessage(original, 'Não foi possível salvar as alterações'), {
          description:
            salvo.length > 0
              ? `Já tinha sido salvo: ${salvo.map((e) => ETAPA_LABEL[e]).join(', ')}.`
              : 'Nenhuma alteração foi gravada.',
        })
      } else if (salvo.length > 0) {
        toast.warning(`Salvo parcialmente: ${salvo.map((e) => ETAPA_LABEL[e]).join(', ')}.`)
      }
    },
  })

  return (
    <>
      <Backdrop onClose={onClose} />
      <DialogCard
        title="Editar cliente"
        subtitle={client.name}
        icon={<Pencil size={15} />}
        onClose={onClose}
        footer={
          <>
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
              form="client-edit-form"
              disabled={saveMut.isPending}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-opacity disabled:opacity-50"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              {saveMut.isPending && <Loader2 size={13} className="animate-spin" />}
              Salvar
            </button>
          </>
        }
      >
        <form id="client-edit-form" onSubmit={handleSubmit((v) => saveMut.mutate(v))} className="space-y-3">
          {/* Filiais existentes se editam no dialog de filiais: aqui cada uma
              seria um POST/PATCH próprio, e o erro parcial ficaria opaco. */}
          <ClientFormFields
            control={control}
            register={register}
            setValue={setValue}
            getValues={getValues}
            errors={errors}
            autoFocusName
          />

          <p className="flex items-start gap-1.5 text-[11px]" style={{ color: 'var(--wl-text-dim)' }}>
            <Info size={12} style={{ flexShrink: 0, marginTop: 1 }} />
            Cliente e matriz são salvos em chamadas separadas, na ordem. Se a segunda
            falhar, a primeira já foi gravada — a tela recarrega com o que valeu.
          </p>
        </form>
      </DialogCard>
    </>
  )
}
