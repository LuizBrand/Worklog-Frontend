import { RefreshCw, AlignLeft, MessageSquare, Type, User, Flag, Circle } from 'lucide-react'

import { WlAvatar, StatusChip } from '@/components/worklog'
import { apiToUiStatus } from '@/lib/ticket-status'
import { fmtDateTime, PRIORITY_META, type TicketPriority } from '@/lib/worklog-meta'
import type { TicketLogResponse } from '@/api/generated/schemas'
import type { ApiTicketStatus } from '@/lib/ticket-status'

const FIELD_LABEL: Record<string, string> = {
  status: 'Status',
  description: 'Descrição',
  solution: 'Nota',
  title: 'Título',
  user: 'Responsável',
  userId: 'Responsável',
  priority: 'Prioridade',
  completedAt: 'Concluído em',
}

const FIELD_ICON: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  status: RefreshCw,
  description: AlignLeft,
  solution: MessageSquare,
  title: Type,
  user: User,
  userId: User,
  priority: Flag,
}

function priorityLabel(raw: string | undefined): string | null {
  if (!raw) return null
  const meta = PRIORITY_META[raw as TicketPriority]
  return meta?.label ?? raw
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

  if (fieldChanged === 'priority') {
    const oldP = priorityLabel(oldValue)
    const newP = priorityLabel(newValue)
    const oldColor = oldValue ? PRIORITY_META[oldValue as TicketPriority]?.color : undefined
    const newColor = newValue ? PRIORITY_META[newValue as TicketPriority]?.color : undefined
    return (
      <div className="mt-2 flex items-center gap-2">
        {oldP && (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ color: oldColor, border: `1px solid ${oldColor}33`, background: `${oldColor}14` }}
          >
            {oldP}
          </span>
        )}
        <span className="text-[11px]" style={{ color: 'var(--wl-text-dim)' }}>→</span>
        {newP && (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ color: newColor, border: `1px solid ${newColor}33`, background: `${newColor}14` }}
          >
            {newP}
          </span>
        )}
      </div>
    )
  }

  if (fieldChanged === 'description' && (oldValue || newValue)) {
    return (
      <div className="mt-2 space-y-1 text-[13px]">
        {oldValue && (
          <div
            className="rounded px-2.5 py-1.5 leading-relaxed line-through wrap-anywhere"
            style={{ background: 'color-mix(in oklab, var(--wl-danger) 8%, transparent)', color: 'var(--wl-danger)', borderLeft: '2px solid color-mix(in oklab, var(--wl-danger) 38%, transparent)' }}
          >
            − {oldValue}
          </div>
        )}
        {newValue && (
          <div
            className="rounded px-2.5 py-1.5 leading-relaxed wrap-anywhere"
            style={{ background: 'color-mix(in oklab, var(--wl-success) 8%, transparent)', color: 'var(--wl-success)', borderLeft: '2px solid color-mix(in oklab, var(--wl-success) 38%, transparent)' }}
          >
            + {newValue}
          </div>
        )}
      </div>
    )
  }

  if (fieldChanged === 'solution' && newValue) {
    return (
      <div
        className="mt-2 rounded-lg px-3 py-2.5"
        style={{
          background: 'color-mix(in oklab, var(--primary) 7%, transparent)',
          border: '1px solid color-mix(in oklab, var(--primary) 20%, transparent)',
          borderLeft: '3px solid var(--primary)',
        }}
      >
        <div className="mb-1.5 flex items-center gap-1.5">
          <MessageSquare size={11} strokeWidth={2} style={{ color: 'var(--primary)' }} />
          <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--primary)' }}>
            Nota
          </span>
        </div>
        <p className="text-[13px] leading-relaxed wrap-anywhere whitespace-pre-wrap" style={{ color: 'var(--wl-text)' }}>
          {newValue}
        </p>
      </div>
    )
  }

  if (newValue) {
    return (
      <p
        className="mt-2 rounded px-2.5 py-1.5 text-[13px] leading-relaxed wrap-anywhere"
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
