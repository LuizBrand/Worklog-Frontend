'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Users } from 'lucide-react'
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
import { clientFormSchema, emptyClientForm, toClientRequest, type ClientFormValues } from './client-schema'

export interface ClientCreateDialogProps {
  onClose: () => void
}

/**
 * Criação: um `POST /clients/` só, com a matriz e as filiais aninhadas.
 *
 * Filiais entram aqui (como no mockup) porque no create tudo vai num POST
 * atômico — ou grava inteiro, ou não grava nada. Na **edição** é diferente: lá
 * cada filial nova é um POST próprio, e por isso ela mora no dialog de filiais,
 * onde o erro parcial tem como ser explicado.
 */
export function ClientCreateDialog({ onClose }: ClientCreateDialogProps) {
  const qc = useQueryClient()

  const { control, register, setValue, handleSubmit, setError, formState: { errors } } =
    useForm<ClientFormValues>({
      resolver: zodResolver(clientFormSchema),
      defaultValues: emptyClientForm(ClientType.PJ),
    })

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
        subtitle="Cadastre um cliente PJ ou PF"
        icon={<Users size={16} />}
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
              form="client-create-form"
              disabled={createMut.isPending}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-opacity disabled:opacity-50"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              {createMut.isPending && <Loader2 size={13} className="animate-spin" />}
              Salvar
            </button>
          </>
        }
      >
        <form id="client-create-form" onSubmit={handleSubmit(onSubmit)}>
          <ClientFormFields
            control={control}
            register={register}
            setValue={setValue}
            errors={errors}
            autoFocusName
          />
        </form>
      </DialogCard>
    </>
  )
}
