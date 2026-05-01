'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useAuthStore } from '@/state/auth'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const acessToken = useAuthStore((s) => s.acessToken)

  useEffect(() => {
    if (!acessToken) {
      router.replace('/login')
    }
  }, [acessToken, router])

  if (!acessToken) return null

  return <>{children}</>
}
