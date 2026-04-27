import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import type { UserResponse } from '@/api/generated/schemas'

type AuthState = {
  // Field names mirror the API (`acessToken` is a backend typo kept as-is per
  // memory/plan.md "Locked Decisions" §4).
  acessToken: string | null
  refreshToken: string | null
  user: UserResponse | null
  setTokens: (acessToken: string, refreshToken: string) => void
  setUser: (user: UserResponse | null) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      acessToken: null,
      refreshToken: null,
      user: null,
      setTokens: (acessToken, refreshToken) =>
        set({ acessToken, refreshToken }),
      setUser: (user) => set({ user }),
      clear: () => set({ acessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: 'wl-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        acessToken: state.acessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
)
