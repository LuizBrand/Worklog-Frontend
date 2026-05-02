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
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

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

export default function LoginPage() {
  const router = useRouter()
  const setTokens = useAuthStore((s) => s.setTokens)
  const [tab, setTab] = useState<'login' | 'register'>('login')

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const registerForm = useForm<RegisterValues>({
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

  const { mutate: register, isPending: isRegisterPending } = useRegister({
    mutation: {
      onSuccess() {
        toast.success('Conta criada! Faça login para continuar.')
        registerForm.reset()
        setTab('login')
      },
    },
  })

  function onLoginSubmit(values: LoginValues) {
    login({ data: values })
  }

  function onRegisterSubmit(values: RegisterValues) {
    register({ data: values })
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Logo top-left */}
      <div className="flex items-center gap-2">
        <Logo size={32} />
        <span
          className="text-lg font-semibold tracking-tight"
          style={{ color: 'var(--wl-text)' }}
        >
          WorkLog
        </span>
      </div>

      {/* Tab switcher */}
      <div
        className="flex w-full rounded-lg p-1"
        style={{ background: 'var(--wl-surface-2)' }}
      >
        {(['login', 'register'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
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
        <Form {...loginForm}>
          <form
            onSubmit={loginForm.handleSubmit(onLoginSubmit)}
            className="space-y-4"
          >
            <FormField
              control={loginForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="voce@empresa.com"
                      autoComplete="email"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={loginForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isLoginPending}
            >
              {isLoginPending ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </Form>
      ) : (
        <Form {...registerForm}>
          <form
            onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
            className="space-y-4"
          >
            <FormField
              control={registerForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Seu nome"
                      autoComplete="name"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={registerForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="voce@empresa.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={registerForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isRegisterPending}
            >
              {isRegisterPending ? 'Criando conta…' : 'Criar conta'}
            </Button>
          </form>
        </Form>
      )}
    </div>
  )
}
