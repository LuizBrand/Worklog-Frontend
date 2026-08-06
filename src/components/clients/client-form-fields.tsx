'use client'

import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useFieldArray, useWatch, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from 'react-hook-form'
import {
  AlertTriangle,
  Building2,
  FileText,
  Layers,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
} from 'lucide-react'
import { toast } from 'sonner'

import { lookupByCnpj } from '@/api/generated/clientes/clientes'
import { useFindAllSystems } from '@/api/generated/sistemas/sistemas'
import { CLIENT_TYPE_LABEL, ClientType, REGIME_TRIBUTARIO_LABEL } from '@/api/clients-contract'
import type { CnpjLookupResponse } from '@/api/clients-contract'
import { apiErrorToMessage } from '@/lib/api-errors'
import { isValidCnpj, stripDocumento } from '@/lib/documento'
import { MultiSelect } from '@/components/worklog'
import { FormField, IconInput, SectionTitle, selectCls } from './client-form-shell'
import { SLOT_EMAIL, SLOT_TELEFONE } from './client-contatos'
import { emptyBranch, type ClientFormValues } from './client-schema'

export interface ClientFormFieldsProps {
  control: Control<ClientFormValues>
  register: UseFormRegister<ClientFormValues>
  setValue: UseFormSetValue<ClientFormValues>
  errors: FieldErrors<ClientFormValues>
  /** Na edição o tipo já existe e trocá-lo tem efeito colateral em filiais. */
  podeTrocarTipo?: boolean
  autoFocusName?: boolean
}

const ICON = 14

/**
 * Corpo do formulário de cliente, na ordem do mockup: tipo, identificação,
 * contato, endereço, sistemas e filiais.
 *
 * Dois campos por linha onde faz sentido — uma coluna só deixava o dialog
 * desnecessariamente alto e largo. O endereço aparece como uma linha só; os
 * campos estruturados (CEP, bairro, complemento) ficam atrás de "Mais detalhes",
 * como decidido no plano.
 */
