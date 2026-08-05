import { describe, expect, it, vi } from 'vitest'
import { AxiosError } from 'axios'

import {
  apiFieldPathToRhf,
  applyApiFieldErrors,
  extractDocumentoFromMessage,
  findBranchIndexByDocumento,
  isDocumentoConflict,
  isNameConflict,
} from '@/lib/field-errors'

/**
 * Erro do axios como o interceptor entrega.
 *
 * Tem que ser uma instância de verdade: `getApiErrorBody`/`getApiErrorStatus`
 * checam `err instanceof AxiosError`, então um objeto com o mesmo formato é
 * ignorado em silêncio.
 */
function apiError(status: number, data: unknown): AxiosError {
  const err = new AxiosError('erro de teste')
  err.response = {
    status,
    data,
    statusText: '',
    headers: {},
    config: { headers: {} } as never,
  }
  return err
}

describe('apiFieldPathToRhf', () => {
  it('troca índice de array por segmento de path', () => {
    expect(apiFieldPathToRhf('branches[0].documento')).toBe('branches.0.documento')
    expect(apiFieldPathToRhf('branches[1].contatos[0].valor')).toBe('branches.1.contatos.0.valor')
  })

  it('deixa campo simples intacto', () => {
    expect(apiFieldPathToRhf('name')).toBe('name')
  })
})

describe('applyApiFieldErrors', () => {
  it('aplica cada fieldError no campo correspondente', () => {
    const setError = vi.fn()
    const err = apiError(400, {
      fieldErrors: {
        'branches[0].documento': 'CNPJ inválido',
        name: 'Nome obrigatório',
      },
    })

    expect(applyApiFieldErrors(err, setError)).toBe(true)
    expect(setError).toHaveBeenCalledWith('branches.0.documento', {
      type: 'server',
      message: 'CNPJ inválido',
    })
    expect(setError).toHaveBeenCalledWith('name', { type: 'server', message: 'Nome obrigatório' })
  })

  // O 422 do POST de filial vem com mensagem solta, sem fieldErrors: o caller
  // usa o `false` para cair no toast global em vez de erro por campo.
  it('devolve false quando não há fieldErrors', () => {
    const setError = vi.fn()
    expect(applyApiFieldErrors(apiError(422, { message: 'Documento já existe' }), setError)).toBe(false)
    expect(applyApiFieldErrors(apiError(500, {}), setError)).toBe(false)
    expect(applyApiFieldErrors(new Error('network'), setError)).toBe(false)
    expect(setError).not.toHaveBeenCalled()
  })

  // Armadilha para quem for mockar erro em teste novo: os acessores de
  // `api-errors.ts` usam `instanceof AxiosError`, não duck typing.
  it('ignora objeto que só imita o formato do AxiosError', () => {
    const setError = vi.fn()
    const falso = { response: { status: 400, data: { fieldErrors: { name: 'x' } } } }
    expect(applyApiFieldErrors(falso, setError)).toBe(false)
    expect(setError).not.toHaveBeenCalled()
  })

  it('ignora entrada com mensagem vazia', () => {
    const setError = vi.fn()
    expect(applyApiFieldErrors(apiError(400, { fieldErrors: { name: '' } }), setError)).toBe(false)
    expect(setError).not.toHaveBeenCalled()
  })
})

describe('conflitos 409', () => {
  it('extrai o documento normalizado da mensagem', () => {
    expect(extractDocumentoFromMessage('Documento: 11222333000181 already exists')).toBe('11222333000181')
    expect(extractDocumentoFromMessage('Documento: 11.222.333/0001-81 already exists')).toBe('11222333000181')
    expect(extractDocumentoFromMessage(undefined)).toBeNull()
    expect(extractDocumentoFromMessage('Client with name: Acme already exists')).toBeNull()
  })

  it('separa conflito de nome de conflito de documento', () => {
    const nome = apiError(409, { message: 'Client with name: Acme already exists' })
    const doc = apiError(409, { message: 'Documento: 11222333000181 already exists' })

    expect(isNameConflict(nome)).toBe(true)
    expect(isDocumentoConflict(nome)).toBe(false)
    expect(isDocumentoConflict(doc)).toBe(true)
    expect(isNameConflict(doc)).toBe(false)
  })

  it('não confunde outro status com 409', () => {
    expect(isNameConflict(apiError(400, { message: 'Client with name: Acme already exists' }))).toBe(false)
    expect(isDocumentoConflict(apiError(422, { message: 'Documento: 1 already exists' }))).toBe(false)
  })
})

describe('findBranchIndexByDocumento', () => {
  const branches = [
    { documento: '11.222.333/0001-81' },
    { documento: null },
    { documento: '44555666000181' },
  ]

  it('casa ignorando a máscara', () => {
    expect(findBranchIndexByDocumento(branches, '11222333000181')).toBe(0)
    expect(findBranchIndexByDocumento(branches, '44555666000181')).toBe(2)
  })

  it('devolve -1 sem documento ou sem correspondência', () => {
    expect(findBranchIndexByDocumento(branches, null)).toBe(-1)
    expect(findBranchIndexByDocumento(branches, '99999999000199')).toBe(-1)
  })
})
