import { cn } from '@/lib/utils'

export type StatTone = 'default' | 'warn' | 'danger'

export interface StatCellProps {
  value: number | string
  label: string
  tone?: StatTone
  className?: string
}

const TONE_COLOR: Record<StatTone, string> = {
  default: 'var(--wl-text)',
  warn: 'var(--status-open)',
  danger: 'var(--priority-critical)',
}

export function StatCell({ value, label, tone = 'default', className }: StatCellProps) {
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <span
        className="text-[18px] font-semibold leading-none tabular-nums"
        style={{ color: TONE_COLOR[tone] }}
      >
        {value}
      </span>
      <span
        className="text-[10px] font-semibold uppercase tracking-wide"
        style={{ color: 'var(--wl-text-muted)' }}
      >
        {label}
      </span>
    </div>
  )
}
