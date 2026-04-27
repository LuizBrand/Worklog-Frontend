import { PRIORITY_META, type TicketPriority } from '@/lib/worklog-meta'
import { cn } from '@/lib/utils'

export interface PriorityDotProps {
  priority: TicketPriority
  hideLabel?: boolean
  className?: string
}

export function PriorityDot({
  priority,
  hideLabel = false,
  className,
}: PriorityDotProps) {
  const meta = PRIORITY_META[priority]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-[5px] whitespace-nowrap',
        className,
      )}
      style={{ color: meta.color, fontSize: 11, fontWeight: 600 }}
    >
      <span
        aria-hidden
        className="inline-block rounded-full"
        style={{ width: 6, height: 6, background: meta.color }}
      />
      {!hideLabel && meta.label}
    </span>
  )
}
