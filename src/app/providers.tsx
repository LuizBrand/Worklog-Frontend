'use client'

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useState } from 'react'
import { AxiosError } from 'axios'
import { toast } from 'sonner'

import { Toaster } from '@/components/ui/sonner'
import type { ApiExceptionResponse } from '@/api/generated/schemas'

function flattenApiError(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as ApiExceptionResponse | undefined
    if (data?.message) return data.message
    if (data?.fieldErrors) {
      const first = Object.values(data.fieldErrors)[0]
      if (Array.isArray(first) && first[0]) return String(first[0])
      if (typeof first === 'string') return first
    }
    return err.message
  }
  return err instanceof Error ? err.message : 'Erro inesperado'
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
        queryCache: new QueryCache({
          onError: (error) => {
            const status =
              error instanceof AxiosError ? error.response?.status : undefined
            if (status === 401) return
            toast.error(flattenApiError(error))
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            toast.error(flattenApiError(error))
          },
        }),
      }),
  )

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      storageKey="wl-theme"
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
