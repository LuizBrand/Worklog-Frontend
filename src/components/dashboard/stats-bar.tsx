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
        className="text-[13px] font-bold tabular-nums"
        style={{ color: meta.color, lineHeight: '16px' }}
      >
        {loading ? '—' : count}
      </span>
      <span
        className="text-[12px]"
        style={{ color: 'var(--wl-text)', lineHeight: '16px' }}
      >
        {meta.label}
      </span>
      <span
        className="flex items-center justify-center"
        style={{
          border: `1px solid ${meta.color}55`,
          borderRadius: 3,
          width: 16,
          height: 16,
          color: meta.color,
          flexShrink: 0,
        }}
      >
        <meta.icon strokeWidth={2} style={{ width: 10, height: 10 }} />
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
            style={{ background: 'var(--wl-surface)', border: '1px solid var(--wl-border)' }}
          >
            <ChipContent status={status} count={count} loading={loading} />
          </div>
        ))}
      </div>

      {/* Desktop: single inline bar, width fits content */}
      <div
        className="hidden sm:flex sm:w-fit sm:items-center sm:rounded-xl sm:px-4 sm:py-1.5"
        style={{ background: 'var(--wl-surface)', border: '1px solid var(--wl-border)' }}
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
