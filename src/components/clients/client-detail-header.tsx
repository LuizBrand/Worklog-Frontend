'use client'

import Link from 'next/link'
import { Ban, ChevronLeft, RotateCcw } from 'lucide-react'

import { StatusPill, TipoBadge } from '@/components/worklog'
import { matrizDoCliente } from '@/api/clients-contract'
import type { ClientResponse } from '@/api/clients-contract'
import { formatDocumento } from '@/lib/documento'

export interface ClientDetailHeaderProps {
  client: ClientResponse
  /** Gate ADMIN: sem ele o toggle nem aparece. */
  canToggleActive?: boolean
  onToggleActive?: () => void
}

export function ClientDetailHeader({
  client,
  canToggleActive,
  onToggleActive,
}: ClientDetailHeaderProps) {
  const matriz = matrizDoCliente(client)

  return (
    <div className="flex flex-col gap-1">
      <Link
        href="/clientes"
        className="inline-flex w-fit items-center gap-0.5 text-[12px] transition-opacity hover:opacity-70"
        style={{ color: 'var(--wl-text-muted)' }}
      >
        <ChevronLeft size={13} />
        Voltar para clientes
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-[22px] font-bold leading-tight" style={{ color: 'var(--wl-text)' }}>
          {client.name}
        </h1>
        <TipoBadge tipo={client.tipo} />
        <StatusPill active={client.enabled} variant="badge" />

        <div className="flex-1" />

        {canToggleActive && (
          <button
            onClick={onToggleActive}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-opacity hover:opacity-70"
            style={{
              background: 'var(--wl-surface-2)',
              border: '1px solid var(--wl-border)',
              color: client.enabled ? 'var(--wl-danger)' : 'var(--wl-text-muted)',
            }}
          >
            {client.enabled ? <Ban size={13} /> : <RotateCcw size={13} />}
            {client.enabled ? 'Desativar' : 'Reativar'}
          </button>
        )}
      </div>

      <span className="text-[13px] tabular-nums" style={{ color: 'var(--wl-text-muted)' }}>
        {formatDocumento(matriz?.documento)}
      </span>
    </div>
  )
}
