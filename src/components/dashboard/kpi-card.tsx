import { STATUS_META } from '@/lib/worklog-meta'
import type { UiWritableStatus } from '@/lib/ticket-status'

export interface KpiCardProps {
  status: UiWritableStatus
  count: number | undefined
  loading?: boolean
}

export function KpiCard({ status, count, loading }: KpiCardProps) {
  const meta = STATUS_META[status]
  return (
    <div
      className="flex flex-col gap-3 rounded-xl p-4"
      style={{ background: 'var(--wl-surface-1)' }}
    >
      <span
        className="text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: 'var(--wl-text-muted)' }}
      >
        {meta.label}
      </span>
      <div className="flex items-end gap-2">
        <span
          className="text-[36px] font-bold leading-none tabular-nums"
          style={{ color: loading ? 'var(--wl-text-muted)' : meta.color }}
        >
          {loading ? '—' : (count ?? 0)}
        </span>
        <span
          aria-hidden
          style={{ fontSize: 20, color: meta.color, lineHeight: 1, paddingBottom: 3 }}
        >
          {meta.icon}
        </span>
      </div>
    </div>
  )
}
