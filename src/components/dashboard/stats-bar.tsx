'use client'

import { Fragment } from 'react'

import { STATUS_META } from '@/lib/worklog-meta'
import type { StatusCount } from '@/components/dashboard/status-donut'

export interface StatsBarProps {
  statusCounts: StatusCount[]
  loading?: boolean
}

function ChipContent({
  status,
  count,
  loading,
}: StatusCount & { loading?: boolean }) {
  const meta = STATUS_META[status]
  return (
    <>
      <span
        className="text-[15px] font-bold tabular-nums"
        style={{ color: meta.color }}
      >
        {loading ? '—' : count}
      </span>
      <span className="text-[13px]" style={{ color: 'var(--wl-text)' }}>
        {meta.label}
      </span>
      <span className="text-[13px]" style={{ color: meta.color }}>
        {meta.icon}
      </span>
    </>
  )
}

export function StatsBar({ statusCounts, loading }: StatsBarProps) {
  return (
    <>
      {/* Mobile: 2×2 grid of individual chips */}
      <div className="grid grid-cols-2 gap-2 sm:hidden">
        {statusCounts.map(({ status, count }) => (
          <div
            key={status}
            className="flex items-center gap-1.5 rounded-xl px-4 py-3"
            style={{ background: 'var(--wl-surface)' }}
          >
            <ChipContent status={status} count={count} loading={loading} />
          </div>
        ))}
      </div>

      {/* Desktop: single inline bar, width fits content */}
      <div
        className="hidden sm:flex sm:w-fit sm:items-center sm:rounded-xl sm:px-5 sm:py-3"
        style={{ background: 'var(--wl-surface)' }}
      >
        {statusCounts.map(({ status, count }, i) => (
          <Fragment key={status}>
            {i > 0 && (
              <span
                className="mx-4 select-none text-[18px]"
                style={{ color: 'var(--wl-border)' }}
              >
                |
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <ChipContent status={status} count={count} loading={loading} />
            </div>
          </Fragment>
        ))}
      </div>
    </>
  )
}
