import Link from 'next/link'

const SHORTCUTS: { key: string; label: string; href?: string }[] = [
  { key: 'C', label: 'Criar ticket', href: '/tickets' },
  { key: '/', label: 'Buscar tickets', href: '/tickets' },
  { key: 'Esc', label: 'Fechar painel' },
]

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
        Atalhos
      </span>

      <div className="flex flex-col gap-2">
        {SHORTCUTS.map(({ key, label, href }) => {
          const inner = (
            <div className="flex items-center gap-3">
              <kbd
                className="min-w-[28px] rounded px-1.5 py-0.5 text-center text-[11px] font-semibold"
                style={{
                  background: 'var(--wl-surface-2)',
                  color: 'var(--wl-text)',
                  border: '1px solid var(--wl-border)',
                }}
              >
                {key}
              </kbd>
              <span className="text-[13px]" style={{ color: 'var(--wl-text-muted)' }}>
                {label}
              </span>
            </div>
          )

          return href ? (
            <Link key={key} href={href} className="transition-opacity hover:opacity-80">
              {inner}
            </Link>
          ) : (
            <div key={key}>{inner}</div>
          )
        })}
      </div>
    </div>
  )
}
