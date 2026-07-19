import { cn } from '@/lib/utils'

export interface LogoProps {
  size?: number
  withWordmark?: boolean
  className?: string
}

/**
 * Reprodução fiel de nova-branding/logo/worklog-symbol.svg (viewBox 88).
 *
 * Usa a variante indigo, não a escura dos favicons: sobre o --wl-bg
 * #0b0b10 o quadrado tinta #14161a praticamente desaparece, sobrando só
 * o traço solto. A escura segue canônica para favicon/app icon, onde
 * fica sobre o chrome do browser. Ver memory/brand.md.
 */
export function Logo({ size = 28, withWordmark = false, className }: LogoProps) {
  const radius = Math.round(size * 0.25)
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg
        aria-hidden
        viewBox="0 0 88 88"
        width={size}
        height={size}
        className="flex-shrink-0"
        style={{ borderRadius: radius }}
      >
        <rect width="88" height="88" rx="22" fill="#6366f1" />
        <path
          d="M22 33 L34.5 67 L50.4 40 L58.4 57.5 L66 33"
          fill="none"
          stroke="#ffffff"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="72" cy="27" r="2" fill="#ffffff" />
      </svg>
      {withWordmark && (
        <span
          className="font-heading font-bold tracking-[-0.02em]"
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
