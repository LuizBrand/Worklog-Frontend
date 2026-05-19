'use client'
import Link from 'next/link'
import { Plus } from 'lucide-react'

const fabClass =
  'md:hidden fixed z-30 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full shadow-xl transition-transform active:scale-95'
const fabStyle = {
  background: 'var(--primary)',
  color: '#fff',
  bottom: 'calc(82px + 16px)',
  right: '16px',
} as const

export function MobileFab({ onClick, href }: { onClick?: () => void; href?: string }) {
  if (href) {
    return (
      <Link href={href} aria-label="Criar novo" className={fabClass} style={fabStyle}>
        <Plus size={24} />
      </Link>
    )
  }
  return (
    <button onClick={onClick} aria-label="Criar novo" className={fabClass} style={fabStyle}>
      <Plus size={24} />
    </button>
  )
}
