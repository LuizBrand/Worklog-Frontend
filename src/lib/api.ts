import axios, { AxiosError, type AxiosRequestConfig } from 'axios'

import { useAuthStore } from '@/state/auth'
import { notifySessionExpired } from '@/lib/api-errors'

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
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  paramsSerializer: { serialize: (p) => serializeParams(p as Record<string, unknown>) },
})

// Cookies (worklog_access, worklog_refresh) are HttpOnly and sent automatically
// by the browser when withCredentials is true. When the access token is
// missing/expired, Spring Security answers protected routes with 403 (not 401),
// so we treat both 401 and 403 as "try to refresh". We hit /auth/refresh — the
// server reads worklog_refresh, rotates both cookies, and the retried request
// rides the new worklog_access. The single-flight lock prevents concurrent
// refresh races. We only force logout when the refresh itself fails (dead
// session); a 403 that survives a successful refresh is a genuine authorization
// denial and must not log the user out.
let refreshPromise: Promise<void> | null = null

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (typeof window === 'undefined') throw error
    const status = error.response?.status
    if (status !== 401 && status !== 403) throw error

    const originalRequest = error.config as
      | (AxiosRequestConfig & { __retried?: boolean })
      | undefined

    const url = originalRequest?.url ?? ''
    if (url.includes('/auth/refresh') || url.includes('/auth/login')) {
      forceLogout()
      throw error
    }

    // Already retried after a successful refresh: the session is valid, so this
    // is a real authorization failure — surface it without killing the session.
    if (!originalRequest || originalRequest.__retried) throw error

    refreshPromise ??= refreshSession().finally(() => {
      refreshPromise = null
    })

    try {
      await refreshPromise
    } catch (refreshErr) {
      forceLogout()
      throw refreshErr
    }

    originalRequest.__retried = true
    return api(originalRequest)
  },
)

async function refreshSession(): Promise<void> {
  // Bare axios call to skip these interceptors and avoid recursion.
  await axios.post(`${baseURL}/worklog/auth/refresh`, undefined, {
    withCredentials: true,
  })
}

function forceLogout() {
  useAuthStore.getState().clear()
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    notifySessionExpired()
    window.location.href = '/login'
  }
}
