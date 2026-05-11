'use client'

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useState } from 'react'
import { toast } from 'sonner'

import { Toaster } from '@/components/ui/sonner'
import { apiErrorToMessage, getApiErrorStatus } from '@/lib/api-errors'

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
            // 401 is handled by the axios interceptor + auth gate.
            if (getApiErrorStatus(error) === 401) return
            toast.error(apiErrorToMessage(error))
          },
        }),
        mutationCache: new MutationCache({
          onError: (error, _vars, _ctx, mutation) => {
            // 401 → forceLogout owns the toast (session-expired id).
            if (getApiErrorStatus(error) === 401) return
            // `meta.silent`: local onError fully owns the feedback.
            if (mutation.meta?.silent) return
            const override = mutation.meta?.errorMessage as string | undefined
            toast.error(override ?? apiErrorToMessage(error))
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
