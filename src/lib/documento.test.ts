import { describe, expect, it } from 'vitest'

import {
  formatCep,
  formatCpf,
  formatCnpj,
  formatDocumento,
  formatTelefone,
  isValidCnpj,
  isValidCpf,
  isValidDocumento,
  looksLikeDocumento,
  stripDocumento,
} from '@/lib/documento'

// CNPJs e CPFs aceitos pelo backend no banco de dev — não são inventados.
const CNPJ_OK = ['11222333000181', '44555666000181', '75756293000130']
const CNPJ_ALFA = '12ABC34501DE35' // formato alfanumérico vigente desde 2026
const CPF_OK = ['11144477735', '39053344705']

describe('stripDocumento', () => {
  it('remove máscara e aplica maiúsculas', () => {
    expect(stripDocumento('11.222.333/0001-81')).toBe('11222333000181')
    expect(stripDocumento('12abc345 01de35')).toBe('12ABC34501DE35')
    expect(stripDocumento('111.444.777-35')).toBe('11144477735')
  })
})

describe('isValidCnpj', () => {
  it('aceita CNPJ numérico com checksum válido, mascarado ou não', () => {
    for (const cnpj of CNPJ_OK) {
      expect(isValidCnpj(cnpj), cnpj).toBe(true)
      expect(isValidCnpj(formatCnpj(cnpj)), `mascarado ${cnpj}`).toBe(true)
    }
  })

  it('aceita CNPJ alfanumérico (checksum sobre char − 48)', () => {
    expect(isValidCnpj(CNPJ_ALFA)).toBe(true)
    expect(isValidCnpj(CNPJ_ALFA.toLowerCase())).toBe(true)
  })

  it('rejeita dígito verificador trocado', () => {
    expect(isValidCnpj('11222333000182')).toBe(false)
    expect(isValidCnpj('12ABC34501DE36')).toBe(false)
  })

  it('rejeita tamanho errado, repetição e DV não numérico', () => {
    expect(isValidCnpj('1122233300018')).toBe(false)
    expect(isValidCnpj('112223330001811')).toBe(false)
    expect(isValidCnpj('11111111111111')).toBe(false)
    expect(isValidCnpj('12ABC34501DEAB')).toBe(false)
    expect(isValidCnpj('')).toBe(false)
  })
})

describe('isValidCpf', () => {
  it('aceita CPF com checksum válido', () => {
    for (const cpf of CPF_OK) {
      expect(isValidCpf(cpf), cpf).toBe(true)
      expect(isValidCpf(formatCpf(cpf)), `mascarado ${cpf}`).toBe(true)
    }
  })

  it('rejeita dígito trocado, repetição e tamanho errado', () => {
    expect(isValidCpf('11144477736')).toBe(false)
    expect(isValidCpf('11111111111')).toBe(false)
    expect(isValidCpf('1114447773')).toBe(false)
  })

  it('não aceita letra: CPF é só dígito', () => {
    expect(isValidCpf('1114447773A')).toBe(false)
  })
})

describe('isValidDocumento', () => {
  it('escolhe a validação pelo tipo do cliente', () => {
    expect(isValidDocumento('11222333000181', 'PJ')).toBe(true)
    expect(isValidDocumento('11222333000181', 'PF')).toBe(false)
    expect(isValidDocumento('11144477735', 'PF')).toBe(true)
    expect(isValidDocumento('11144477735', 'PJ')).toBe(false)
  })
})

describe('formatadores', () => {
  it('mascara CNPJ, CPF, CEP e telefone', () => {
    expect(formatCnpj('11222333000181')).toBe('11.222.333/0001-81')
    expect(formatCnpj(CNPJ_ALFA)).toBe('12.ABC.345/01DE-35')
    expect(formatCpf('11144477735')).toBe('111.444.777-35')
    expect(formatCep('01310100')).toBe('01310-100')
    expect(formatTelefone('11988887777')).toBe('(11) 98888-7777')
    expect(formatTelefone('1133334444')).toBe('(11) 3333-4444')
  })

  it('devolve o valor cru quando o tamanho não bate', () => {
    expect(formatCnpj('123')).toBe('123')
    expect(formatCpf('123')).toBe('123')
    expect(formatCep('123')).toBe('123')
    expect(formatTelefone('123')).toBe('123')
  })

  it('formatDocumento infere pelo tamanho e cobre a filial de legado sem documento', () => {
    expect(formatDocumento('11222333000181')).toBe('11.222.333/0001-81')
    expect(formatDocumento('11144477735')).toBe('111.444.777-35')
    expect(formatDocumento(null)).toBe('—')
    expect(formatDocumento(undefined)).toBe('—')
    expect(formatDocumento('')).toBe('—')
  })
})

describe('looksLikeDocumento', () => {
  // Decide se a busca da listagem vai no filtro `documento` (igualdade exata
  // contra qualquer filial) ou em `name` (LIKE parcial).
  it('reconhece documento com e sem máscara', () => {
    expect(looksLikeDocumento('11.222.333/0001-81')).toBe(true)
    expect(looksLikeDocumento('111.444.777-35')).toBe(true)
    expect(looksLikeDocumento(CNPJ_ALFA)).toBe(true)
  })

  it('trata nome de cliente como nome, não como documento', () => {
    expect(looksLikeDocumento('Acme')).toBe(false)
    expect(looksLikeDocumento('Verificacao Slice1')).toBe(false)
    expect(looksLikeDocumento('')).toBe(false)
  })

  it('exige pelo menos um dígito — texto de 14 letras não é CNPJ', () => {
    expect(looksLikeDocumento('ABCDEFGHIJKLMN')).toBe(false)
  })

  it('ignora tamanhos que não são de CPF nem CNPJ', () => {
    expect(looksLikeDocumento('1122233300018')).toBe(false)
    expect(looksLikeDocumento('112223330001811')).toBe(false)
  })
})
