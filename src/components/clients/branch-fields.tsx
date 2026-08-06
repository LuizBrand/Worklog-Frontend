'use client'

import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useWatch, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from 'react-hook-form'
import { AlertTriangle, Building2, FileText, Loader2, Mail, MapPin, Phone, Search } from 'lucide-react'
import { toast } from 'sonner'

import { lookupByCnpj } from '@/api/generated/clientes/clientes'
import { ClientType } from '@/api/clients-contract'
import type { CnpjLookupResponse } from '@/api/clients-contract'
import { apiErrorToMessage } from '@/lib/api-errors'
import { isValidCnpj, stripDocumento } from '@/lib/documento'
import { FormField, IconInput } from './client-form-shell'
import { SLOT_EMAIL, SLOT_TELEFONE } from './client-contatos'
import type { ClientFormValues } from './client-schema'

export interface BranchFieldsProps {
  control: Control<ClientFormValues>
  register: UseFormRegister<ClientFormValues>
  setValue: UseFormSetValue<ClientFormValues>
  errors: FieldErrors<ClientFormValues>
  /** Índice em `branches`. 0 é a matriz. */
  index: number
  /** Só a matriz preenche nome/nomeFantasia/regime do cliente pelo lookup. */
  preencheCliente?: boolean
}

const ICON = 14

/**
 * Campos de uma filial, na ordem do mockup de "Editar filial": nome, documento
 * e inscrição, contato, endereço. Mesma linguagem do formulário de cliente —
 * dois campos por linha, ícone dentro do campo, o resto atrás de "Mais
 * detalhes".
 *
 * Contato e telefone são os dois slots fixos de `client-contatos.ts`, não a
 * lista livre: `contatos` no PATCH substitui a lista inteira, e é
 * `emOrdemCompacta` que mantém os contatos extras vivos no array.
 *
 * "Regime tributário" não aparece: o mockup o põe na filial, mas regime é campo
 * do cliente (assunção 6 do plano).
 */
