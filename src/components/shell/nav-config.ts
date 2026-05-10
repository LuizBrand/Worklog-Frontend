import type { LucideIcon } from 'lucide-react'
import { Home, Ticket, Building2, Layers, UserCog, CircleUser } from 'lucide-react'

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
  { id: 'clientes',  label: 'Clientes',  href: '/clientes',  icon: Building2 },
  { id: 'sistemas',  label: 'Sistemas',  href: '/sistemas',  icon: Layers },
  {
    id: 'usuarios',
    label: 'Usuários',
    href: '/usuarios',
    icon: UserCog,
    adminOnly: true,
    desktopOnly: true,
  },
  { id: 'perfil',    label: 'Perfil',    href: '/perfil',    icon: CircleUser },
]
