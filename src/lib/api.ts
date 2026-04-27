import axios, { AxiosError, type AxiosRequestConfig } from 'axios'

import type { AuthenticationResponse } from '@/api/generated/schemas'
import { useAuthStore } from '@/state/auth'

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
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
