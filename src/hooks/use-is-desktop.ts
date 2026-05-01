'use client'

import { useSyncExternalStore } from 'react'

export function useIsDesktop(breakpoint = 768) {
  return useSyncExternalStore(
    (callback) => {
      const mq = window.matchMedia(`(min-width: ${breakpoint}px)`)
      mq.addEventListener('change', callback)
      return () => mq.removeEventListener('change', callback)
    },
    () => window.matchMedia(`(min-width: ${breakpoint}px)`).matches,
    () => false,
  )
}
