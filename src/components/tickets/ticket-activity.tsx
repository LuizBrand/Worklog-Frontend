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

function logFieldLabel(fieldChanged: string | undefined): string {
  if (!fieldChanged) return 'campo'
  return FIELD_LABEL[fieldChanged] ?? fieldChanged
}

function LogContent({ log }: { log: TicketLogResponse }) {
  const { fieldChanged, oldValue, newValue } = log

  if (fieldChanged === 'status') {
    const oldUi = oldValue ? apiToUiStatus(oldValue as ApiTicketStatus) : null
    const newUi = newValue ? apiToUiStatus(newValue as ApiTicketStatus) : null
    return (
      <div className="mt-1.5 flex items-center gap-2">
        {oldUi && <StatusChip status={oldUi} size="sm" />}
        <span className="text-[11px]" style={{ color: 'var(--wl-text-dim)' }}>→</span>
        {newUi && <StatusChip status={newUi} size="sm" />}
      </div>
    )
  }

  if (fieldChanged === 'description' && (oldValue || newValue)) {
    return (
      <div className="mt-1.5 space-y-1 text-[12px] font-mono">
        {oldValue && (
          <div
            className="rounded px-2 py-1 line-through"
            style={{ background: 'rgba(220,38,38,0.08)', color: 'var(--destructive, #dc2626)' }}
          >
            - {oldValue}
          </div>
        )}
        {newValue && (
          <div
            className="rounded px-2 py-1"
            style={{ background: 'rgba(34,197,94,0.08)', color: '#16a34a' }}
          >
            + {newValue}
          </div>
        )}
      </div>
    )
  }

  return (
    <p className="mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--wl-text-muted)' }}>
      {newValue ?? '—'}
    </p>
  )
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
    <div>
      {logs.map((log, idx) => {
        const userName = log.user?.name ?? 'Sistema'
        const label = logFieldLabel(log.fieldChanged)
        const isLast = idx === logs.length - 1

        return (
          <div key={`${log.changeGroupId}-${log.fieldChanged}-${idx}`} className="flex gap-3">
            {/* Timeline spine */}
            <div className="flex flex-col items-center">
              <div
                className="mt-[5px] h-2 w-2 shrink-0 rounded-full"
                style={{ background: 'var(--wl-border-2)' }}
              />
              {!isLast && (
                <div
                  className="mt-1 flex-1 w-px min-h-[16px]"
                  style={{ background: 'var(--wl-border)' }}
                />
              )}
            </div>

            {/* Entry content */}
            <div className={`min-w-0 ${isLast ? 'pb-0' : 'pb-4'}`}>
              <div className="flex items-center gap-1.5 flex-wrap">
                <WlAvatar name={userName} size={18} />
                <span className="text-[13px]" style={{ color: 'var(--wl-text)' }}>
                  <strong>{userName}</strong>{' '}
                  <span style={{ color: 'var(--wl-text-muted)' }}>alterou</span>{' '}
                  <strong>{label}</strong>
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
