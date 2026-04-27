import { avatarColor, getInitials } from '@/lib/worklog-meta'
import { cn } from '@/lib/utils'

export interface WlAvatarProps {
  name: string
  size?: number
  className?: string
}

export function WlAvatar({ name, size = 28, className }: WlAvatarProps) {
  const initials = getInitials(name)
  const bg = avatarColor(initials)

  return (
    <span
      className={cn(
        'inline-flex select-none items-center justify-center rounded-full font-semibold text-white',
        className,
      )}
      style={{
        width: size,
        height: size,
        background: bg,
        fontSize: Math.round(size * 0.38),
        letterSpacing: '0.02em',
      }}
      aria-label={name}
    >
      {initials}
    </span>
  )
}
