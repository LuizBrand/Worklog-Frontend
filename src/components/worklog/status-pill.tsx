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
          background: active ? 'color-mix(in oklab, var(--wl-success) 14%, transparent)' : 'color-mix(in oklab, var(--wl-danger) 14%, transparent)',
          color: active ? 'var(--wl-success)' : 'var(--wl-danger)',
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
      style={{ color: active ? 'var(--wl-success)' : 'var(--wl-danger)' }}
    >
      {active ? 'Ativo' : 'Inativo'}
    </span>
  )
}
