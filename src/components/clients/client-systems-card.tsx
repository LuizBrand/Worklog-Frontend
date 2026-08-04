import { EntityCard } from '@/components/worklog'
import type { ClientResponse } from '@/api/clients-contract'

export interface ClientSystemsCardProps {
  client: ClientResponse
}

export function ClientSystemsCard({ client }: ClientSystemsCardProps) {
  const systems = client.systems

  return (
    <EntityCard className="p-5">
      <h2
        className="mb-3 text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: 'var(--wl-text-muted)' }}
      >
        Sistemas associados
      </h2>

      {systems.length === 0 ? (
        <p className="text-[13px]" style={{ color: 'var(--wl-text-muted)' }}>
          Nenhum sistema associado.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {systems.map((s) => (
            <span
              key={s.publicId}
              className="rounded px-2 py-1 text-[12px] font-medium"
              style={{
                background: 'var(--wl-surface-2)',
                border: '1px solid var(--wl-border)',
                color: s.enabled ? 'var(--wl-text)' : 'var(--wl-text-muted)',
                opacity: s.enabled ? 1 : 0.7,
              }}
              title={s.enabled ? undefined : 'Sistema inativo'}
            >
              {s.name}
            </span>
          ))}
        </div>
      )}
    </EntityCard>
  )
}
