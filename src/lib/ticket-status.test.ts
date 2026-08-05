import { describe, expect, it } from 'vitest'

import { apiToUiStatus, uiToApiStatus, type ApiTicketStatus } from '@/lib/ticket-status'
import { STATUS_META, type TicketStatus } from '@/lib/worklog-meta'
import { TicketSummaryStatus } from '@/api/generated/schemas/ticketSummaryStatus'

const API_STATUSES = Object.values(TicketSummaryStatus)

describe('vocabulário de status da API vs da UI', () => {
  // Regressão do bug do Slice 3 (2026-08-04): `client-tickets-card.tsx` fazia
  // `t.status as TicketStatus` e indexava STATUS_META com o valor da API. O tsc
  // não pegava — era o cast que silenciava a checagem — e o StatusChip estourava
  // em `undefined.background`, derrubando a página do detalhe do cliente.
  it('STATUS_META não indexa os valores da API', () => {
    for (const api of API_STATUSES) {
      if (api === 'CANCELLED') continue // única palavra comum aos dois vocabulários
      expect(STATUS_META[api as unknown as TicketStatus]).toBeUndefined()
    }
  })

  it('todo status da API mapeia para uma chave que existe em STATUS_META', () => {
    for (const api of API_STATUSES) {
      const ui = apiToUiStatus(api)
      expect(ui, `sem mapeamento de UI para ${api}`).toBeDefined()
      expect(STATUS_META[ui], `STATUS_META sem entrada para ${ui}`).toBeDefined()
      expect(STATUS_META[ui].background).toBeTruthy()
    }
  })

  it('ida e volta preserva o status', () => {
    for (const api of API_STATUSES) {
      expect(uiToApiStatus(apiToUiStatus(api))).toBe(api)
    }
  })

  it('cobre os status que o card de tickets do cliente separa por aba', () => {
    // Assunção 2 do plano: "solicitados" = PENDING; "em andamento" =
    // AWAITING_CUSTOMER + AWAITING_DEVELOPMENT.
    const abas: ApiTicketStatus[] = ['PENDING', 'AWAITING_CUSTOMER', 'AWAITING_DEVELOPMENT']
    for (const api of abas) {
      expect(API_STATUSES).toContain(api)
      expect(STATUS_META[apiToUiStatus(api)]).toBeDefined()
    }
  })
})
