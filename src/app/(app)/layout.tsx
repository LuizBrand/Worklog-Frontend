'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useAuthStore } from '@/state/auth'
import { AppShell } from '@/components/shell/app-shell'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const acessToken = useAuthStore((s) => s.acessToken)
  // Lazy initializer: synchronously true when zustand has already read localStorage.
  // The effect below subscribes for the async case (first mount before hydration).
  const [hydrated, setHydrated] = useState(() =>
    useAuthStore.persist.hasHydrated(),
  )

  useEffect(() => {
    if (hydrated) return
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true))
  }, [hydrated])

  useEffect(() => {
    if (hydrated && !acessToken) {
      router.replace('/login')
    }
  }, [hydrated, acessToken, router])

  if (!hydrated || !acessToken) return null

  return <AppShell>{children}</AppShell>
}
