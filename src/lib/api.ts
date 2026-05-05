import axios, { AxiosError, type AxiosRequestConfig } from 'axios'

import type { AuthenticationResponse } from '@/api/generated/schemas'
import { useAuthStore } from '@/state/auth'

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

// Orval generates nested params like {filters: {title}, pageable: {page}}.
// Spring Boot expects flat query params: title=x&page=0.
// This serializer unwraps one level of wrapper objects and repeats arrays.
function serializeParams(params: Record<string, unknown>): string {
  const parts: string[] = []
  function collect(obj: Record<string, unknown>) {
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined || value === null) continue
      if (Array.isArray(value)) {
        for (const v of value) parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`)
      } else if (typeof value === 'object') {
        collect(value as Record<string, unknown>)
      } else {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      }
    }
  }
  collect(params)
  return parts.join('&')
}

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  paramsSerializer: { serialize: (p) => serializeParams(p as Record<string, unknown>) },
})

api.interceptors.request.use((config) => {
  if (typeof window === 'undefined') return config
  const token = useAuthStore.getState().acessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Backend rotates BOTH tokens on every /auth/refresh call and invalidates
// the previous refresh token immediately. The single-flight lock must hold
// every concurrent 401 retry until the new pair is persisted, otherwise a
// follow-up refresh hits a dead refresh token. See memory/plan.md §5.
let refreshPromise: Promise<string> | null = null

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (typeof window === 'undefined') throw error
    if (error.response?.status !== 401) throw error

    const originalRequest = error.config as
      | (AxiosRequestConfig & { __retried?: boolean })
      | undefined
    if (!originalRequest || originalRequest.__retried) {
      forceLogout()
      throw error
    }

    const { refreshToken } = useAuthStore.getState()
    if (!refreshToken) {
      forceLogout()
      throw error
    }

    refreshPromise ??= refreshAccessToken(refreshToken).finally(() => {
      refreshPromise = null
    })

    try {
      const newAcessToken = await refreshPromise
      originalRequest.__retried = true
      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${newAcessToken}`,
      }
      return api(originalRequest)
    } catch (refreshErr) {
      forceLogout()
      throw refreshErr
    }
  },
)

async function refreshAccessToken(refreshToken: string): Promise<string> {
  // Use a bare axios call to skip these interceptors and avoid recursion.
  const response = await axios.post<AuthenticationResponse>(
    `${baseURL}/worklog/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } },
  )
  const { acessToken, refreshToken: newRefreshToken } = response.data
  if (!acessToken || !newRefreshToken) {
    throw new Error('Refresh response missing tokens')
  }
  useAuthStore.getState().setTokens(acessToken, newRefreshToken)
  return acessToken
}

function forceLogout() {
  useAuthStore.getState().clear()
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}
