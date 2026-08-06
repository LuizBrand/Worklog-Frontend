export interface DevChipProps {
  label?: string
  className?: string
}

/** Marca uma coluna/card cujo módulo ainda não existe. Não faz chamada nenhuma. */
export function DevChip({ label = 'Em desenvolvimento', className }: DevChipProps) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${className ?? ''}`}
      style={{
        background: 'var(--wl-surface-2)',
        border: '1px solid var(--wl-border)',
        // `--wl-text-dim` sumia dentro da tabela, que já é `--wl-surface`:
        // o chip virava um borrão. Continua discreto, mas legível.
        color: 'var(--wl-text-muted)',
      }}
    >
      {label}
    </span>
  )
}
