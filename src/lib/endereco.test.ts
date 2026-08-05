import { describe, expect, it } from 'vitest'

import { formatEndereco } from '@/lib/endereco'
import type { AddressResponse } from '@/api/clients-contract'

const vazio: AddressResponse = {
  cep: null,
  logradouro: null,
  numero: null,
  complemento: null,
  bairro: null,
  cidade: null,
  uf: null,
}

describe('formatEndereco', () => {
  it('monta a linha completa com CEP mascarado', () => {
    expect(
      formatEndereco({
        ...vazio,
        cep: '01310100',
        logradouro: 'Av. Paulista',
        numero: '1200',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        uf: 'SP',
      }),
    ).toBe('Av. Paulista, 1200 - Bela Vista - São Paulo/SP · 01310-100')
  })

  it('devolve null quando não há endereço', () => {
    expect(formatEndereco(null)).toBeNull()
    expect(formatEndereco(undefined)).toBeNull()
    expect(formatEndereco(vazio)).toBeNull()
  })

  // Filial de legado: existe no banco de dev com endereço parcial ou nenhum.
  it('não deixa separador solto quando faltam pedaços', () => {
    expect(formatEndereco({ ...vazio, cidade: 'Recife', uf: 'PE' })).toBe('Recife/PE')
    expect(formatEndereco({ ...vazio, logradouro: 'Rua das Acácias' })).toBe('Rua das Acácias')
    expect(formatEndereco({ ...vazio, cidade: 'Recife' })).toBe('Recife')
    expect(formatEndereco({ ...vazio, cep: '50030230' })).toBe('50030-230')
  })

  it('omite o número quando só o logradouro veio', () => {
    expect(formatEndereco({ ...vazio, logradouro: 'Av. Faria Lima', bairro: 'Itaim' })).toBe(
      'Av. Faria Lima - Itaim',
    )
  })

  it('mantém o CEP cru quando não tem 8 dígitos', () => {
    expect(formatEndereco({ ...vazio, cidade: 'Recife', cep: '123' })).toBe('Recife · 123')
  })
})
