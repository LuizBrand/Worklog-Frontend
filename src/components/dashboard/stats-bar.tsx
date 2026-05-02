'use client'

import { STATUS_META } from '@/lib/worklog-meta'
import type { StatusCount } from '@/components/dashboard/status-donut'

export interface StatsBarProps {
  statusCounts: StatusCount[]
  loading?: boolean
}

export function StatsBar({ statusCounts, loading }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {statusCounts.map(({ status, count }) => {
        const meta = STATUS_META[status]
        return (
          <div
            key={status}
            className="flex flex-col rounded-xl px-4 py-3"
            style={{ background: meta.background }}
          >
            <span
              className="text-[22px] font-bold tabular-nums leading-none"
              style={{ color: meta.color }}
            >
              {loading ? '—' : count}
            </span>
            <span
              className="mt-1 text-[11px] font-medium"
              style={{ color: meta.color }}
            >
              {meta.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
