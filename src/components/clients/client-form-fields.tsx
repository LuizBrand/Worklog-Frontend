'use client'

import { Loader2 } from 'lucide-react'
import { useWatch, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from 'react-hook-form'

import { useFindAllSystems } from '@/api/generated/sistemas/sistemas'
import { CLIENT_TYPE_LABEL, ClientType, REGIME_TRIBUTARIO_LABEL } from '@/api/clients-contract'
import { FormField, inputCls, inputStyle } from './client-form-shell'
import type { ClientFormValues } from './client-schema'

export interface ClientFormFieldsProps {
  control: Control<ClientFormValues>
  register: UseFormRegister<ClientFormValues>
  setValue: UseFormSetValue<ClientFormValues>
  errors: FieldErrors<ClientFormValues>
  /** No create o tipo decide a máscara antes de tudo; na edição ele já existe. */
  autoFocusName?: boolean
}

export function ClientFormFields({
  control,
  register,
  setValue,
  errors,
  autoFocusName,
}: ClientFormFieldsProps) {
  const systemsQ = useFindAllSystems()

  // useWatch em vez de watch(): watch() não é memoizável e o React Compiler
  // desiste de otimizar o componente inteiro.
  const tipo = useWatch({ control, name: 'tipo' })
  const isPJ = tipo === ClientType.PJ

  return (
    <>
      <FormField label="Tipo *" error={errors.tipo?.message}>
        <div className="flex gap-2">
          {([ClientType.PJ, ClientType.PF] as const).map((t) => {
            const active = tipo === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  if (t === tipo) return
                  setValue('tipo', t, { shouldValidate: false })
                  // O documento da matriz muda de formato (CPF x CNPJ) e o que
                  // estava digitado não vale mais.
                  setValue('branches.0.documento', '', { shouldValidate: false })
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

      <FormField label={isPJ ? 'Razão social *' : 'Nome completo *'} error={errors.name?.message}>
        <input
          {...register('name')}
          placeholder={isPJ ? 'Nome da empresa' : 'Nome do cliente'}
          className={inputCls}
          style={inputStyle}
          autoFocus={autoFocusName}
        />
      </FormField>

      {isPJ && (
        <>
          <FormField label="Nome fantasia" error={errors.nomeFantasia?.message}>
            <input
              {...register('nomeFantasia')}
              placeholder="Como a empresa é conhecida"
              className={inputCls}
              style={inputStyle}
            />
          </FormField>

          <FormField label="Regime tributário" error={errors.regimeTributario?.message}>
            <select {...register('regimeTributario')} className={`${inputCls} cursor-pointer`} style={inputStyle}>
              <option value="">Não informado</option>
              {Object.entries(REGIME_TRIBUTARIO_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </FormField>
        </>
      )}

      <FormField label="Sistemas" error={errors.systemsPublicIds?.message}>
        {systemsQ.isLoading ? (
          <div className="flex items-center gap-2 px-3 py-2 text-[13px]" style={{ color: 'var(--wl-text-muted)' }}>
            <Loader2 size={13} className="animate-spin" /> Carregando sistemas…
          </div>
        ) : (systemsQ.data ?? []).length === 0 ? (
          <p className="px-3 py-2 text-[13px]" style={{ color: 'var(--wl-text-muted)' }}>
            Nenhum sistema disponível.
          </p>
        ) : (
          <div
            className="scroll-hide grid max-h-48 grid-cols-2 gap-x-4 gap-y-2 overflow-y-auto rounded-lg p-3"
            style={inputStyle}
          >
            {(systemsQ.data ?? []).map((s) => (
              <label key={s.publicId} className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  value={s.publicId ?? ''}
                  {...register('systemsPublicIds')}
                  className="cursor-pointer accent-[var(--primary)]"
                />
                <span className="text-[13px]" style={{ color: 'var(--wl-text)' }}>
                  {s.name}
                </span>
              </label>
            ))}
          </div>
        )}
      </FormField>
    </>
  )
}
