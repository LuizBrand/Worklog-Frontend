'use client'

import { useRouter } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import { Logout01Icon, User02Icon } from '@hugeicons/core-free-icons'

import { useLogout } from '@/api/generated/autenticação/autenticação'
import { useAuthStore } from '@/state/auth'
import { WlAvatar } from '@/components/worklog/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

export function UserMenu() {
  const router = useRouter()
  const { user, refreshToken, clear } = useAuthStore()

  const { mutate: logoutMutate } = useLogout({
    mutation: {
      onSettled() {
        clear()
        router.replace('/login')
      },
    },
  })

  function handleLogout() {
    if (refreshToken) {
      logoutMutate({ data: { refreshToken } })
    } else {
      clear()
      router.replace('/login')
    }
  }

  const displayName = user?.name ?? 'Usuário'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <WlAvatar name={displayName} size={26} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold">{displayName}</span>
          {user?.email && (
            <span className="text-[10px] font-normal text-muted-foreground">
              {user.email}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/perfil')}>
          <HugeiconsIcon icon={User02Icon} strokeWidth={1.5} className="size-3.5" />
          Minha conta
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive"
        >
          <HugeiconsIcon icon={Logout01Icon} strokeWidth={1.5} className="size-3.5" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
