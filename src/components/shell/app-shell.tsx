'use client'

import { useEffect } from 'react'

import { useAuthStore } from '@/state/auth'
import { useGetMe } from '@/api/generated/usuários/usuários'
import { useIsDesktop } from '@/hooks/use-is-desktop'
import { Sidebar } from './sidebar'
import { TopBar } from './top-bar'
import { BottomTabBar } from './bottom-tab-bar'

export function AppShell({ children }: { children: React.ReactNode }) {
  const isDesktop = useIsDesktop()
  const setUser = useAuthStore((s) => s.setUser)

  const { data: me } = useGetMe()

  useEffect(() => {
    if (me) setUser(me)
  }, [me, setUser])

  if (isDesktop) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <BottomTabBar />
    </div>
  )
}
