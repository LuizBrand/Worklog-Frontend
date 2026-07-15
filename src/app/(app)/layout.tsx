'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useGetMe } from '@/api/generated/usuários/usuários'
import { useAuthStore } from '@/state/auth'
import { notifySessionExpired } from '@/lib/api-errors'
import { AppShell } from '@/components/shell/app-shell'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)

  // Cookie auth: we can't read the HttpOnly cookie from JS, so we probe
  // /users/me. 200 → authenticated. The axios interceptor tries a transparent
  // refresh first; if that fails the probe surfaces 401 (dead refresh) or 403
  // (no valid session) here — either way, send the user to /login.
  const { data, isLoading, isError, error } = useGetMe({
    query: { retry: false },
  })

  useEffect(() => {
    if (data) setUser(data)
  }, [data, setUser])

  useEffect(() => {
    if (!isError) return
    const status = (error as { response?: { status?: number } } | null)?.response?.status
    if (status === 401 || status === 403) {
      notifySessionExpired()
      router.replace('/login')
    }
  }, [isError, error, router])

  if (isLoading || isError || !data) return null

  return <AppShell>{children}</AppShell>
}
