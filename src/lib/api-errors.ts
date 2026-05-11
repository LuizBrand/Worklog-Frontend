import { AxiosError } from 'axios'
import { toast } from 'sonner'

import type { ApiExceptionResponse } from '@/api/generated/schemas'

export function getApiErrorStatus(err: unknown): number | undefined {
  return err instanceof AxiosError ? err.response?.status : undefined
}

export function getApiErrorBody(err: unknown): ApiExceptionResponse | undefined {
  if (!(err instanceof AxiosError)) return undefined
  return err.response?.data as ApiExceptionResponse | undefined
}

export function apiErrorToMessage(err: unknown, fallback?: string): string {
  const status = getApiErrorStatus(err)
  const body = getApiErrorBody(err)

  if (body?.message) return body.message

  if (body?.fieldErrors) {
    const first = Object.values(body.fieldErrors)[0]
    if (first) return String(first)
  }

  if (status === 401) return 'Sessão expirada. Faça login novamente.'
  if (status === 403) return 'Você não tem permissão para esta ação.'
  if (status === 404) return 'Item não encontrado. Pode ter sido removido.'
  if (status === 409) return 'Conflito: este item já existe.'
  if (status === 422) return 'Operação não permitida no estado atual.'
  if (status && status >= 500) return 'Erro no servidor. Tente novamente em instantes.'

  if (err instanceof AxiosError && !err.response) {
    return 'Sem conexão com o servidor.'
  }

  return fallback ?? 'Erro inesperado. Tente novamente.'
}

// Single source of truth for the "your session ended" toast. The dedupe id
// prevents a cascade of parallel 401s from stacking the same toast.
export function notifySessionExpired() {
  toast.error('Sua sessão expirou. Faça login novamente.', { id: 'session-expired' })
}
