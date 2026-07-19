'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v3'
import { X, Loader2, Eye, EyeOff } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useRegister } from '@/api/generated/autenticação/autenticação'
import { invalidateUsers } from '@/api/invalidate'
import { getApiErrorStatus, apiErrorToMessage } from '@/lib/api-errors'

// Espelha as regras do backend (POST /worklog/auth/register) para dar feedback
// imediato. O backend revalida e continua sendo a fonte de verdade.
const userSchema = z.object({
  name: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  email: z.string().min(1, 'E-mail obrigatório').email('E-mail inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
      'Deve conter maiúscula, minúscula e número',
    ),
})

type UserValues = z.infer<typeof userSchema>

const inputCls =
  'w-full rounded-lg px-3 py-2 text-[13px] outline-none transition-colors placeholder:text-[var(--wl-text-dim)] focus:ring-1 focus:ring-[var(--primary)]'
const inputStyle = {
  background: 'var(--wl-surface-2)',
  border: '1px solid var(--wl-border)',
  color: 'var(--wl-text)',
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
        <p className="text-[11px] wrap-anywhere" style={{ color: 'var(--wl-danger)' }}>{error}</p>
      )}
    </div>
  )
}

export interface UserCreateDialogProps {
  onClose: () => void
}

export function UserCreateDialog({ onClose }: UserCreateDialogProps) {
  const qc = useQueryClient()
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, setError, formState: { errors } } = useForm<UserValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  const createMut = useRegister({
    mutation: {
      // O onError local dá o tratamento por campo; sem isto o handler global
      // dispararia um toast genérico em cima.
      meta: { silent: true },
      onSuccess: () => {
        invalidateUsers(qc)
        toast.success('Usuário criado com sucesso')
        onClose()
      },
      onError: (err) => {
        const status = getApiErrorStatus(err)
        if (status === 409) {
          setError('email', { message: 'Este e-mail já está em uso' })
          return
        }
        if (status === 400) {
          setError('password', { message: apiErrorToMessage(err, 'Dados inválidos') })
          return
        }
        if (status === 403) {
          toast.error('Você não tem permissão para criar usuários')
          onClose()
          return
        }
        toast.error(apiErrorToMessage(err, 'Erro ao criar usuário'))
      },
    },
  })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function onSubmit(values: UserValues) {
    createMut.mutate({ data: values })
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        style={{ background: 'rgba(0,0,0,0.45)' }}
      />
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
              Novo usuário
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

          <form onSubmit={handleSubmit(onSubmit)} className="scroll-hide flex-1 overflow-y-auto px-5 py-4">
            <div className="space-y-4">
              <FormField label="Nome" error={errors.name?.message}>
                <input
                  {...register('name')}
                  className={inputCls}
                  style={inputStyle}
                  placeholder="João da Silva"
                  autoComplete="off"
                  autoFocus
                />
              </FormField>

              <FormField label="E-mail" error={errors.email?.message}>
                <input
                  {...register('email')}
                  type="email"
                  className={inputCls}
                  style={inputStyle}
                  placeholder="joao@empresa.com"
                  autoComplete="off"
                />
              </FormField>

              <FormField label="Senha" error={errors.password?.message}>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className={`${inputCls} pr-10`}
                    style={inputStyle}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                    style={{ color: 'var(--wl-text-muted)' }}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <p className="text-[11px]" style={{ color: 'var(--wl-text-dim)' }}>
                  Ao menos uma letra maiúscula, uma minúscula e um número.
                </p>
              </FormField>

              <p
                className="rounded-lg px-3 py-2 text-[12px] leading-relaxed"
                style={{
                  background: 'color-mix(in oklab, var(--primary) 7%, transparent)',
                  border: '1px solid color-mix(in oklab, var(--primary) 20%, transparent)',
                  color: 'var(--wl-text-muted)',
                }}
              >
                O usuário será criado com perfil <strong style={{ color: 'var(--wl-text)' }}>Usuário</strong>.
                Administradores não podem ser criados por aqui.
              </p>
            </div>

            <div className="mt-5 flex justify-end gap-2">
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
                className="flex cursor-pointer items-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-opacity disabled:opacity-50 hover:opacity-85"
                style={{ background: 'var(--primary)', color: '#fff' }}
              >
                {createMut.isPending && <Loader2 size={13} className="animate-spin" />}
                Criar usuário
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
