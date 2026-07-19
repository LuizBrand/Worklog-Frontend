import { cn } from '@/lib/utils'

export interface TagProps {
  children: React.ReactNode
  /**
   * Qualquer cor CSS — hex ou `var(--token)`. Usada para derivar texto,
   * fundo e borda. Default: o indigo da marca.
   */
  color?: string
  className?: string
}

export function Tag({ children, color = 'var(--primary)', className }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[3px] px-2 py-[2px] font-medium',
        className,
      )}
      style={{
        fontSize: 11,
        background: `color-mix(in oklab, ${color} 10%, transparent)`,
        color,
        border: `1px solid color-mix(in oklab, ${color} 16%, transparent)`,
        lineHeight: 1.4,
      }}
    >
      {children}
    </span>
  )
}