export function ClientFormFields({
  control,
  register,
  setValue,
  errors,
  podeTrocarTipo = true,
  autoFocusName,
}: ClientFormFieldsProps) {
  const [detalhes, setDetalhes] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  /**
   * Último CNPJ consultado. O clique na lupa dispara o `blur` do input antes do
   * próprio clique; sem isto a mesma consulta ia duas vezes para um endpoint de
   * 5 chamadas/min compartilhadas pela equipe.
   */
  const consultado = useRef<string | null>(null)

  const systemsQ = useFindAllSystems()

  // useWatch em vez de watch(): watch() não é memoizável e o React Compiler
  // desiste de otimizar o componente inteiro.
  const tipo = useWatch({ control, name: 'tipo' })
  const documento = useWatch({ control, name: 'branches.0.documento' })
  const sistemas = useWatch({ control, name: 'systemsPublicIds' })
  const isPJ = tipo === ClientType.PJ
  const matrizErrors = errors.branches?.[0]

  const { fields, append, remove } = useFieldArray({ control, name: 'branches' })
  const filiais = fields.map((f, i) => ({ ...f, i })).filter((f) => f.i > 0)

  const lookupMut = useMutation({
    mutationFn: (doc: string) => lookupByCnpj({ documento: doc }),
    onSuccess: (data) => aplicarLookup(data as unknown as CnpjLookupResponse),
    onError: (err) => {
      setAviso(null)
      consultado.current = null // libera o retry
      toast.error(apiErrorToMessage(err, 'Não foi possível consultar o CNPJ'))
    },
  })

  function aplicarLookup(data: CnpjLookupResponse) {
    if (data.name) setValue('name', data.name, { shouldValidate: true })
    if (data.nomeFantasia) setValue('nomeFantasia', data.nomeFantasia)
    // O provedor só afirma regime para MEI e Simples Nacional.
    if (data.regimeTributario) setValue('regimeTributario', data.regimeTributario)

    const filial = data.branches[0]
    if (filial?.address) {
      const a = filial.address
      setValue('branches.0.address', {
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
      if (email) setValue(`branches.0.contatos.${SLOT_EMAIL}.valor`, email.valor)
      if (tel) {
        setValue(`branches.0.contatos.${SLOT_TELEFONE}.valor`, tel.valor)
        setValue(`branches.0.contatos.${SLOT_TELEFONE}.tipo`, tel.tipo)
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
      {/* ── Tipo ── */}
      <div
        className="relative flex rounded-lg p-1"
        role="radiogroup"
        aria-label="Tipo de cliente"
        style={{ background: 'var(--wl-surface-2)', border: '1px solid var(--wl-border)' }}
      >
        {/* Pastilha que desliza entre as duas opções. `motion-reduce` desliga a
            animação para quem pediu menos movimento no sistema. */}
        <span
          aria-hidden
          className="absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-md transition-transform duration-200 ease-out motion-reduce:transition-none"
          style={{
            background: 'var(--primary)',
            transform: isPJ ? 'translateX(0)' : 'translateX(100%)',
            left: '0.25rem',
          }}
        />
        {([ClientType.PJ, ClientType.PF] as const).map((t) => {
          const ativo = tipo === t
          return (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={ativo}
              disabled={!podeTrocarTipo && !ativo}
              onClick={() => {
                if (t === tipo) return
                setValue('tipo', t, { shouldValidate: false })
                // O documento muda de formato (CPF x CNPJ) e o que estava
                // digitado não vale mais.
                setValue('branches.0.documento', '', { shouldValidate: false })
                consultado.current = null
              }}
              className="relative z-10 flex-1 cursor-pointer rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={{ color: ativo ? '#fff' : 'var(--wl-text-muted)', background: 'transparent' }}
            >
              {CLIENT_TYPE_LABEL[t]}
            </button>
          )
        })}
      </div>

      {/* ── Identificação ── */}
      <FormField label={isPJ ? 'Razão social' : 'Nome completo'} error={errors.name?.message}>
        <IconInput
          {...register('name')}
          icon={isPJ ? <Building2 size={ICON} /> : <User size={ICON} />}
          placeholder={isPJ ? 'Nome da empresa' : 'Nome do cliente'}
          autoFocus={autoFocusName}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label={isPJ ? 'CNPJ' : 'CPF'} error={matrizErrors?.documento?.message}>
          <IconInput
            {...register('branches.0.documento')}
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
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-[var(--wl-surface)] disabled:cursor-not-allowed disabled:opacity-50"
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
          <FormField label="Inscrição estadual" error={matrizErrors?.inscricaoEstadual?.message}>
            <IconInput {...register('branches.0.inscricaoEstadual')} placeholder="000.000.000.000" />
          </FormField>
        ) : (
          <FormField label="Telefone" error={matrizErrors?.contatos?.[SLOT_TELEFONE]?.valor?.message}>
            <IconInput
              {...register(`branches.0.contatos.${SLOT_TELEFONE}.valor`)}
              icon={<Phone size={ICON} />}
              placeholder="(00) 00000-0000"
            />
          </FormField>
        )}
      </div>

      {isPJ && (
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Nome fantasia" error={errors.nomeFantasia?.message}>
            <IconInput {...register('nomeFantasia')} placeholder="Como é conhecida" />
          </FormField>
          <FormField label="Regime tributário" error={errors.regimeTributario?.message}>
            <select {...register('regimeTributario')} className={selectCls}>
              <option value="">Não informado</option>
              {Object.entries(REGIME_TRIBUTARIO_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      )}

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

      {/* ── Contato ── */}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Contato" error={matrizErrors?.contatos?.[SLOT_EMAIL]?.valor?.message}>
          <IconInput
            {...register(`branches.0.contatos.${SLOT_EMAIL}.valor`)}
            icon={<Mail size={ICON} />}
            placeholder="email@empresa.com"
            type="email"
          />
        </FormField>
        {isPJ ? (
          <FormField label="Telefone" error={matrizErrors?.contatos?.[SLOT_TELEFONE]?.valor?.message}>
            <IconInput
              {...register(`branches.0.contatos.${SLOT_TELEFONE}.valor`)}
              icon={<Phone size={ICON} />}
              placeholder="(00) 00000-0000"
            />
          </FormField>
        ) : (
          <FormField label="Sistemas">
            <MultiSelect
              value={sistemas ?? []}
              onChange={(v) => setValue('systemsPublicIds', v)}
              options={(systemsQ.data ?? []).map((s) => ({ value: s.publicId ?? '', label: s.name ?? '' }))}
              placeholder={systemsQ.isLoading ? 'Carregando…' : 'Selecionar sistemas'}
              icon={<Layers size={ICON} style={{ color: 'var(--wl-text-dim)' }} />}
              disabled={systemsQ.isLoading}
            />
          </FormField>
        )}
      </div>

      {/*
        ── Endereço ──
        Rua, número, cidade e UF ficam aqui, não atrás de "Mais detalhes": antes
        a linha única gravava o endereço inteiro dentro de `logradouro`, o que
        deixava cidade e UF sem os campos que a API tem para elas.
      */}
      <div className="grid grid-cols-[1fr_110px] gap-3">
        <FormField label="Endereço" error={matrizErrors?.address?.logradouro?.message}>
          <IconInput
            {...register('branches.0.address.logradouro')}
            icon={<MapPin size={ICON} />}
            placeholder="Rua, avenida…"
          />
        </FormField>
        <FormField label="Número" error={matrizErrors?.address?.numero?.message}>
          <IconInput {...register('branches.0.address.numero')} placeholder="1200" />
        </FormField>
      </div>

      {/* Mesmo template da linha acima: com [1fr_100px] e [1fr_80px] a borda
          esquerda de Número e UF ficava 20px fora de prumo. */}
      <div className="grid grid-cols-[1fr_110px] gap-3">
        <FormField label="Cidade" error={matrizErrors?.address?.cidade?.message}>
          <IconInput {...register('branches.0.address.cidade')} placeholder="São Paulo" />
        </FormField>
        <FormField label="UF" error={matrizErrors?.address?.uf?.message}>
          <IconInput
            {...register('branches.0.address.uf')}
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
            <FormField label="CEP" error={matrizErrors?.address?.cep?.message}>
              <IconInput {...register('branches.0.address.cep')} placeholder="00000-000" inputMode="numeric" />
            </FormField>
            <FormField label="Bairro" error={matrizErrors?.address?.bairro?.message}>
              <IconInput {...register('branches.0.address.bairro')} />
            </FormField>
            <FormField label="Complemento" error={matrizErrors?.address?.complemento?.message}>
              <IconInput {...register('branches.0.address.complemento')} />
            </FormField>
          </div>
          {isPJ && (
            <FormField label="Inscrição municipal" error={matrizErrors?.inscricaoMunicipal?.message}>
              <IconInput {...register('branches.0.inscricaoMunicipal')} />
            </FormField>
          )}
        </div>
      )}

      {/* ── Sistemas (PJ; em PF divide a linha com o contato) ── */}
      {isPJ && (
        <FormField label="Sistemas">
          <MultiSelect
            value={sistemas ?? []}
            onChange={(v) => setValue('systemsPublicIds', v)}
            options={(systemsQ.data ?? []).map((s) => ({ value: s.publicId ?? '', label: s.name ?? '' }))}
            placeholder={systemsQ.isLoading ? 'Carregando…' : 'Selecionar sistemas'}
            icon={<Layers size={ICON} style={{ color: 'var(--wl-text-dim)' }} />}
            disabled={systemsQ.isLoading}
          />
        </FormField>
      )}

      {/* ── Filiais (só PJ — §9 do contrato) ── */}
      {isPJ && (
        <div className="space-y-2 pt-1">
          <SectionTitle
            action={
              <button
                type="button"
                onClick={() => append({ ...emptyBranch(), isMatriz: false })}
                className="flex cursor-pointer items-center gap-1 text-[12px] font-medium transition-opacity hover:opacity-70"
                style={{ color: 'var(--primary)' }}
              >
                <Plus size={12} /> Adicionar filial
              </button>
            }
          >
            Filiais
          </SectionTitle>

          {filiais.length === 0 ? (
            <p className="text-[12px]" style={{ color: 'var(--wl-text-dim)' }}>
              Nenhuma filial adicionada.
            </p>
          ) : (
            filiais.map((f) => {
              const err = errors.branches?.[f.i]
              return (
                <div key={f.id} className="flex items-start gap-2">
                  <div
                    className="min-w-0 flex-1 space-y-2 rounded-lg p-3"
                    style={{ border: '1px solid var(--wl-border)' }}
                  >
                    <div>
                      <IconInput
                        {...register(`branches.${f.i}.apelido`)}
                        placeholder="Nome da filial"
                        aria-label="Nome da filial"
                      />
                      {err?.apelido?.message && (
                        <p className="mt-1 text-[11px]" style={{ color: 'var(--status-open)' }}>
                          {err.apelido.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <IconInput
                          {...register(`branches.${f.i}.documento`)}
                          icon={<FileText size={ICON} />}
                          placeholder="CNPJ da filial"
                          aria-label="CNPJ da filial"
                        />
                        {err?.documento?.message && (
                          <p className="mt-1 text-[11px]" style={{ color: 'var(--status-open)' }}>
                            {err.documento.message}
                          </p>
                        )}
                      </div>
                      <IconInput
                        {...register(`branches.${f.i}.inscricaoEstadual`)}
                        placeholder="Inscrição estadual"
                        aria-label="Inscrição estadual da filial"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <IconInput
                        {...register(`branches.${f.i}.contatos.${SLOT_EMAIL}.valor`)}
                        icon={<Mail size={ICON} />}
                        placeholder="email@empresa.com"
                        aria-label="E-mail da filial"
                        type="email"
                      />
                      <IconInput
                        {...register(`branches.${f.i}.contatos.${SLOT_TELEFONE}.valor`)}
                        icon={<Phone size={ICON} />}
                        placeholder="(00) 00000-0000"
                        aria-label="Telefone da filial"
                      />
                    </div>

                    <div className="grid grid-cols-[1fr_80px] gap-2">
                      <IconInput
                        {...register(`branches.${f.i}.address.logradouro`)}
                        icon={<MapPin size={ICON} />}
                        placeholder="Rua, avenida…"
                        aria-label="Endereço da filial"
                      />
                      <IconInput
                        {...register(`branches.${f.i}.address.numero`)}
                        placeholder="Nº"
                        aria-label="Número da filial"
                      />
                    </div>

                    <div className="grid grid-cols-[1fr_80px] gap-2">
                      <IconInput
                        {...register(`branches.${f.i}.address.cidade`)}
                        placeholder="Cidade"
                        aria-label="Cidade da filial"
                      />
                      <IconInput
                        {...register(`branches.${f.i}.address.uf`)}
                        maxLength={2}
                        placeholder="UF"
                        aria-label="UF da filial"
                        className="uppercase"
                      />
                    </div>
                  </div>

                  {/* Fora da borda do card: a lixeira age sobre a filial inteira,
                      não sobre o campo ao lado dela. */}
                  <button
                    type="button"
                    onClick={() => remove(f.i)}
                    className="mt-3 flex h-[34px] w-8 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-[var(--wl-surface-2)]"
                    style={{ color: 'var(--wl-danger)' }}
                    aria-label="Remover filial"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })
          )}
        </div>
      )}

      {typeof errors.branches?.message === 'string' && (
        <p className="text-[11px]" style={{ color: 'var(--status-open)' }}>
          {errors.branches.message}
        </p>
      )}
    </div>
  )
}
