'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Sun, Moon, PanelLeftClose, PanelLeftOpen } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useAuthStore } from '@/state/auth'
import { Logo } from '@/components/worklog/logo'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { NAV_ITEMS } from './nav-config'
import { UserMenu } from './user-menu'

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const user = useAuthStore((s) => s.user)

  const isAdmin = user?.roles?.some((r) => r.role === 'ADMIN') ?? false

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin,
  ).filter((item) => !item.desktopOnly || true)

  return (
    <nav
      className={cn(
        'flex h-full flex-shrink-0 flex-col border-r transition-[width] duration-200',
        collapsed ? 'w-[52px]' : 'w-[200px]',
      )}
      style={{
        background: 'var(--wl-surface)',
        borderColor: 'var(--wl-border)',
      }}
    >
      {/* Logo + collapse */}
      <div
        className={cn(
          'flex h-[52px] flex-shrink-0 items-center border-b border-[var(--wl-border)]',
          collapsed ? 'justify-center px-0' : 'justify-between px-3',
        )}
      >
        {!collapsed && <Logo size={28} withWordmark />}
        {collapsed && <Logo size={28} />}
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCollapsed(true)}
            aria-label="Recolher menu"
          >
            <PanelLeftClose strokeWidth={1.5} className="size-4" />
          </Button>
        )}
      </div>

      {/* Nav items */}
      <div className={cn('flex-1 overflow-y-auto py-2', collapsed ? 'px-1.5' : 'px-2')}>
        {collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="mb-1 w-full"
            onClick={() => setCollapsed(false)}
            aria-label="Expandir menu"
          >
            <PanelLeftOpen strokeWidth={1.5} className="size-4" />
          </Button>
        )}
        {visibleItems.map((item) => {
          const active = pathname.startsWith(item.href)
          const Icon = item.icon
          const btn = (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors',
                collapsed && 'justify-center px-0',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-[var(--wl-surface-2)] hover:text-foreground',
              )}
            >
              <Icon
                strokeWidth={active ? 2 : 1.5}
                className="size-[18px] flex-shrink-0"
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )

          if (!collapsed) return btn
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>{btn}</TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          )
        })}
      </div>

      {/* Theme + user */}
      <div
        className={cn(
          'flex flex-shrink-0 flex-col gap-1 border-t border-[var(--wl-border)] py-2',
          collapsed ? 'px-1.5' : 'px-2',
        )}
      >
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'sm'}
          className={cn('w-full', !collapsed && 'justify-start gap-3')}
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          aria-label="Alternar tema"
        >
          {resolvedTheme === 'dark'
            ? <Sun strokeWidth={1.5} className="size-[18px]" />
            : <Moon strokeWidth={1.5} className="size-[18px]" />}
          {!collapsed && (
            <span className="text-[13px]">
              {resolvedTheme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            </span>
          )}
        </Button>

        <div
          className={cn(
            'flex items-center',
            collapsed ? 'justify-center' : 'gap-2 px-1 py-1',
          )}
        >
          <UserMenu />
          {!collapsed && user && (
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold leading-none">
                {user.name?.split(' ')[0]}
              </p>
              <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                {user.roles?.[0]?.role ?? ''}
              </p>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
