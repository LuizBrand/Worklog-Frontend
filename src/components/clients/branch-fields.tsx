'use client'

import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useFieldArray, useWatch, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from 'react-hook-form'
import { AlertTriangle, ChevronDown, ChevronRight, Loader2, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { lookupByCnpj } from '@/api/generated/clientes/clientes'
import { CONTACT_TYPE_LABEL, ClientType } from '@/api/clients-contract'
import type { CnpjLookupResponse } from '@/api/clients-contract'
import { apiErrorToMessage } from '@/lib/api-errors'
import { isValidCnpj, stripDocumento } from '@/lib/documento'
import { FormField, SectionTitle, inputCls, inputStyle } from './client-form-shell'
import { emptyContato, type ClientFormValues } from './client-schema'

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

export function BranchFields({
  control,
  register,
  setValue,
  errors,
  index,
  preencheCliente,
}: BranchFieldsProps) {
  const [aberto, setAberto] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  /**
   * Último documento consultado.
   *
   * O clique na lupa dispara o `blur` do input antes do próprio clique, então
   * sem isso o mesmo CNPJ ia duas vezes para um endpoint de 5 consultas/min
   * compartilhadas pela equipe. Também evita reconsultar ao só tabular pelo
   * campo sem alterar nada.
   */
  const consultado = useRef<string | null>(null)

  const tipo = useWatch({ control, name: 'tipo' })
  const documento = useWatch({ control, name: `branches.${index}.documento` })
  const isPJ = tipo === ClientType.PJ
  const branchErrors = errors.branches?.[index]

  const { fields, append, remove } = useFieldArray({ control, name: `branches.${index}.contatos` })

  // O provedor público limita a 5 consultas/min por IP, compartilhadas pela
  // equipe: nunca consultar por tecla, só no blur ou no clique da lupa, e só
  // depois do checksum passar aqui.
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
    if (filial) {
      if (filial.address) {
        setValue(`branches.${index}.address`, {
          cep: filial.address.cep ?? '',
          logradouro: filial.address.logradouro ?? '',
          numero: filial.address.numero ?? '',
          complemento: filial.address.complemento ?? '',
          bairro: filial.address.bairro ?? '',
          cidade: filial.address.cidade ?? '',
          uf: filial.address.uf ?? '',
        })
      }
      if (filial.contatos?.length) {
        setValue(
          `branches.${index}.contatos`,
          filial.contatos.map((c) => ({
            tipo: c.tipo,
            valor: c.valor,
            descricao: c.descricao ?? '',
            // O provedor nunca marca principal: fica a cargo do usuário.
            principal: false,
          })),
        )
      }
      if (filial.address || filial.contatos?.length) setAberto(true)
    }

    // CNPJ não ativo é aviso, não bloqueio: o cadastro pode seguir.
    setAviso(
      data.situacaoAtiva
        ? null
        : `Situação na Receita: ${data.situacaoCadastral ?? 'não ativa'}. O cadastro pode seguir.`,
    )
    toast.success('Dados da Receita preenchidos. Confira IE, IM e o contato principal.')
  }

  function consultar() {
    const doc = stripDocumento(documento ?? '')
    if (!isPJ || !doc) return
    if (!isValidCnpj(doc)) return // o schema já sinaliza o erro no campo
    if (lookupMut.isPending || consultado.current === doc) return
    consultado.current = doc
    lookupMut.mutate(doc)
  }

  return (
    <div className="space-y-3">
      <FormField
        label={isPJ ? 'CNPJ *' : 'CPF *'}
        error={branchErrors?.documento?.message}
        hint={isPJ ? 'A consulta à Receita roda ao sair do campo ou no clique da lupa.' : undefined}
      >
        <div className="relative">
          <input
            {...register(`branches.${index}.documento`)}
            placeholder={isPJ ? '00.000.000/0000-00' : '000.000.000-00'}
            className={inputCls}
            style={inputStyle}
            inputMode={isPJ ? 'text' : 'numeric'}
            onBlur={isPJ ? consultar : undefined}
          />
          {isPJ && (
            <button
              type="button"
              onClick={consultar}
              disabled={lookupMut.isPending}
              className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-[var(--wl-surface)] disabled:cursor-not-allowed disabled:opacity-50"
              style={{ color: 'var(--wl-text-muted)' }}
              aria-label="Consultar CNPJ na Receita"
              title="Consultar na Receita"
            >
              {lookupMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            </button>
          )}
        </div>
      </FormField>

      {aviso && (
        <div
          className="flex items-start gap-2 rounded-lg px-3 py-2 text-[12px]"
          style={{
            background: 'color-mix(in oklab, var(--status-awaiting) 12%, transparent)',
            border: '1px solid color-mix(in oklab, var(--status-awaiting) 40%, transparent)',
            color: 'var(--wl-text)',
          }}
        >
          <AlertTriangle size={14} style={{ color: 'var(--status-awaiting)', flexShrink: 0, marginTop: 1 }} />
          {aviso}
        </div>
      )}

      {index > 0 && (
        <FormField label="Apelido" error={branchErrors?.apelido?.message}>
          <input
            {...register(`branches.${index}.apelido`)}
            placeholder="Como esta filial é chamada"
            className={inputCls}
            style={inputStyle}
          />
        </FormField>
      )}

      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex cursor-pointer items-center gap-1 text-[12px] font-medium transition-opacity hover:opacity-70"
        style={{ color: 'var(--primary)' }}
      >
        {aberto ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        Mais detalhes
      </button>

      {aberto && (
        <div className="space-y-3 pt-1">
          {isPJ && (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Inscrição Estadual" error={branchErrors?.inscricaoEstadual?.message}>
                <input {...register(`branches.${index}.inscricaoEstadual`)} className={inputCls} style={inputStyle} />
              </FormField>
              <FormField label="Inscrição Municipal" error={branchErrors?.inscricaoMunicipal?.message}>
                <input {...register(`branches.${index}.inscricaoMunicipal`)} className={inputCls} style={inputStyle} />
              </FormField>
            </div>
          )}

          <SectionTitle>Endereço</SectionTitle>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="CEP" error={branchErrors?.address?.cep?.message}>
              <input
                {...register(`branches.${index}.address.cep`)}
                placeholder="00000-000"
                className={inputCls}
                style={inputStyle}
                inputMode="numeric"
              />
            </FormField>
            <div className="col-span-2">
              <FormField label="Logradouro" error={branchErrors?.address?.logradouro?.message}>
                <input {...register(`branches.${index}.address.logradouro`)} className={inputCls} style={inputStyle} />
              </FormField>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Número" error={branchErrors?.address?.numero?.message}>
              <input {...register(`branches.${index}.address.numero`)} className={inputCls} style={inputStyle} />
            </FormField>
            <div className="col-span-2">
              <FormField label="Complemento" error={branchErrors?.address?.complemento?.message}>
                <input {...register(`branches.${index}.address.complemento`)} className={inputCls} style={inputStyle} />
              </FormField>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Bairro" error={branchErrors?.address?.bairro?.message}>
              <input {...register(`branches.${index}.address.bairro`)} className={inputCls} style={inputStyle} />
            </FormField>
            <FormField label="Cidade" error={branchErrors?.address?.cidade?.message}>
              <input {...register(`branches.${index}.address.cidade`)} className={inputCls} style={inputStyle} />
            </FormField>
            <FormField label="UF" error={branchErrors?.address?.uf?.message}>
              <input
                {...register(`branches.${index}.address.uf`)}
                maxLength={2}
                placeholder="SP"
                className={`${inputCls} uppercase`}
                style={inputStyle}
              />
            </FormField>
          </div>

          <SectionTitle
            action={
              <button
                type="button"
                onClick={() => append(emptyContato())}
                className="flex cursor-pointer items-center gap-1 text-[12px] font-medium transition-opacity hover:opacity-70"
                style={{ color: 'var(--primary)' }}
              >
                <Plus size={12} /> Contato
              </button>
            }
          >
            Contatos
          </SectionTitle>

          {typeof branchErrors?.contatos?.message === 'string' && (
            <p className="text-[11px]" style={{ color: 'var(--status-open)' }}>
              {branchErrors.contatos.message}
            </p>
          )}

          {fields.length === 0 ? (
            <p className="text-[12px]" style={{ color: 'var(--wl-text-dim)' }}>
              Nenhum contato. O contato principal aparece na listagem e no detalhe.
            </p>
          ) : (
            <div className="space-y-2">
              {/*
                Cada controle vai dentro de um wrapper com largura própria: o
                `w-full` do `inputCls` não pode ser sobrescrito por um `w-28`
                na mesma string (mesma especificidade, ordem do CSS decide) —
                o campo do valor colapsava para 26px por causa disso.
              */}
              {fields.map((field, j) => (
                <div
                  key={field.id}
                  className="flex flex-col gap-2 rounded-lg p-2 sm:flex-row sm:items-start sm:bg-transparent sm:p-0"
                  style={{ background: 'var(--wl-surface-2)' }}
                >
                  <div className="sm:w-28 sm:shrink-0">
                    <select
                      {...register(`branches.${index}.contatos.${j}.tipo`)}
                      className={`${inputCls} cursor-pointer`}
                      style={inputStyle}
                    >
                      {Object.entries(CONTACT_TYPE_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="min-w-0 space-y-1 sm:flex-1">
                    <input
                      {...register(`branches.${index}.contatos.${j}.valor`)}
                      placeholder="E-mail ou telefone"
                      className={inputCls}
                      style={inputStyle}
                    />
                    {branchErrors?.contatos?.[j]?.valor?.message && (
                      <p className="text-[11px]" style={{ color: 'var(--status-open)' }}>
                        {branchErrors.contatos[j]?.valor?.message}
                      </p>
                    )}
                  </div>

                  <div className="min-w-0 sm:w-32 sm:shrink-0">
                    <input
                      {...register(`branches.${index}.contatos.${j}.descricao`)}
                      placeholder="Descrição"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <label
                      className="flex h-[34px] cursor-pointer items-center gap-1.5 text-[12px]"
                      style={{ color: 'var(--wl-text-muted)' }}
                      title="Contato principal"
                    >
                      <input
                        type="checkbox"
                        {...register(`branches.${index}.contatos.${j}.principal`)}
                        className="cursor-pointer accent-[var(--primary)]"
                      />
                      Principal
                    </label>

                    <button
                      type="button"
                      onClick={() => remove(j)}
                      className="flex h-[34px] w-8 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-[var(--wl-surface)]"
                      style={{ color: 'var(--wl-text-muted)' }}
                      aria-label="Remover contato"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
