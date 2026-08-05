'use client'

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSaveClient } from '@/api/generated/clientes/clientes'
import { invalidateClients } from '@/api/invalidate'
import { ClientType } from '@/api/clients-contract'
import { applyApiFieldErrors } from '@/lib/field-errors'
import { apiErrorToMessage } from '@/lib/api-errors'
import type { ClientRequest as GeneratedClientRequest } from '@/api/generated/schemas'
import { Backdrop, DialogCard } from './client-form-shell'
import { ClientFormFields } from './client-form-fields'
import { BranchFields } from './branch-fields'
import { clientFormSchema, emptyClientForm, toClientRequest, type ClientFormValues } from './client-schema'

export interface ClientCreateDialogProps {
  onClose: () => void
}

/**
 * Criação: um `POST /clients/` só, com a matriz aninhada.
 *
 * Filiais além da matriz não entram aqui — o mockup as trata na tela de filiais,
 * e criar tudo de uma vez tornaria o erro parcial impossível de explicar.
 */
export function ClientCreateDialog({ onClose }: ClientCreateDialogProps) {
  const qc = useQueryClient()

  const { control, register, setValue, handleSubmit, setError, formState: { errors } } =
    useForm<ClientFormValues>({
      resolver: zodResolver(clientFormSchema),
      defaultValues: emptyClientForm(ClientType.PJ),
    })

  const tipo = useWatch({ control, name: 'tipo' })

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

  function onSubmit(values: ClientFormValues) {
    // O tipo gerado pelo Orval afrouxa obrigatoriedades que a API exige;
    // clients-contract.ts é a fonte da verdade (ver §1.2 do plano).
    createMut.mutate({ data: toClientRequest(values) as GeneratedClientRequest })
  }

  return (
    <>
      <Backdrop onClose={onClose} />
      <DialogCard
        title="Novo cliente"
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
              Cancelar
            </button>
            <button
              type="submit"
              form="client-create-form"
              disabled={createMut.isPending}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-opacity disabled:opacity-50"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              {createMut.isPending && <Loader2 size={13} className="animate-spin" />}
              Criar cliente
            </button>
          </>
        }
      >
        <form id="client-create-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <ClientFormFields
            control={control}
            register={register}
            setValue={setValue}
            errors={errors}
            autoFocusName
          />

          <div className="space-y-3 rounded-lg p-3" style={{ border: '1px solid var(--wl-border)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--wl-text-muted)' }}>
              {tipo === ClientType.PJ ? 'Matriz' : 'Dados'}
            </p>
            <BranchFields
              control={control}
              register={register}
              setValue={setValue}
              errors={errors}
              index={0}
              preencheCliente
            />
          </div>

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
