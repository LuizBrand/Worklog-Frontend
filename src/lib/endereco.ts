import type { AddressResponse } from '@/api/clients-contract'
import { formatCep } from '@/lib/documento'

/**
 * Monta a linha de endereço do detalhe do cliente e da lista de filiais:
 * `Av. Paulista, 1200 - Bela Vista - São Paulo/SP · 01310-100`.
 *
 * Todo campo de `AddressRequest` é opcional e o banco tem filiais de legado sem
 * endereço nenhum, então cada pedaço entra só se existir. Sem nada preenchido
 * devolve `null`, para o campo cair no travessão em vez de exibir separador solto.
 */
export function formatEndereco(address: AddressResponse | null | undefined): string | null {
  if (!address) return null

  const rua = [address.logradouro, address.numero].filter(Boolean).join(', ')
  const cidade = [address.cidade, address.uf].filter(Boolean).join('/')
  const linha = [rua, address.bairro, cidade].filter(Boolean).join(' - ')
  const cep = formatCep(address.cep)

  if (!linha) return cep || null
  return cep ? `${linha} · ${cep}` : linha
}
