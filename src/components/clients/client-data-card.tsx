'use client'

import { Building2, Pencil } from 'lucide-react'

import { EntityCard } from '@/components/worklog'
import {
  CLIENT_TYPE_LABEL,
  REGIME_TRIBUTARIO_LABEL,
  contatoPrincipal,
  filiaisSemMatriz,
  matrizDoCliente,
} from '@/api/clients-contract'
import type { ClientResponse } from '@/api/clients-contract'
import { formatDocumento } from '@/lib/documento'
import { formatEndereco } from '@/lib/endereco'
import { contatoLabel } from './client-table'

export interface ClientDataCardProps {
  client: ClientResponse
  onEdit?: () => void
  /** Slice 5. Sem handler o botão fica desabilitado em vez de virar clique morto. */
  onVerFiliais?: () => void
}

export function ClientDataCard({ client, onEdit, onVerFiliais }: ClientDataCardProps) {
  const isPJ = client.tipo === 'PJ'
  const matriz = matrizDoCliente(client)
  const contato = contatoPrincipal(matriz)
  const endereco = formatEndereco(matriz?.address ?? null)
  const qtdFiliais = filiaisSemMatriz(client).length

  return (
    <EntityCard className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <h2
          className="text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: 'var(--wl-text-muted)' }}
        >
          {isPJ ? 'Dados da empresa' : 'Dados pessoais'}
        </h2>
        <div className="flex-1" />
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-[var(--wl-surface-2)]"
            style={{ color: 'var(--wl-text-muted)' }}
            aria-label={`Editar ${CLIENT_TYPE_LABEL[client.tipo].toLowerCase()}`}
            title="Editar"
          >
            <Pencil size={13} />
          </button>
        )}
      </div>

      <dl className="space-y-3">
        <Field label={isPJ ? 'Razão social' : 'Nome'} value={client.name} />
        {isPJ && client.nomeFantasia && (
          <Field label="Nome fantasia" value={client.nomeFantasia} />
        )}
        <Field label={isPJ ? 'CNPJ' : 'CPF'} value={formatDocumento(matriz?.documento)} mono />
        {isPJ && (
          <>
            <Field label="Inscrição Estadual" value={matriz?.inscricaoEstadual} mono />
            <Field
              label="Regime tributário"
              value={client.regimeTributario ? REGIME_TRIBUTARIO_LABEL[client.regimeTributario] : null}
            />
          </>
        )}
        <Field label="Contato" value={contato ? contatoLabel(contato) : null} />
        <Field label="Endereço" value={endereco} />
      </dl>

      {/* Filiais só existem para PJ (§9 do contrato). */}
      {isPJ && (
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--wl-border)' }}>
          <button
            onClick={onVerFiliais}
            disabled={!onVerFiliais}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: 'var(--wl-surface-2)',
              border: '1px solid var(--wl-border)',
              color: 'var(--wl-text)',
            }}
            title={onVerFiliais ? undefined : 'Gestão de filiais em desenvolvimento'}
          >
            <Building2 size={13} />
            {qtdFiliais > 0 ? `Ver filiais (${qtdFiliais})` : '+ Filiais'}
          </button>
        </div>
      )}
    </EntityCard>
  )
}

// ── Internos ──────────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  mono,
}: {
  label: string
  value: string | null | undefined
  mono?: boolean
}) {
  return (
    <div>
      <dt className="text-[11px]" style={{ color: 'var(--wl-text-muted)' }}>
        {label}
      </dt>
      <dd
        className={`text-[13px] font-medium ${mono ? 'tabular-nums' : ''}`}
        style={{ color: value ? 'var(--wl-text)' : 'var(--wl-text-muted)' }}
      >
        {value || '—'}
      </dd>
    </div>
  )
}
