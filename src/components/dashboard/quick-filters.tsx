import Link from 'next/link'

export function QuickFilters() {
  return (
    <div
      className="flex flex-col gap-3 rounded-xl p-4"
      style={{ background: 'var(--wl-surface)' }}
    >
      <span
        className="text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: 'var(--wl-text-muted)' }}
      >
        Filtros rápidos
      </span>

      <div className="flex flex-col gap-2">
        <Link
          href="/tickets?priority=CRITICAL"
          className="rounded-lg px-3 py-2 text-[13px] font-medium transition-opacity hover:opacity-80"
          style={{
            color: 'var(--priority-critical)',
            background:
              'color-mix(in oklch, var(--priority-critical) 12%, transparent)',
            border:
              '1px solid color-mix(in oklch, var(--priority-critical) 25%, transparent)',
          }}
        >
          Crítico
        </Link>
        <Link
          href="/tickets?priority=LOW"
          className="rounded-lg px-3 py-2 text-[13px] font-medium transition-opacity hover:opacity-80"
          style={{
            color: 'var(--priority-low)',
            background:
              'color-mix(in oklch, var(--priority-low) 12%, transparent)',
            border:
              '1px solid color-mix(in oklch, var(--priority-low) 25%, transparent)',
          }}
        >
          Baixo
        </Link>
        <Link
          href="/tickets"
          className="rounded-lg px-3 py-2 text-[13px] font-medium transition-opacity hover:opacity-80"
          style={{
            color: 'var(--primary)',
            background:
              'color-mix(in oklch, var(--primary) 10%, transparent)',
            border:
              '1px solid color-mix(in oklch, var(--primary) 25%, transparent)',
          }}
        >
          + Novo ticket
        </Link>
      </div>
    </div>
  )
}
