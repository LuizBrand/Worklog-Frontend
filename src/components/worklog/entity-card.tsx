import { cn } from '@/lib/utils'

export interface EntityCardProps {
  inactive?: boolean
  selected?: boolean
  onClick?: () => void
  className?: string
  children: React.ReactNode
}

export function EntityCard({
  inactive,
  selected,
  onClick,
  className,
  children,
}: EntityCardProps) {
  const interactive = !!onClick
  return (
    <div
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
      className={cn(
        'group relative flex flex-col rounded-xl transition-colors',
        interactive && 'cursor-pointer hover:bg-[var(--wl-surface-2)]',
        className,
      )}
      style={{
        background: 'var(--wl-surface)',
        border: `1px solid ${selected ? 'var(--primary)' : 'var(--wl-border)'}`,
        opacity: inactive ? 0.55 : 1,
      }}
    >
      {children}
    </div>
  )
}
