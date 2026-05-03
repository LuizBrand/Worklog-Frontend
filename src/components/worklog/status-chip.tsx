import { STATUS_META, type TicketStatus } from '@/lib/worklog-meta'
import { cn } from '@/lib/utils'

export interface StatusChipProps {
  status: TicketStatus
  size?: 'sm' | 'md'
  className?: string
}

export function StatusChip({ status, size = 'md', className }: StatusChipProps) {
  const meta = STATUS_META[status]
  const padding = size === 'sm' ? '2px 7px' : '3px 9px'
  const fontSize = size === 'sm' ? 11 : 12

  return (
    <span
      className={cn(
        'inline-flex items-center gap-[5px] whitespace-nowrap rounded-[5px] font-medium',
        className,
      )}
      style={{
        background: meta.background,
        color: meta.color,
        border: `1px solid ${meta.color}22`,
        padding,
        fontSize,
        lineHeight: 1,
      }}
    >
      <meta.icon
        aria-hidden
        strokeWidth={2}
        style={{ width: size === 'sm' ? 10 : 11, height: size === 'sm' ? 10 : 11, flexShrink: 0 }}
      />
      {meta.label}
    </span>
  )
}
