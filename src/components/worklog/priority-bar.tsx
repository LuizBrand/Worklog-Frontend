'use client'

import { useEffect, useState } from 'react'

import { PRIORITY_META, type TicketPriority } from '@/lib/worklog-meta'

export interface PriorityBarProps {
  priority: TicketPriority
  value: number
  total: number
  className?: string
}

export function PriorityBar({
  priority,
  value,
  total,
  className,
}: PriorityBarProps) {
  const meta = PRIORITY_META[priority]
  const target = total > 0 ? (value / total) * 100 : 0
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setWidth(target))
    return () => window.cancelAnimationFrame(id)
  }, [target])

  return (
    <div className={className}>
      <div
        className="flex items-center justify-between"
        style={{ fontSize: 11, fontWeight: 600, color: meta.color }}
      >
        <span>{meta.label}</span>
        <span style={{ color: 'var(--wl-text-muted)' }}>{value}</span>
      </div>
      <div
        className="mt-1 h-[6px] w-full overflow-hidden rounded-full"
        style={{ background: 'var(--wl-surface-2)' }}
      >
        <div
          style={{
            width: `${width}%`,
            height: '100%',
            background: meta.color,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
    </div>
  )
}
