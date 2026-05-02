'use client'

import { DonutChart } from '@/components/worklog'
import { STATUS_META } from '@/lib/worklog-meta'
import type { UiWritableStatus } from '@/lib/ticket-status'

export interface StatusCount {
  status: UiWritableStatus
  count: number
}

export interface StatusDonutProps {
  data: StatusCount[]
  loading?: boolean
}

export function StatusDonut({ data, loading }: StatusDonutProps) {
  const total = data.reduce((s, d) => s + d.count, 0)

  const slices = data.map((d) => ({
    label: STATUS_META[d.status].label,
    value: d.count,
    color: STATUS_META[d.status].color,
  }))

  return (
    <div
      className="flex flex-col gap-4 rounded-xl p-4"
      style={{ background: 'var(--wl-surface)' }}
    >
      <span
        className="text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: 'var(--wl-text-muted)' }}
      >
        Distribuição por status
      </span>

      <div className="flex items-center gap-6">
        <DonutChart
          data={loading ? [] : slices}
          size={120}
          strokeWidth={12}
          centerLabel={
            <span
              className="text-[20px] font-bold tabular-nums"
              style={{ color: 'var(--wl-text)' }}
            >
              {loading ? '—' : total}
            </span>
          }
        />

        <div className="flex flex-1 flex-col gap-2">
          {data.map((d) => {
            const meta = STATUS_META[d.status]
            const pct = total > 0 ? Math.round((d.count / total) * 100) : 0
            return (
              <div
                key={d.status}
                className="flex items-center justify-between text-[12px]"
              >
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: meta.color,
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ color: 'var(--wl-text)' }}>{meta.label}</span>
                </div>
                <div className="flex items-center gap-2 tabular-nums">
                  <span style={{ color: 'var(--wl-text)' }}>
                    {loading ? '—' : d.count}
                  </span>
                  <span
                    style={{
                      color: 'var(--wl-text-muted)',
                      minWidth: 32,
                      textAlign: 'right',
                    }}
                  >
                    {loading ? '' : `${pct}%`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
