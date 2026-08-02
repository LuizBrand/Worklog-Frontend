import { CLIENT_TYPE_LABEL, type ClientType } from '@/api/clients-contract'

const TONE: Record<ClientType, string> = {
  PJ: 'var(--primary)',
  PF: 'var(--status-open)',
}

export interface TipoBadgeProps {
  tipo: ClientType
  className?: string
}

export function TipoBadge({ tipo, className }: TipoBadgeProps) {
  const color = TONE[tipo]
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${className ?? ''}`}
      style={{ color, background: `color-mix(in oklab, ${color} 16%, transparent)` }}
      title={CLIENT_TYPE_LABEL[tipo]}
    >
      {tipo}
    </span>
  )
}
