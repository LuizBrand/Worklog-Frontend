import { PriorityBar } from '@/components/worklog'
import { PRIORITY_ORDER } from '@/lib/worklog-meta'

export function PriorityDistribution() {
  return (
    <div
      className="flex flex-col gap-4 rounded-xl p-4"
      style={{ background: 'var(--wl-surface)' }}
    >
      <span
        className="text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: 'var(--wl-text-muted)' }}
      >
        Por prioridade (abertos)
      </span>

      <div className="flex flex-col gap-3">
        {PRIORITY_ORDER.map((p) => (
          <PriorityBar key={p} priority={p} value={0} total={0} />
        ))}
      </div>

      <p
        className="text-center text-[11px]"
        style={{ color: 'var(--wl-text-muted)' }}
      >
        Prioridade não disponível na API atual.
      </p>
    </div>
  )
}
