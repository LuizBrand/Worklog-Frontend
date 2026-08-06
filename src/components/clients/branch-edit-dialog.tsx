'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Pencil } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { updateBranch } from '@/api/generated/filiais/filiais'
import { invalidateBranches, invalidateClient, invalidateClients } from '@/api/invalidate'
import type { BranchResponse, ClientResponse } from '@/api/clients-contract'
import { formatDocumento } from '@/lib/documento'
import type { BranchUpdateRequest as GeneratedBranchUpdateRequest } from '@/api/generated/schemas'
import { apiErrorToMessage } from '@/lib/api-errors'
import { applyApiFieldErrors } from '@/lib/field-errors'
import { Backdrop, DialogCard } from './client-form-shell'
import { BranchFields } from './branch-fields'
import { clientFormSchema, type ClientFormValues } from './client-schema'
import { clientToFormValues, toBranchUpdateRequest } from './client-save'

export interface BranchEditDialogProps {
  client: ClientResponse
  branch: BranchResponse
  onClose: () => void
}

/**
 * Edição de uma filial. Um `PATCH` só.
 *
 * O formulário carrega o cliente inteiro mesmo editando uma filial: é o que
 * mantém as regras do schema válidas (exatamente uma matriz, documento não
 * repetido entre as filiais) enquanto só um índice é renderizado.
 *
 * "Regime tributário" não aparece aqui — o mockup o põe na filial, mas regime é
 * campo do cliente (assunção 6 do plano).
 */
export function BranchEditDialog({ client, branch, onClose }: BranchEditDialogProps) {
  const qc = useQueryClient()

  const { control, register, setValue, handleSubmit, setError, formState: { errors } } =
    useForm<ClientFormValues>({
      resolver: zodResolver(clientFormSchema),
      defaultValues: clientToFormValues(client),
    })

  const index = clientToFormValues(client).branches.findIndex((b) => b.publicId === branch.publicId)

  const saveMut = useMutation({
    mutationFn: async (values: ClientFormValues) => {
      const patch = toBranchUpdateRequest(branch, values.branches[index])
      if (!patch) return false
      await updateBranch(client.publicId, branch.publicId, patch as GeneratedBranchUpdateRequest)
      return true
    },
    onSuccess: (mudou) => {
      invalidateBranches(qc, client.publicId)
      invalidateClient(qc, client.publicId)
      invalidateClients(qc)
      toast.success(mudou ? 'Filial atualizada' : 'Nada para salvar')
      onClose()
    },
    onError: (err) => {
      if (!applyApiFieldErrors(err, setError)) {
        toast.error(apiErrorToMessage(err, 'Não foi possível salvar a filial'))
      }
    },
  })

  if (index < 0) return null

  return (
    <>
      <Backdrop onClose={onClose} />
      <DialogCard
        title={branch.isMatriz ? 'Editar matriz' : 'Editar filial'}
        subtitle={branch.apelido || formatDocumento(branch.documento)}
        icon={<Pencil size={16} />}
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
              form="branch-edit-form"
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
        <form id="branch-edit-form" onSubmit={handleSubmit((v) => saveMut.mutate(v))}>
          <BranchFields
            control={control}
            register={register}
            setValue={setValue}
            errors={errors}
            index={index}
          />
        </form>
      </DialogCard>
    </>
  )
}
