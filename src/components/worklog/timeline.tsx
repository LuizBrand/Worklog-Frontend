'use client'

import { Fragment } from 'react'

import { cn } from '@/lib/utils'
import { fmtDateTime, type LogField, type TicketStatus } from '@/lib/worklog-meta'
import { StatusChip } from './status-chip'
import { WlAvatar } from './avatar'
import { MonoSpan } from './mono-span'

export interface TimelineEntryData {
  id: string
  field: LogField
  from: string | null
  to: string
  authorName: string
  ts: string
}

export interface TimelineProps {
  entries: TimelineEntryData[]
  emptyLabel?: string
  className?: string
}

const FIELD_ICON: Record<LogField, string> = {
  STATUS: '◈',
  NOTE: '✎',
  DESCRIPTION: '¶',
  ASSIGNEE: '◎',
  PRIORITY: '▲',
  TITLE: 'T',
}

const FIELD_LABEL: Record<LogField, string> = {
  STATUS: 'mudou status',
  NOTE: 'adicionou nota',
  DESCRIPTION: 'editou descrição',
  ASSIGNEE: 'alterou responsável',
  PRIORITY: 'alterou prioridade',
  TITLE: 'editou título',
}

export function Timeline({ entries, emptyLabel, className }: TimelineProps) {
  if (entries.length === 0) {
    return (
      <p
        className={cn('text-xs', className)}
        style={{ color: 'var(--wl-text-muted)' }}
      >
        {emptyLabel ?? 'Sem registros ainda.'}
      </p>
    )
  }

  return (
    <ol className={cn('flex flex-col', className)}>
      {entries.map((entry, idx) => (
        <Fragment key={entry.id}>
          <TimelineEntry
            entry={entry}
            isLast={idx === entries.length - 1}
          />
        </Fragment>
      ))}
    </ol>
  )
}

interface TimelineEntryProps {
  entry: TimelineEntryData
  isLast: boolean
}

function TimelineEntry({ entry, isLast }: TimelineEntryProps) {
  return (
    <li className="relative flex gap-3 pb-5">
      {!isLast && (
        <span
          aria-hidden
          className="absolute left-[10px] top-5 bottom-0 w-px"
          style={{ background: 'var(--wl-border)' }}
        />
      )}
      <span
        aria-hidden
        className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px]"
        style={{
          background: 'var(--wl-surface-2)',
          color: 'var(--wl-text-muted)',
          border: '1px solid var(--wl-border)',
        }}
      >
        {FIELD_ICON[entry.field]}
      </span>
      <div className="flex-1 pt-[2px]">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <WlAvatar name={entry.authorName} size={18} />
          <span style={{ color: 'var(--wl-text)' }} className="font-medium">
            {entry.authorName}
          </span>
          <span style={{ color: 'var(--wl-text-muted)' }}>
            {FIELD_LABEL[entry.field]}
          </span>
          <MonoSpan>{fmtDateTime(entry.ts)}</MonoSpan>
        </div>
        <div className="mt-2">
          <TimelineBody entry={entry} />
        </div>
      </div>
    </li>
  )
}

function TimelineBody({ entry }: { entry: TimelineEntryData }) {
  if (entry.field === 'STATUS') {
    return (
      <div className="flex items-center gap-2">
        {entry.from && <StatusChip status={entry.from as TicketStatus} size="sm" />}
        {entry.from && (
          <span style={{ color: 'var(--wl-text-muted)' }}>→</span>
        )}
        <StatusChip status={entry.to as TicketStatus} size="sm" />
      </div>
    )
  }

  if (entry.field === 'NOTE') {
    return (
      <div
        className="rounded-md px-3 py-2 text-sm leading-relaxed"
        style={{
          background: 'var(--wl-surface-2)',
          borderLeft: '2px solid var(--primary)',
          color: 'var(--wl-text)',
        }}
      >
        {entry.to}
      </div>
    )
  }

  return (
    <div className="space-y-1 text-sm">
      {entry.from && (
        <div
          className="rounded px-2 py-1 text-xs leading-relaxed line-through"
          style={{
            background: 'rgba(192, 68, 58, 0.12)',
            borderLeft: '2px solid var(--priority-critical)',
            color: 'var(--wl-text-muted)',
          }}
        >
          {entry.from}
        </div>
      )}
      <div
        className="rounded px-2 py-1 text-xs leading-relaxed"
        style={{
          background: 'rgba(52, 211, 153, 0.12)',
          borderLeft: '2px solid var(--status-resolved)',
          color: 'var(--wl-text)',
        }}
      >
        {entry.to}
      </div>
    </div>
  )
}
