import type { LucideIcon } from 'lucide-react'
import { Home, Ticket, Users, Layers, User, Users2 } from 'lucide-react'

export type NavItem = {
  id: string
  label: string
  href: string
  icon: LucideIcon
  adminOnly?: boolean
  desktopOnly?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Início',    href: '/dashboard', icon: Home },
  { id: 'tickets',   label: 'Tickets',   href: '/tickets',   icon: Ticket },
  { id: 'clientes',  label: 'Clientes',  href: '/clientes',  icon: Users },
  { id: 'sistemas',  label: 'Sistemas',  href: '/sistemas',  icon: Layers },
  { id: 'perfil',    label: 'Perfil',    href: '/perfil',    icon: User },
  {
    id: 'usuarios',
    label: 'Usuários',
    href: '/usuarios',
    icon: Users2,
    adminOnly: true,
    desktopOnly: true,
  },
]
