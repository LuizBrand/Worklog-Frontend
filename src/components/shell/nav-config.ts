import type { IconSvgElement } from '@hugeicons/react'
import {
  Home01Icon,
  Ticket01Icon,
  UserGroupIcon,
  Layers01Icon,
  User02Icon,
  UserMultipleIcon,
} from '@hugeicons/core-free-icons'

export type NavItem = {
  id: string
  label: string
  href: string
  icon: IconSvgElement
  adminOnly?: boolean
  desktopOnly?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Início',    href: '/dashboard', icon: Home01Icon },
  { id: 'tickets',   label: 'Tickets',   href: '/tickets',   icon: Ticket01Icon },
  { id: 'clientes',  label: 'Clientes',  href: '/clientes',  icon: UserGroupIcon },
  { id: 'sistemas',  label: 'Sistemas',  href: '/sistemas',  icon: Layers01Icon },
  { id: 'perfil',    label: 'Perfil',    href: '/perfil',    icon: User02Icon },
  {
    id: 'usuarios',
    label: 'Usuários',
    href: '/usuarios',
    icon: UserMultipleIcon,
    adminOnly: true,
    desktopOnly: true,
  },
]
