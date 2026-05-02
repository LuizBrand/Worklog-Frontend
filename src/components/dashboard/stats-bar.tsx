'use client'

import { Fragment } from 'react'

import { STATUS_META } from '@/lib/worklog-meta'
import type { StatusCount } from '@/components/dashboard/status-donut'

export interface StatsBarProps {
  statusCounts: StatusCount[]
  loading?: boolean
}

export function StatsBar({ statusCounts, loading }: StatsBarProps) {
  return (
    <div
      className="flex items-center rounded-xl px-5 py-3"
      style={{ background: 'var(--wl-surface)' }}
    >
      {statusCounts.map(({ status, count }, i) => {
        const meta = STATUS_META[status]
        return (
          <Fragment key={status}>
            {i > 0 && (
              <span
                className="mx-4 text-[18px] select-none"
                style={{ color: 'var(--wl-border)' }}
              >
                |
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <span
                className="text-[15px] font-bold tabular-nums"
                style={{ color: meta.color }}
              >
                {loading ? '—' : count}
              </span>
              <span
                className="text-[13px]"
                style={{ color: 'var(--wl-text)' }}
              >
                {meta.label}
              </span>
              <span className="text-[13px]" style={{ color: meta.color }}>
                {meta.icon}
              </span>
            </div>
          </Fragment>
        )
      })}
    </div>
  )
}
