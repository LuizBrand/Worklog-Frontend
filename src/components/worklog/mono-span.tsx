import { cn } from '@/lib/utils'

export interface MonoSpanProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
}

export function MonoSpan({ children, className, ...props }: MonoSpanProps) {
  return (
    <span
      className={cn('font-mono text-[11px] tracking-tight', className)}
      style={{ color: 'var(--wl-text-muted)' }}
      {...props}
    >
      {children}
    </span>
  )
}
