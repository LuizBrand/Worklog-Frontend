import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        className,
      )}
    >
      {icon && (
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{
            background: 'var(--wl-surface-2)',
            color: 'var(--wl-text-muted)',
          }}
        >
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-semibold" style={{ color: 'var(--wl-text)' }}>
          {title}
        </p>
        {description && (
          <p
            className="text-xs leading-relaxed"
            style={{ color: 'var(--wl-text-muted)' }}
          >
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
