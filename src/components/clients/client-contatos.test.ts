import { describe, expect, it } from 'vitest'

import { SLOT_EMAIL, SLOT_TELEFONE, emOrdemCompacta } from './client-contatos'
import type { ContactFormValues } from './client-schema'

const email = (valor: string, principal = false): ContactFormValues => ({
  tipo: 'EMAIL',
  valor,
  descricao: '',
  principal,
})
const celular = (valor: string, principal = false): ContactFormValues => ({
  tipo: 'CELULAR',
  valor,
  descricao: '',
  principal,
})

describe('emOrdemCompacta', () => {
  it('garante os dois slots mesmo sem contato nenhum', () => {
    const out = emOrdemCompacta([])
    expect(out).toHaveLength(2)
    expect(out[SLOT_EMAIL].tipo).toBe('EMAIL')
    expect(out[SLOT_TELEFONE].tipo).toBe('CELULAR')
    expect(out[SLOT_EMAIL].valor).toBe('')
    expect(out[SLOT_TELEFONE].valor).toBe('')
  })

  it('põe o e-mail no slot 0 e o telefone no slot 1', () => {
    const out = emOrdemCompacta([celular('11988887777'), email('a@x.com')])
    expect(out[SLOT_EMAIL].valor).toBe('a@x.com')
    expect(out[SLOT_TELEFONE].valor).toBe('11988887777')
  })

  it('aceita TELEFONE e WHATSAPP como telefone', () => {
    expect(emOrdemCompacta([{ ...celular('1133334444'), tipo: 'TELEFONE' }])[SLOT_TELEFONE].valor)
      .toBe('1133334444')
    expect(emOrdemCompacta([{ ...celular('11999998888'), tipo: 'WHATSAPP' }])[SLOT_TELEFONE].valor)
      .toBe('11999998888')
  })

  // O PATCH de filial SUBSTITUI a lista inteira: um contato que sumisse daqui
  // seria apagado no servidor.
  it('preserva os contatos extras depois dos dois slots', () => {
    const out = emOrdemCompacta([
      email('a@x.com'),
      email('b@x.com'),
      celular('11988887777'),
      { ...celular('11977776666'), tipo: 'WHATSAPP', descricao: 'Plantão' },
    ])

    expect(out).toHaveLength(4)
    expect(out[SLOT_EMAIL].valor).toBe('a@x.com')
    expect(out[SLOT_TELEFONE].valor).toBe('11988887777')
    expect(out.slice(2).map((c) => c.valor)).toEqual(['b@x.com', '11977776666'])
    expect(out[3].descricao).toBe('Plantão')
  })

  it('não perde nenhum contato, em qualquer ordem de entrada', () => {
    const entrada = [celular('1'), email('2'), email('3'), celular('4')]
    const out = emOrdemCompacta(entrada)
    for (const c of entrada) {
      expect(out.some((o) => o.valor === c.valor), `sumiu ${c.valor}`).toBe(true)
    }
  })

  it('mantém a marcação de principal', () => {
    const out = emOrdemCompacta([celular('11988887777', true), email('a@x.com')])
    expect(out[SLOT_TELEFONE].principal).toBe(true)
    expect(out[SLOT_EMAIL].principal).toBe(false)
  })

  it('preenche slot vazio sem inventar valor', () => {
    const out = emOrdemCompacta([email('a@x.com')])
    expect(out[SLOT_EMAIL].valor).toBe('a@x.com')
    expect(out[SLOT_TELEFONE].valor).toBe('')
    expect(out).toHaveLength(2)
  })
})
