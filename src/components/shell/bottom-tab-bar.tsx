'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'

import { cn } from '@/lib/utils'
import { NAV_ITEMS } from './nav-config'

const MOBILE_TABS = NAV_ITEMS.filter((item) => !item.desktopOnly)

export function BottomTabBar() {
  const pathname = usePathname()

  return (
    <nav className="flex h-[82px] flex-shrink-0 items-start border-t border-border bg-card pt-2 pb-safe">
      {MOBILE_TABS.map((item) => {
        const active = pathname.startsWith(item.href)
        return (
          <Link
            key={item.id}
            href={item.href}
            className="flex flex-1 flex-col items-center gap-1 py-1"
          >
            <HugeiconsIcon
              icon={item.icon}
              strokeWidth={active ? 2 : 1.5}
              className={cn(
                'size-5 transition-colors',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            />
            <span
              className={cn(
                'text-[10px] font-medium leading-none transition-colors',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
