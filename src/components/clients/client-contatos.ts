/**
 * Ordem dos contatos para a versão compacta do formulário.
 *
 * O mockup mostra dois campos fixos, "Contato" e "Telefone". A API guarda uma
 * lista livre. Para ligar um no outro, a lista é reordenada de modo que o
 * primeiro e-mail caia no índice 0 e o primeiro telefone no índice 1 — os dois
 * que o formulário renderiza.
 *
 * **Os extras continuam na lista, depois dos dois slots.** Isso não é detalhe:
 * `contatos` no PATCH de filial SUBSTITUI a lista inteira (§9.3 do contrato), e
 * um contato que sumisse daqui seria apagado no servidor no primeiro salvamento.
 */
import { emptyContato, type ContactFormValues } from './client-schema'

export const SLOT_EMAIL = 0
export const SLOT_TELEFONE = 1

const TIPOS_TELEFONE = ['TELEFONE', 'CELULAR', 'WHATSAPP'] as const

export function emOrdemCompacta(contatos: ContactFormValues[]): ContactFormValues[] {
  const email = contatos.find((c) => c.tipo === 'EMAIL')
  const telefone = contatos.find((c) => TIPOS_TELEFONE.includes(c.tipo as (typeof TIPOS_TELEFONE)[number]))

  const resto = contatos.filter((c) => c !== email && c !== telefone)

  return [
    email ?? emptyContato(),
    telefone ?? { ...emptyContato(), tipo: 'CELULAR' },
    ...resto,
  ]
}
