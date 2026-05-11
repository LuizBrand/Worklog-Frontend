import { PriorityBar } from '@/components/worklog'
import { PRIORITY_ORDER, type TicketPriority } from '@/lib/worklog-meta'

export interface PriorityDistributionProps {
  data: { priority: TicketPriority; count: number }[]
}

export function PriorityDistribution({ data }: PriorityDistributionProps) {
  const counts = new Map(data.map(({ priority, count }) => [priority, count]))
  const total = data.reduce((sum, { count }) => sum + count, 0)

  return (
    <div
      className="flex flex-col gap-2.5 rounded-xl p-4"
      style={{ background: 'var(--wl-surface)', border: '1px solid var(--wl-border)' }}
    >
      <span
        className="text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: 'var(--wl-text-muted)' }}
      >
        Por prioridade (abertos)
      </span>

      <div className="flex flex-col gap-2">
        {PRIORITY_ORDER.map((p) => (
          <PriorityBar key={p} priority={p} value={counts.get(p) ?? 0} total={total} />
        ))}
      </div>
    </div>
  )
}