export function BranchFields({
  control,
  register,
  setValue,
  errors,
  index,
  preencheCliente,
}: BranchFieldsProps) {
  const [detalhes, setDetalhes] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  /**
   * Último documento consultado.
   *
   * O clique na lupa dispara o `blur` do input antes do próprio clique, então
   * sem isso o mesmo CNPJ ia duas vezes para um endpoint de 5 consultas/min
   * compartilhadas pela equipe.
   */
  const consultado = useRef<string | null>(null)

  const tipo = useWatch({ control, name: 'tipo' })
  const documento = useWatch({ control, name: `branches.${index}.documento` })
  const isPJ = tipo === ClientType.PJ
  const branchErrors = errors.branches?.[index]

  const lookupMut = useMutation({
    mutationFn: (doc: string) => lookupByCnpj({ documento: doc }),
    onSuccess: (data) => aplicarLookup(data as unknown as CnpjLookupResponse),
    onError: (err) => {
      setAviso(null)
      // Libera a reconsulta: falha de rede ou 429 tem que poder ser repetida.
      consultado.current = null
      toast.error(apiErrorToMessage(err, 'Não foi possível consultar o CNPJ'))
    },
  })

  function aplicarLookup(data: CnpjLookupResponse) {
    if (preencheCliente) {
      if (data.name) setValue('name', data.name, { shouldValidate: true })
      if (data.nomeFantasia) setValue('nomeFantasia', data.nomeFantasia)
      // O provedor só afirma regime para MEI e Simples Nacional.
      if (data.regimeTributario) setValue('regimeTributario', data.regimeTributario)
    }

    const filial = data.branches[0]
    if (filial?.address) {
      const a = filial.address
      setValue(`branches.${index}.address`, {
        cep: a.cep ?? '',
        logradouro: a.logradouro ?? '',
        numero: a.numero ?? '',
        complemento: a.complemento ?? '',
        bairro: a.bairro ?? '',
        cidade: a.cidade ?? '',
        uf: a.uf ?? '',
      })
    }
    if (filial?.contatos?.length) {
      const email = filial.contatos.find((c) => c.tipo === 'EMAIL')
      const tel = filial.contatos.find((c) => c.tipo !== 'EMAIL')
      if (email) setValue(`branches.${index}.contatos.${SLOT_EMAIL}.valor`, email.valor)
      if (tel) {
        setValue(`branches.${index}.contatos.${SLOT_TELEFONE}.valor`, tel.valor)
        setValue(`branches.${index}.contatos.${SLOT_TELEFONE}.tipo`, tel.tipo)
      }
    }

    // CNPJ não ativo é aviso, não bloqueio: o cadastro pode seguir.
    setAviso(
      data.situacaoAtiva
        ? null
        : `Situação na Receita: ${data.situacaoCadastral ?? 'não ativa'}. O cadastro pode seguir.`,
    )
    toast.success('Dados da Receita preenchidos. Confira IE e o contato principal.')
  }

  function consultar() {
    const doc = stripDocumento(documento ?? '')
    if (!isPJ || !doc || !isValidCnpj(doc)) return
    if (lookupMut.isPending || consultado.current === doc) return
    consultado.current = doc
    lookupMut.mutate(doc)
  }

  return (
    <div className="space-y-3">
      {/* A matriz não tem nome próprio: quem a nomeia é a razão social do cliente. */}
      {index > 0 && (
        <FormField label="Nome da filial" error={branchErrors?.apelido?.message}>
          <IconInput
            {...register(`branches.${index}.apelido`)}
            icon={<Building2 size={ICON} />}
            placeholder="Como esta filial é chamada"
          />
        </FormField>
      )}

      <div className="grid grid-cols-2 gap-3">
        <FormField label={isPJ ? 'CNPJ' : 'CPF'} error={branchErrors?.documento?.message}>
          <IconInput
            {...register(`branches.${index}.documento`)}
            icon={<FileText size={ICON} />}
            placeholder={isPJ ? '00.000.000/0000-00' : '000.000.000-00'}
            inputMode={isPJ ? 'text' : 'numeric'}
            onBlur={isPJ ? consultar : undefined}
            acao={
              isPJ ? (
                <button
                  type="button"
                  onClick={consultar}
                  disabled={lookupMut.isPending}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-[var(--wl-surface-2)] disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ color: 'var(--wl-text-muted)' }}
                  aria-label="Consultar CNPJ na Receita"
                  title="Consultar na Receita"
                >
                  {lookupMut.isPending ? (
                    <Loader2 size={ICON} className="animate-spin" />
                  ) : (
                    <Search size={ICON} />
                  )}
                </button>
              ) : undefined
            }
          />
        </FormField>

        {isPJ ? (
          <FormField label="Inscrição estadual" error={branchErrors?.inscricaoEstadual?.message}>
            <IconInput
              {...register(`branches.${index}.inscricaoEstadual`)}
              placeholder="000.000.000.000"
            />
          </FormField>
        ) : (
          <FormField
            label="Telefone"
            error={branchErrors?.contatos?.[SLOT_TELEFONE]?.valor?.message}
          >
            <IconInput
              {...register(`branches.${index}.contatos.${SLOT_TELEFONE}.valor`)}
              icon={<Phone size={ICON} />}
              placeholder="(00) 00000-0000"
            />
          </FormField>
        )}
      </div>

      {aviso && (
        <div
          className="flex items-start gap-2 rounded-lg px-3 py-2 text-[12px]"
          style={{
            background: 'color-mix(in oklab, var(--status-awaiting) 12%, transparent)',
            border: '1px solid color-mix(in oklab, var(--status-awaiting) 40%, transparent)',
            color: 'var(--wl-text)',
          }}
        >
          <AlertTriangle size={ICON} style={{ color: 'var(--status-awaiting)', flexShrink: 0, marginTop: 1 }} />
          {aviso}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Contato" error={branchErrors?.contatos?.[SLOT_EMAIL]?.valor?.message}>
          <IconInput
            {...register(`branches.${index}.contatos.${SLOT_EMAIL}.valor`)}
            icon={<Mail size={ICON} />}
            placeholder="email@empresa.com"
            type="email"
          />
        </FormField>
        {isPJ && (
          <FormField label="Telefone" error={branchErrors?.contatos?.[SLOT_TELEFONE]?.valor?.message}>
            <IconInput
              {...register(`branches.${index}.contatos.${SLOT_TELEFONE}.valor`)}
              icon={<Phone size={ICON} />}
              placeholder="(00) 00000-0000"
            />
          </FormField>
        )}
      </div>

      <div className="grid grid-cols-[1fr_110px] gap-3">
        <FormField label="Endereço" error={branchErrors?.address?.logradouro?.message}>
          <IconInput
            {...register(`branches.${index}.address.logradouro`)}
            icon={<MapPin size={ICON} />}
            placeholder="Rua, avenida…"
          />
        </FormField>
        <FormField label="Número" error={branchErrors?.address?.numero?.message}>
          <IconInput {...register(`branches.${index}.address.numero`)} placeholder="1200" />
        </FormField>
      </div>

      <div className="grid grid-cols-[1fr_110px] gap-3">
        <FormField label="Cidade" error={branchErrors?.address?.cidade?.message}>
          <IconInput {...register(`branches.${index}.address.cidade`)} placeholder="São Paulo" />
        </FormField>
        <FormField label="UF" error={branchErrors?.address?.uf?.message}>
          <IconInput
            {...register(`branches.${index}.address.uf`)}
            maxLength={2}
            placeholder="SP"
            className="uppercase"
          />
        </FormField>
      </div>

      <button
        type="button"
        onClick={() => setDetalhes((v) => !v)}
        className="cursor-pointer text-[12px] font-medium transition-opacity hover:opacity-70"
        style={{ color: 'var(--primary)' }}
      >
        {detalhes ? 'Menos detalhes' : 'Mais detalhes'}
      </button>

      {detalhes && (
        <div className="space-y-3 rounded-lg p-3" style={{ border: '1px solid var(--wl-border)' }}>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="CEP" error={branchErrors?.address?.cep?.message}>
              <IconInput
                {...register(`branches.${index}.address.cep`)}
                placeholder="00000-000"
                inputMode="numeric"
              />
            </FormField>
            <FormField label="Bairro" error={branchErrors?.address?.bairro?.message}>
              <IconInput {...register(`branches.${index}.address.bairro`)} />
            </FormField>
            <FormField label="Complemento" error={branchErrors?.address?.complemento?.message}>
              <IconInput {...register(`branches.${index}.address.complemento`)} />
            </FormField>
          </div>
          {isPJ && (
            <FormField label="Inscrição municipal" error={branchErrors?.inscricaoMunicipal?.message}>
              <IconInput {...register(`branches.${index}.inscricaoMunicipal`)} />
            </FormField>
          )}
        </div>
      )}
    </div>
  )
}
