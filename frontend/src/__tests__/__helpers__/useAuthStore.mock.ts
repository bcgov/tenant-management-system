import { vi } from 'vitest'
import { reactive } from 'vue'

import { makeUser } from '@/__tests__/__factories__'
import { type User } from '@/models/user.model'

const storeState = reactive({
  sessionExpired: false,
  user: null as User | null,
})

const mockLogin = vi.fn()
const mockLogout = vi.fn()

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    get authenticatedUser() {
      if (storeState.user === null) {
        throw new Error('User not available')
      }

      return storeState.user
    },

    get isAuthenticated() {
      return storeState.user !== null
    },

    get sessionExpired() {
      return storeState.sessionExpired
    },

    login: mockLogin,

    logout: mockLogout,
  }),
}))

export function mockAuthStore(
  user: User | null = makeUser(),
  sessionExpired = false,
) {
  storeState.sessionExpired = sessionExpired
  storeState.user = user
}

export function mockAuthStoreLogin() {
  return mockLogin
}

export function mockAuthStoreLogout() {
  return mockLogout
}
