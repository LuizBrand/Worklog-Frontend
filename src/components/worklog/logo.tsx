import { cn } from '@/lib/utils'

export interface LogoProps {
  size?: number
  withWordmark?: boolean
  className?: string
}

export function Logo({ size = 28, withWordmark = false, className }: LogoProps) {
  const radius = Math.round(size * 0.27)
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        aria-hidden
        className="inline-flex flex-shrink-0 items-center justify-center font-bold text-white"
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          background: 'var(--primary)',
          fontSize: Math.round(size * 0.5),
          letterSpacing: '-0.04em',
          fontFamily: 'var(--font-sans)',
          lineHeight: 1,
        }}
      >
        W
      </span>
      {withWordmark && (
        <span
          className="font-bold tracking-[-0.04em]"
          style={{
            fontSize: Math.round(size * 0.6),
            lineHeight: `${size}px`,
            color: 'var(--wl-text)',
          }}
        >
          WorkLog
        </span>
      )}
    </span>
  )
}
