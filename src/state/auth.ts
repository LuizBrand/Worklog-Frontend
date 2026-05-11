import { create } from 'zustand'

import type { UserResponse } from '@/api/generated/schemas'

type AuthState = {
  user: UserResponse | null
  setUser: (user: UserResponse | null) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clear: () => set({ user: null }),
}))
