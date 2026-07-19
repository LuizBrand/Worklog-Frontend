'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v3'
import { KeyRound, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import { useGetMe, useChangeMyPassword } from '@/api/generated/usuários/usuários'
import { WlAvatar } from '@/components/worklog'
import { RoleResponseRole } from '@/api/generated/schemas'

const pwSchema = z
  .object({
    currentPassword: z.string().min(1, 'Senha atual obrigatória'),
    newPassword: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, 'Deve conter maiúscula, minúscula e número'),
    confirmPassword: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type PwValues = z.infer<typeof pwSchema>

const inputCls = 'w-full rounded-lg px-3 py-2.5 text-[13px] outline-none transition-colors focus:ring-1 focus:ring-[var(--primary)]'
const inputStyle = { background: 'var(--wl-surface-2)', border: '1px solid var(--wl-border)', color: 'var(--wl-text)' }
const readonlyStyle = { background: 'var(--wl-surface-2)', border: '1px solid var(--wl-border)', color: 'var(--wl-text-muted)', opacity: 0.7 }

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--wl-text)' }}>
      {children}
    </label>
  )
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="mt-1 text-[11px]" style={{ color: 'var(--wl-danger)' }}>{msg}</p>
}

function PasswordInput({
  reg,
  showToggle = false,
  placeholder = '••••••••',
  autoComplete,
}: {
  reg: object
  showToggle?: boolean
  placeholder?: string
  autoComplete?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        {...reg}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        className={`${inputCls} ${showToggle ? 'pr-10' : ''}`}
        style={inputStyle}
        autoComplete={autoComplete}
      />
      {showToggle && (
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
          style={{ color: 'var(--wl-text-muted)' }}
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      )}
    </div>
  )
}

export default function PerfilPage() {
  const meQ = useGetMe()
  const user = meQ.data

  const isAdmin = user?.roles?.some((r) => r.role === RoleResponseRole.ADMIN) ?? false
  const name = user?.name ?? ''

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PwValues>({
    resolver: zodResolver(pwSchema),
  })

  const changePwMut = useChangeMyPassword({
    mutation: {
      meta: { errorMessage: 'Senha atual incorreta ou erro ao alterar.' },
      onSuccess: () => {
        toast.success('Senha alterada com sucesso')
        reset()
      },
    },
  })

  function onSubmit(values: PwValues) {
    changePwMut.mutate({
      data: {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
    })
  }

  return (
    <div className="scroll-hide h-full overflow-y-auto">
      <div className="p-6 space-y-4" style={{ maxWidth: 620 }}>

        {/* ── Meu Perfil card ── */}
        <div
          className="rounded-xl p-5"
          style={{ background: 'var(--wl-surface)', border: '1px solid var(--wl-border)' }}
        >
          {/* Card header */}
          <div className="mb-4">
            <p className="text-[14px] font-semibold" style={{ color: 'var(--wl-text)' }}>Meu Perfil</p>
            <p className="text-[12px]" style={{ color: 'var(--wl-text-muted)' }}>Gerencie suas informações pessoais</p>
          </div>

          {/* Avatar + identity */}
          <div className="mb-4 flex items-center gap-4">
            {name ? (
              <WlAvatar name={name} size={52} />
            ) : (
              <div className="h-[52px] w-[52px] animate-pulse rounded-full" style={{ background: 'var(--wl-surface-2)' }} />
            )}
            <div>
              <p className="text-[15px] font-semibold" style={{ color: 'var(--wl-text)' }}>{name || '—'}</p>
              <p className="mb-1.5 text-[12px]" style={{ color: 'var(--wl-text-muted)' }}>{user?.email ?? '—'}</p>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={
                  isAdmin
                    ? { background: 'rgba(99,102,241,0.14)', color: 'var(--primary)' }
                    : { background: 'var(--wl-surface-2)', color: 'var(--wl-text-muted)' }
                }
              >
                <ShieldCheck size={10} />
                {isAdmin ? 'Administrador' : 'Usuário'}
              </span>
            </div>
          </div>

          <div className="mb-4" style={{ height: 1, background: 'var(--wl-border)' }} />

          {/* Read-only fields */}
          <div className="space-y-3">
            <div>
              <FieldLabel>Nome</FieldLabel>
              <input readOnly value={name} className={inputCls} style={readonlyStyle} />
            </div>
            <div>
              <FieldLabel>E-mail</FieldLabel>
              <input readOnly value={user?.email ?? ''} className={inputCls} style={readonlyStyle} />
            </div>
          </div>
        </div>

        {/* ── Alterar senha card ── */}
        <div
          className="rounded-xl p-5"
          style={{ background: 'var(--wl-surface)', border: '1px solid var(--wl-border)' }}
        >
          <div className="mb-4 flex items-center gap-2">
            <KeyRound size={14} style={{ color: 'var(--wl-text-muted)' }} />
            <div>
              <p className="text-[14px] font-semibold" style={{ color: 'var(--wl-text)' }}>Alterar Senha</p>
              <p className="text-[12px]" style={{ color: 'var(--wl-text-muted)' }}>Atualize sua senha de acesso</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <FieldLabel>Senha atual</FieldLabel>
              <PasswordInput reg={register('currentPassword')} autoComplete="current-password" />
              <FieldError msg={errors.currentPassword?.message} />
            </div>

            <div>
              <FieldLabel>Nova senha</FieldLabel>
              <PasswordInput reg={register('newPassword')} showToggle autoComplete="new-password" />
              <FieldError msg={errors.newPassword?.message} />
            </div>

            <div>
              <FieldLabel>Confirmar nova senha</FieldLabel>
              <PasswordInput reg={register('confirmPassword')} showToggle autoComplete="new-password" />
              <FieldError msg={errors.confirmPassword?.message} />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={changePwMut.isPending}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-opacity disabled:opacity-50 hover:opacity-85"
                style={{ background: 'var(--wl-surface-2)', color: 'var(--wl-text)', border: '1px solid var(--wl-border)' }}
              >
                {changePwMut.isPending ? <Loader2 size={13} className="animate-spin" /> : <KeyRound size={13} />}
                Alterar senha
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
