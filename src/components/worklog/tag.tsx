import { cn } from '@/lib/utils'

export interface TagProps {
  children: React.ReactNode
  /**
   * Hex color (e.g. `#0ea5e9`) used to derive fg, bg and border tints.
   * Defaults to the WorkLog primary (sky-500).
   */
  color?: string
  className?: string
}

export function Tag({ children, color = '#0ea5e9', className }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[3px] px-2 py-[2px] font-medium',
        className,
      )}
      style={{
        fontSize: 11,
        background: `${color}18`,
        color,
        border: `1px solid ${color}28`,
        lineHeight: 1.4,
      }}
    >
      {children}
    </span>
  )
}
