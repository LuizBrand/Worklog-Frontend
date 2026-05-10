'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v3'
import { toast } from 'sonner'

import {
  useLogin,
  useRegister,
} from '@/api/generated/autenticação/autenticação'
import { useAuthStore } from '@/state/auth'
import { Logo } from '@/components/worklog/logo'
import { Button } from '@/components/ui/button'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
      'Senha deve conter letras maiúsculas, minúsculas e números',
    ),
})

type LoginValues = z.infer<typeof loginSchema>
type RegisterValues = z.infer<typeof registerSchema>

const inputCls =
  'h-9 w-full rounded-md border px-3 py-1 text-sm outline-none transition-colors focus:ring-2 focus:ring-ring/30 focus:border-ring'
const inputStyle = {
  background: 'var(--wl-surface-2)',
  border: '1px solid var(--wl-border)',
  color: 'var(--wl-text)',
}

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
  const setTokens = useAuthStore((s) => s.setTokens)
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [direction, setDirection] = useState<'left' | 'right'>('right')

  function switchTab(next: 'login' | 'register') {
    setDirection(next === 'register' ? 'right' : 'left')
    setTab(next)
  }

  const {
    register: loginRegister,
    handleSubmit: loginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const {
    register: regRegister,
    handleSubmit: regSubmit,
    reset: regReset,
    formState: { errors: regErrors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  const { mutate: login, isPending: isLoginPending } = useLogin({
    mutation: {
      onSuccess(data) {
        if (!data.acessToken || !data.refreshToken) return
        setTokens(data.acessToken, data.refreshToken)
        router.replace('/dashboard')
      },
    },
  })

  const { mutate: doRegister, isPending: isRegisterPending } = useRegister({
    mutation: {
      onSuccess() {
        toast.success('Conta criada! Faça login para continuar.')
        regReset()
        setTab('login')
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

      {/* Tab switcher */}
      <div className="flex w-full rounded-lg p-1" style={{ background: 'var(--wl-surface-2)' }}>
        {(['login', 'register'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => switchTab(t)}
            className="flex-1 rounded-md py-1.5 text-[13px] font-medium transition-colors"
            style={{
              background: tab === t ? 'var(--wl-surface)' : 'transparent',
              color: tab === t ? 'var(--wl-text)' : 'var(--wl-text-muted)',
            }}
          >
            {t === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        ))}
      </div>

      {tab === 'login' ? (
        <form
          key="login"
          onSubmit={loginSubmit((v) => login({ data: v }))}
          className={`space-y-4 ${direction === 'left' ? 'animate-tab-in-left' : 'animate-tab-in-right'}`}
        >
          <div>
            <FieldLabel htmlFor="login-email">E-mail</FieldLabel>
            <input
              id="login-email"
              type="email"
              placeholder="voce@empresa.com"
              autoComplete="email"
              autoFocus
              className={inputCls}
              style={inputStyle}
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
              style={inputStyle}
              {...loginRegister('password')}
            />
            <FieldError msg={loginErrors.password?.message} />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={isLoginPending}>
            {isLoginPending ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      ) : (
        <form
          key="register"
          onSubmit={regSubmit((v) => doRegister({ data: v }))}
          className={`space-y-4 ${direction === 'right' ? 'animate-tab-in-right' : 'animate-tab-in-left'}`}
        >
          <div>
            <FieldLabel htmlFor="reg-name">Nome</FieldLabel>
            <input
              id="reg-name"
              placeholder="Seu nome"
              autoComplete="name"
              autoFocus
              className={inputCls}
              style={inputStyle}
              {...regRegister('name')}
            />
            <FieldError msg={regErrors.name?.message} />
          </div>

          <div>
            <FieldLabel htmlFor="reg-email">E-mail</FieldLabel>
            <input
              id="reg-email"
              type="email"
              placeholder="voce@empresa.com"
              autoComplete="email"
              className={inputCls}
              style={inputStyle}
              {...regRegister('email')}
            />
            <FieldError msg={regErrors.email?.message} />
          </div>

          <div>
            <FieldLabel htmlFor="reg-password">Senha</FieldLabel>
            <input
              id="reg-password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              className={inputCls}
              style={inputStyle}
              {...regRegister('password')}
            />
            <FieldError msg={regErrors.password?.message} />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={isRegisterPending}>
            {isRegisterPending ? 'Criando conta…' : 'Criar conta'}
          </Button>
        </form>
      )}
    </div>
  )
}
