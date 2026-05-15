export interface StatusPillProps {
  active: boolean
  variant?: 'text' | 'badge'
  className?: string
}

export function StatusPill({ active, variant = 'text', className }: StatusPillProps) {
  if (variant === 'badge') {
    return (
      <span
        className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${className ?? ''}`}
        style={{
          background: active ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
          color: active ? '#22c55e' : '#ef4444',
        }}
        title={active ? 'Ativo' : 'Inativo'}
      >
        {active ? 'Ativo' : 'Inativo'}
      </span>
    )
  }
  return (
    <span
      className={`inline-flex items-center text-[11px] font-medium ${className ?? ''}`}
      style={{ color: active ? '#22c55e' : '#ef4444' }}
    >
      {active ? 'Ativo' : 'Inativo'}
    </span>
  )
}
