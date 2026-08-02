/**
 * Ponte entre o corpo de erro da API e os erros de campo do react-hook-form.
 *
 * O backend responde de duas formas para a mesma regra, e o front precisa
 * cobrir as duas (CONTRATO-CLIENTES.md §7.3):
 *
 * - `POST /clients/` → 400 com `fieldErrors` (Bean Validation), chave no
 *   caminho do campo com índice de array: `branches[0].documento`,
 *   `branches[1].contatos[0].valor`.
 * - `POST /clients/{id}/branches` → 422 com mensagem solta, sem `fieldErrors`.
 *
 * 409 traz o conflito na mensagem, em inglês e com o valor embutido
 * (`Documento: 11222333000181 already exists`) — não exibir cru, mas dá para
 * extrair o valor e destacar o campo certo.
 */
import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form'

import { getApiErrorBody, getApiErrorStatus } from '@/lib/api-errors'
import { stripDocumento } from '@/lib/documento'

/** `branches[0].contatos[1].valor` → `branches.0.contatos.1.valor` */
export function apiFieldPathToRhf(key: string): string {
  return key.replace(/\[(\d+)\]/g, '.$1')
}

/**
 * Aplica os `fieldErrors` de um 400 nos campos do formulário.
 * Devolve `true` quando aplicou pelo menos um — o caller usa isso para decidir
 * entre erro por campo e toast global.
 */
export function applyApiFieldErrors<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
): boolean {
  const fieldErrors = getApiErrorBody(err)?.fieldErrors
  if (!fieldErrors) return false

  let applied = false
  for (const [key, message] of Object.entries(fieldErrors)) {
    if (!message) continue
    setError(apiFieldPathToRhf(key) as FieldPath<T>, {
      type: 'server',
      message: String(message),
    })
    applied = true
  }
  return applied
}

/**
 * Extrai o documento de um 409 `Documento: {doc} already exists`.
 * Devolve normalizado, para casar com o valor digitado no formulário.
 */
export function extractDocumentoFromMessage(message: string | undefined): string | null {
  if (!message) return null
  const match = /documento:\s*([0-9A-Za-z./-]+)/i.exec(message)
  return match ? stripDocumento(match[1]) : null
}

/** Índice da filial cujo documento casa com `documento`, ou -1. */
export function findBranchIndexByDocumento(
  branches: { documento?: string | null }[],
  documento: string | null,
): number {
  if (!documento) return -1
  return branches.findIndex((b) => b.documento && stripDocumento(b.documento) === documento)
}

/** Conflito de nome de cliente: 409 `Client with name: {name} already exists`. */
export function isNameConflict(err: unknown): boolean {
  if (getApiErrorStatus(err) !== 409) return false
  const message = getApiErrorBody(err)?.message ?? ''
  return /with name:/i.test(message)
}

/** Conflito de documento: 409 `Documento: {doc} already exists`. */
export function isDocumentoConflict(err: unknown): boolean {
  if (getApiErrorStatus(err) !== 409) return false
  const message = getApiErrorBody(err)?.message ?? ''
  return /^documento:/i.test(message.trim())
}
