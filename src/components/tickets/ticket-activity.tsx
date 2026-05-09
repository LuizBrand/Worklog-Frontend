import { RefreshCw, AlignLeft, MessageSquare, Type, User, Circle } from 'lucide-react'

import { WlAvatar, StatusChip } from '@/components/worklog'
import { apiToUiStatus } from '@/lib/ticket-status'
import { fmtDateTime } from '@/lib/worklog-meta'
import type { TicketLogResponse } from '@/api/generated/schemas'
import type { ApiTicketStatus } from '@/lib/ticket-status'

const FIELD_LABEL: Record<string, string> = {
  status: 'Status',
  description: 'Descrição',
  solution: 'Nota',
  title: 'Título',
  user: 'Responsável',
  completedAt: 'Concluído em',
}

const FIELD_ICON: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  status: RefreshCw,
  description: AlignLeft,
  solution: MessageSquare,
  title: Type,
  user: User,
}

function logFieldLabel(fieldChanged: string | undefined): string {
  if (!fieldChanged) return 'campo'
  return FIELD_LABEL[fieldChanged] ?? fieldChanged
}

function TimelineIcon({ fieldChanged }: { fieldChanged: string | undefined }) {
  const Icon = (fieldChanged && FIELD_ICON[fieldChanged]) ? FIELD_ICON[fieldChanged] : Circle
  return (
    <div
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
      style={{ background: 'var(--wl-surface-2)', border: '1px solid var(--wl-border)' }}
    >
      <Icon size={11} strokeWidth={2} style={{ color: 'var(--wl-text-muted)' }} />
    </div>
  )
}

function LogContent({ log }: { log: TicketLogResponse }) {
  const { fieldChanged, oldValue, newValue } = log

  if (fieldChanged === 'status') {
    const oldUi = oldValue ? apiToUiStatus(oldValue as ApiTicketStatus) : null
    const newUi = newValue ? apiToUiStatus(newValue as ApiTicketStatus) : null
    return (
      <div className="mt-2 flex items-center gap-2">
        {oldUi && <StatusChip status={oldUi} size="sm" />}
        <span className="text-[11px]" style={{ color: 'var(--wl-text-dim)' }}>→</span>
        {newUi && <StatusChip status={newUi} size="sm" />}
      </div>
    )
  }

  if (fieldChanged === 'description' && (oldValue || newValue)) {
    return (
      <div className="mt-2 space-y-1 text-[12px] font-mono">
        {oldValue && (
          <div
            className="rounded px-2.5 py-1.5 leading-relaxed line-through"
            style={{ background: 'rgba(220,38,38,0.07)', color: '#ef4444', borderLeft: '2px solid #ef444460' }}
          >
            − {oldValue}
          </div>
        )}
        {newValue && (
          <div
            className="rounded px-2.5 py-1.5 leading-relaxed"
            style={{ background: 'rgba(34,197,94,0.07)', color: '#16a34a', borderLeft: '2px solid #16a34a60' }}
          >
            + {newValue}
          </div>
        )}
      </div>
    )
  }

  if (newValue) {
    return (
      <p
        className="mt-2 rounded px-2.5 py-1.5 text-[13px] leading-relaxed"
        style={{
          background: 'var(--wl-surface-2)',
          color: 'var(--wl-text)',
          borderLeft: '2px solid var(--wl-border-2)',
        }}
      >
        {newValue}
      </p>
    )
  }

  return null
}

export interface TicketActivityProps {
  logs: TicketLogResponse[]
}

export function TicketActivity({ logs }: TicketActivityProps) {
  if (logs.length === 0) {
    return (
      <p className="py-4 text-center text-[13px]" style={{ color: 'var(--wl-text-muted)' }}>
        Sem histórico de alterações.
      </p>
    )
  }

  return (
    <div className="space-y-0">
      {logs.map((log, idx) => {
        const userName = log.user?.name ?? 'Sistema'
        const label = logFieldLabel(log.fieldChanged)
        const isLast = idx === logs.length - 1

        return (
          <div key={`${log.changeGroupId}-${log.fieldChanged}-${idx}`} className="flex gap-3">
            {/* Timeline spine */}
            <div className="flex flex-col items-center">
              <TimelineIcon fieldChanged={log.fieldChanged} />
              {!isLast && (
                <div
                  className="my-1 flex-1 w-px min-h-[20px]"
                  style={{ background: 'var(--wl-border)' }}
                />
              )}
            </div>

            {/* Entry content */}
            <div className={`min-w-0 flex-1 ${isLast ? 'pb-0' : 'pb-4'}`}>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <WlAvatar name={userName} size={16} />
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--wl-text)' }}>
                    {userName}
                  </span>
                </div>
                <span className="text-[12px]" style={{ color: 'var(--wl-text-muted)' }}>
                  alterou <span className="font-semibold" style={{ color: 'var(--wl-text)' }}>{label}</span>
                </span>
                <span
                  className="ml-auto text-[11px] tabular-nums shrink-0"
                  style={{ color: 'var(--wl-text-dim)' }}
                >
                  {fmtDateTime(log.changeDate)}
                </span>
              </div>
              <LogContent log={log} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
