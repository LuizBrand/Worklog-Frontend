'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v3'

import { useQueryClient } from '@tanstack/react-query'

import { useLogin } from '@/api/generated/autenticação/autenticação'
import { getGetMeQueryKey } from '@/api/generated/usuários/usuários'
import { Logo } from '@/components/worklog/logo'
import { Button } from '@/components/ui/button'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

type LoginValues = z.infer<typeof loginSchema>

const inputCls =
  'h-9 w-full rounded-md border px-3 py-1 text-sm outline-none transition-colors ' +
  'bg-transparent border-[var(--wl-border)] text-[var(--wl-text)] ' +
  'placeholder:text-[var(--wl-text-dim)] focus:border-[var(--primary)]'

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium" style={{ color: 'var(--wl-text)' }}>
      {children}
    </label>
  )
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="mt-1 text-[11px] text-destructive">{msg}</p>
}

export default function LoginPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const {
    register: loginRegister,
    handleSubmit: loginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const { mutate: login, isPending: isLoginPending } = useLogin({
    mutation: {
      meta: { errorMessage: 'E-mail ou senha inválidos.' },
      async onSuccess() {
        await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() })
        router.replace('/dashboard')
      },
    },
  })

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Logo size={32} />
        <span className="text-lg font-semibold tracking-tight" style={{ color: 'var(--wl-text)' }}>
          WorkLog
        </span>
      </div>

      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--wl-text)' }}>
          Entrar na sua conta
        </h1>
        <p className="text-sm" style={{ color: 'var(--wl-text-muted)' }}>
          Use as credenciais fornecidas pelo administrador.
        </p>
      </div>

      <form onSubmit={loginSubmit((v) => login({ data: v }))} className="space-y-4">
        <div>
          <FieldLabel htmlFor="login-email">E-mail</FieldLabel>
          <input
            id="login-email"
            type="email"
            placeholder="voce@empresa.com"
            autoComplete="email"
            autoFocus
            className={inputCls}
            {...loginRegister('email')}
          />
          <FieldError msg={loginErrors.email?.message} />
        </div>

        <div>
          <FieldLabel htmlFor="login-password">Senha</FieldLabel>
          <input
            id="login-password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            className={inputCls}
            {...loginRegister('password')}
          />
          <FieldError msg={loginErrors.password?.message} />
        </div>

        <Button
          type="submit"
          size="lg"
          className="mt-1 h-10 w-full text-sm font-semibold tracking-tight"
          disabled={isLoginPending}
        >
          {isLoginPending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </div>
  )
}
