import { Layers, Pencil } from 'lucide-react'

import { EntityCard } from '@/components/worklog'
import type { ClientResponse, ClientSystemResponse } from '@/api/clients-contract'

export interface ClientSystemsCardProps {
  client: ClientResponse
  /** Abre a edição do cliente, onde os sistemas são vinculados. */
  onEdit?: () => void
}

/**
 * Sistemas do cliente, no formato de "serviços contratados" do mockup: uma
 * linha por sistema, com marcador e fundo tintado, em vez da fileira de chips
 * que não dizia nada além do nome.
 *
 * `ClientSystemResponse` só traz `name` e `enabled` — a segunda linha diz o
 * estado, e não uma data de vigência, que o mockup mostra mas a API não tem.
 */
export function ClientSystemsCard({ client, onEdit }: ClientSystemsCardProps) {
  const systems = client.systems
  const ativos = systems.filter((s) => s.enabled).length

  return (
    // `flex-1` faz o card absorver a altura que sobra na coluna, de modo que a
    // base da direita encontre a base do card de dados, à esquerda.
    <EntityCard className="flex-1 p-5">
      <div className="mb-3 flex items-center gap-2">
        <h2
          className="text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: 'var(--wl-text-muted)' }}
        >
          Sistemas associados
        </h2>
        <div className="flex-1" />
        {systems.length > 0 && (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
            style={{
              background: 'color-mix(in oklab, var(--primary) 14%, transparent)',
              color: 'var(--primary)',
            }}
          >
            {ativos === systems.length ? systems.length : `${ativos}/${systems.length}`}
          </span>
        )}
      </div>

      {systems.length === 0 ? (
        <div
          className="flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-4 py-8 text-center"
          style={{ border: '1px dashed var(--wl-border)' }}
        >
          <Layers size={18} style={{ color: 'var(--wl-text-dim)' }} />
          <p className="text-[13px] font-medium" style={{ color: 'var(--wl-text-muted)' }}>
            Nenhum sistema associado
          </p>
          <p className="text-[12px]" style={{ color: 'var(--wl-text-dim)' }}>
            Vincule sistemas ao editar o cliente.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {systems.map((s) => (
            <SystemRow key={s.publicId} system={s} />
          ))}
        </div>
      )}

      {/* `mt-auto` prende o rodapé na base: é ele que fecha a altura que o card
          ganhou ao esticar, no mesmo lugar onde o card de dados põe "Ver filiais". */}
      {onEdit && (
        <div className="mt-auto pt-4">
          <div className="mb-4" style={{ borderTop: '1px solid var(--wl-border)' }} />
          <button
            onClick={onEdit}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-opacity hover:opacity-70"
            style={{
              background: 'var(--wl-surface-2)',
              border: '1px solid var(--wl-border)',
              color: 'var(--wl-text)',
            }}
          >
            <Pencil size={12} />
            {systems.length > 0 ? 'Editar sistemas' : 'Vincular sistemas'}
          </button>
        </div>
      )}
    </EntityCard>
  )
}

function SystemRow({ system }: { system: ClientSystemResponse }) {
  const ativo = system.enabled
  return (
    <div
      className="flex items-center gap-3 rounded-lg px-3 py-1.5"
      style={{
        background: ativo
          ? 'color-mix(in oklab, var(--primary) 10%, transparent)'
          : 'var(--wl-surface-2)',
        border: `1px solid ${
          ativo ? 'color-mix(in oklab, var(--primary) 24%, transparent)' : 'var(--wl-border)'
        }`,
      }}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: ativo ? 'var(--primary)' : 'var(--wl-text-dim)' }}
      />
      <div className="min-w-0 flex-1">
        {/* `leading-tight` nos dois: a altura da linha vinha do line-height
            padrão (1,5), não do respiro da caixa — só mexer no padding cortava
            2px. */}
        <p
          className="truncate text-[13px] font-semibold leading-tight"
          style={{ color: ativo ? 'var(--primary)' : 'var(--wl-text-muted)' }}
        >
          Sistema · {system.name}
        </p>
        <p className="text-[11px] leading-tight" style={{ color: 'var(--wl-text-dim)' }}>
          {ativo ? 'Ativo' : 'Inativo'}
        </p>
      </div>
    </div>
  )
}
