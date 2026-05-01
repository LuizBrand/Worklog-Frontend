'use client'

import { useTheme } from 'next-themes'
import { HugeiconsIcon } from '@hugeicons/react'
import { Moon02Icon, Sun01Icon } from '@hugeicons/core-free-icons'

import { Logo } from '@/components/worklog/logo'
import { Button } from '@/components/ui/button'
import { UserMenu } from './user-menu'

interface TopBarProps {
  title?: string
}

export function TopBar({ title }: TopBarProps) {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <header className="flex h-[54px] flex-shrink-0 items-center justify-between border-b border-border bg-card px-4">
      <Logo size={28} withWordmark />

      {title && (
        <span className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold tracking-tight">
          {title}
        </span>
      )}

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          aria-label="Alternar tema"
        >
          <HugeiconsIcon
            icon={resolvedTheme === 'dark' ? Sun01Icon : Moon02Icon}
            strokeWidth={1.5}
            className="size-4"
          />
        </Button>
        <UserMenu />
      </div>
    </header>
  )
}
