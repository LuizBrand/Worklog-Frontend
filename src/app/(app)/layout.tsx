'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useAuthStore } from '@/state/auth'
import { AppShell } from '@/components/shell/app-shell'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const acessToken = useAuthStore((s) => s.acessToken)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // Register the listener BEFORE calling rehydrate() so it is in place
    // when hydration completes synchronously (localStorage is sync).
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true))
    useAuthStore.persist.rehydrate()
    return unsub
  }, [])

  useEffect(() => {
    if (hydrated && !acessToken) {
      router.replace('/login')
    }
  }, [hydrated, acessToken, router])

  if (!hydrated || !acessToken) return null

  return <AppShell>{children}</AppShell>
}
