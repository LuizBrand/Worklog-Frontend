export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'AWAITING_DEV'
  | 'RESOLVED'
  | 'CANCELLED'

export type TicketPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export type LogField =
  | 'STATUS'
  | 'NOTE'
  | 'DESCRIPTION'
  | 'ASSIGNEE'
  | 'PRIORITY'
  | 'TITLE'

export const STATUS_META: Record<
  TicketStatus,
  {
    label: string
    icon: string
    color: string
    background: string
  }
> = {
  OPEN: {
    label: 'Aberto',
    icon: '○',
    color: 'var(--status-open)',
    background: 'var(--status-open-bg)',
  },
  IN_PROGRESS: {
    label: 'Em andamento',
    icon: '◑',
    color: 'var(--status-progress)',
    background: 'var(--status-progress-bg)',
  },
  AWAITING_DEV: {
    label: 'Aguard. dev',
    icon: '◷',
    color: 'var(--status-awaiting)',
    background: 'var(--status-awaiting-bg)',
  },
  RESOLVED: {
    label: 'Resolvido',
    icon: '●',
    color: 'var(--status-resolved)',
    background: 'var(--status-resolved-bg)',
  },
  CANCELLED: {
    label: 'Cancelado',
    icon: '✕',
    color: 'var(--status-cancelled)',
    background: 'var(--status-cancelled-bg)',
  },
}

export const STATUS_ORDER: TicketStatus[] = [
  'OPEN',
  'IN_PROGRESS',
  'AWAITING_DEV',
  'RESOLVED',
  'CANCELLED',
]

export const PRIORITY_META: Record<
  TicketPriority,
  { label: string; color: string }
> = {
  CRITICAL: { label: 'Crítico', color: 'var(--priority-critical)' },
  HIGH: { label: 'Alto', color: 'var(--priority-high)' },
  MEDIUM: { label: 'Médio', color: 'var(--priority-medium)' },
  LOW: { label: 'Baixo', color: 'var(--priority-low)' },
}

export const PRIORITY_ORDER: TicketPriority[] = [
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
]

const AVATAR_COLORS = [
  '#3a6d99',
  '#7a5faa',
  '#c97a1a',
  '#4a8c5c',
  '#c0443a',
] as const

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0 || parts[0].length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function avatarColor(seed: string): string {
  if (!seed) return AVATAR_COLORS[0]
  return AVATAR_COLORS[seed.charCodeAt(0) % AVATAR_COLORS.length]
}

const DATE_TIME_FMT = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

const DATE_FMT = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return DATE_TIME_FMT.format(d).replace(',', ' ·')
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return DATE_FMT.format(d)
}

export function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const diff = Date.now() - d.getTime()
  const min = Math.round(diff / 60_000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}m atrás`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h atrás`
  const day = Math.round(hr / 24)
  if (day < 7) return `${day}d atrás`
  return fmtDate(iso)
}
