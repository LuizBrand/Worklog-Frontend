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
      <span aria-hidden style={{ fontSize: size === 'sm' ? 10 : 11 }}>
        {meta.icon}
      </span>
      {meta.label}
    </span>
  )
}
