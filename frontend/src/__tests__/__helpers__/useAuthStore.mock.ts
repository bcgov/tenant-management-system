import { vi } from 'vitest'
import { reactive } from 'vue'

import { makeUser } from '@/__tests__/__factories__'

import { type User } from '@/models/user.model'

type MockAuthStoreOverrides = Partial<{
  ensureFreshToken: ReturnType<typeof vi.fn>
  getAccessToken: ReturnType<typeof vi.fn>
  isSessionExpired: boolean
  login: ReturnType<typeof vi.fn>
  logout: ReturnType<typeof vi.fn>
  user: User | null
}>

export function createMockAuthStore(overrides: MockAuthStoreOverrides = {}) {
  const state = reactive({
    isSessionExpired: overrides.isSessionExpired ?? false,
    user: overrides.user === undefined ? makeUser() : overrides.user,
  })

  const ensureFreshToken = overrides.ensureFreshToken ?? vi.fn()
  const getAccessToken = overrides.getAccessToken ?? vi.fn()
  const login = overrides.login ?? vi.fn()
  const logout = overrides.logout ?? vi.fn()

  return {
    get authenticatedUser() {
      if (state.user === null) {
        throw new Error('User not available')
      }

      return state.user
    },

    ensureFreshToken,

    getAccessToken,

    get isAuthenticated() {
      return state.user !== null
    },

    login,

    logout,

    get isSessionExpired() {
      return state.isSessionExpired
    },
  }
}
