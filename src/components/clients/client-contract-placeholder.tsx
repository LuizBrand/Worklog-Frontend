import { DevChip, EntityCard } from '@/components/worklog'

/**
 * Contrato vigente e serviços contratados são o próximo módulo do backend.
 * Este card é só marcação de lugar: nenhuma chamada de API, nenhum arquivo.
 */
export function ClientContractPlaceholder() {
  return (
    <EntityCard className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <h2
          className="text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: 'var(--wl-text-muted)' }}
        >
          Contrato vigente
        </h2>
        <div className="flex-1" />
        <DevChip />
      </div>

      <div
        className="flex flex-col items-center justify-center gap-1 rounded-lg px-4 py-10 text-center"
        style={{ border: '1px dashed var(--wl-border)' }}
      >
        <p className="text-[13px] font-medium" style={{ color: 'var(--wl-text-muted)' }}>
          Módulo de contratos em desenvolvimento
        </p>
        <p className="text-[12px]" style={{ color: 'var(--wl-text-dim)' }}>
          Vigência, renovação e arquivos do contrato chegam em breve.
        </p>
      </div>
    </EntityCard>
  )
}
