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
        Distribuição de status
      </span>

      <div className="flex justify-center">
        <DonutChart
          data={loading ? [] : slices}
          size={160}
          strokeWidth={18}
          centerLabel={
            <div className="flex flex-col items-center gap-0.5">
              <span
                className="text-[28px] font-bold tabular-nums leading-none"
                style={{ color: 'var(--wl-text)' }}
              >
                {loading ? '—' : total}
              </span>
              <span
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: 'var(--wl-text-muted)' }}
              >
                total
              </span>
            </div>
          }
        />
      </div>

      {/* 2-column legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {data.map((d) => {
          const meta = STATUS_META[d.status]
          return (
            <div key={d.status} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
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
                <span
                  className="truncate text-[12px]"
                  style={{ color: 'var(--wl-text)' }}
                >
                  {meta.label}
                </span>
              </div>
              <span
                className="shrink-0 text-[12px] font-semibold tabular-nums"
                style={{ color: 'var(--wl-text)' }}
              >
                {loading ? '—' : d.count}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
