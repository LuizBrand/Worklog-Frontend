'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { StatusChip, WlAvatar, EmptyState } from '@/components/worklog'
import { apiToUiStatus } from '@/lib/ticket-status'
import { fmtRelative } from '@/lib/worklog-meta'
import type { TicketSummary } from '@/api/generated/schemas'
import type { ApiTicketStatus } from '@/lib/ticket-status'

const CARD_W = 260
const GAP = 12

export interface RecentActivityProps {
  tickets: TicketSummary[] | undefined
  loading?: boolean
}

export function RecentActivity({ tickets, loading }: RecentActivityProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const updateArrows = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateArrows()
    el.addEventListener('scroll', updateArrows, { passive: true })
    const ro = new ResizeObserver(updateArrows)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateArrows)
      ro.disconnect()
    }
  }, [updateArrows])

  useEffect(() => { updateArrows() }, [tickets, updateArrows])

  const scroll = (dir: 'prev' | 'next') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'next' ? CARD_W + GAP : -(CARD_W + GAP), behavior: 'smooth' })
  }

  const hasItems = !loading && tickets && tickets.length > 0

  const arrowBase =
    'absolute top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full transition-all'
  const arrowStyle = {
    background: 'var(--wl-surface)',
    color: 'var(--wl-text-muted)',
    border: '1px solid var(--wl-border)',
    boxShadow: '0 1px 4px rgba(0,0,0,.25)',
  }

  return (
    <div
      className="flex flex-col rounded-xl p-4"
      style={{ background: 'var(--wl-surface)', border: '1px solid var(--wl-border)' }}
    >
      <span
        className="pb-3 text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: 'var(--wl-text-muted)' }}
      >
        Atividade recente
      </span>

      <div style={{ height: 1, background: 'var(--wl-border)', flexShrink: 0 }} />

      {/* carousel wrapper — arrows positioned relative to this */}
      <div className="relative mt-3">
        {hasItems && (
          <>
            <button
              onClick={() => scroll('prev')}
              disabled={!canPrev}
              className={`${arrowBase} left-0 ${canPrev ? 'opacity-100 hover:opacity-80' : 'pointer-events-none opacity-0'}`}
              style={arrowStyle}
              aria-label="Anterior"
            >
              <ChevronLeft size={15} />
            </button>

            <button
              onClick={() => scroll('next')}
              disabled={!canNext}
              className={`${arrowBase} right-0 ${canNext ? 'opacity-100 hover:opacity-80' : 'pointer-events-none opacity-0'}`}
              style={arrowStyle}
              aria-label="Próximo"
            >
              <ChevronRight size={15} />
            </button>
          </>
        )}

        <div
          ref={scrollRef}
          className="scroll-hide flex gap-3 overflow-x-auto"
        >
          {loading &&
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-[120px] w-[260px] shrink-0 animate-pulse rounded-lg"
                style={{ background: 'var(--wl-surface-2)' }}
              />
            ))}

          {!loading && (!tickets || tickets.length === 0) && (
            <EmptyState
              title="Nenhum ticket"
              description="Ainda não há tickets registrados."
            />
          )}

          {hasItems &&
            tickets.map((t) => {
              const uiStatus = t.status
                ? apiToUiStatus(t.status as ApiTicketStatus)
                : 'OPEN'
              const clientName = t.client?.name ?? '—'
              return (
                <Link
                  key={t.publicId}
                  href={`/tickets/${t.publicId}`}
                  className="flex w-[260px] shrink-0 flex-col gap-2 rounded-lg p-3 transition-opacity hover:opacity-80"
                  style={{ background: 'var(--wl-surface-2)', border: '1px solid var(--wl-border)' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <StatusChip status={uiStatus} size="sm" />
                    <span
                      className="text-[11px]"
                      style={{ color: 'var(--wl-text-muted)' }}
                    >
                      {fmtRelative(t.updatedAt)}
                    </span>
                  </div>
                  <span
                    className="line-clamp-2 text-[13px] font-medium leading-snug"
                    style={{ color: 'var(--wl-text)' }}
                  >
                    {t.title ?? '(sem título)'}
                  </span>
                  <div className="mt-auto flex items-center gap-2">
                    <WlAvatar name={clientName} size={20} />
                    <span
                      className="truncate text-[11px]"
                      style={{ color: 'var(--wl-text-muted)' }}
                    >
                      {clientName}
                    </span>
                    {t.system?.name && (
                      <>
                        <span style={{ color: 'var(--wl-text-muted)' }}>·</span>
                        <span
                          className="truncate text-[11px]"
                          style={{ color: 'var(--wl-text-muted)' }}
                        >
                          {t.system.name}
                        </span>
                      </>
                    )}
                  </div>
                </Link>
              )
            })}
        </div>
      </div>
    </div>
  )
}
