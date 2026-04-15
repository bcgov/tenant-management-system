import type { KeycloakTokenParsed } from 'keycloak-js'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/stores/useAuthStore'
import { ROLES } from '@/utils/constants'

vi.mock('@/services/config.service', () => ({
  config: {
    oidc: { clientId: 'test', realm: 'test', serverUrl: 'http://localhost' },
    api: { baseUrl: 'http://api' },
  },
}))

const mockInit = vi.fn().mockResolvedValue(true)
const mockLogin = vi.fn()
const mockLogout = vi.fn()
const mockUpdateToken = vi.fn().mockResolvedValue(true)
let mockTokenParsed: KeycloakTokenParsed = {} as KeycloakTokenParsed

vi.mock('keycloak-js', () => ({
  default: class MockKeycloak {
    token = 'fake-token'
    get tokenParsed() {
      return mockTokenParsed
    }
    init = mockInit
    login = mockLogin
    logout = mockLogout
    updateToken = mockUpdateToken
  },
}))

const makeIdirToken = (
  overrides: Partial<KeycloakTokenParsed> = {},
): KeycloakTokenParsed =>
  ({
    identity_provider: 'idir',
    idir_user_guid: '123',
    idir_username: 'jdoe',
    given_name: 'John',
    family_name: 'Doe',
    display_name: 'John Doe',
    email: 'john@test.com',
    ...overrides,
  }) as KeycloakTokenParsed

const makeBceidToken = (
  overrides: Partial<KeycloakTokenParsed> = {},
): KeycloakTokenParsed =>
  ({
    identity_provider: 'bceid',
    bceid_user_guid: '456',
    bceid_username: 'bceid_user',
    ...overrides,
  }) as KeycloakTokenParsed

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('location', { origin: 'http://localhost' })

    mockInit.mockClear()
    mockUpdateToken.mockClear()
    mockLogin.mockClear()
    mockLogout.mockClear()

    mockInit.mockResolvedValue(true)
    mockUpdateToken.mockResolvedValue(true)
    mockTokenParsed = {} as KeycloakTokenParsed
  })

  describe('init', () => {
    it('maps an IDIR user from the token', async () => {
      const store = useAuthStore()
      mockTokenParsed = makeIdirToken({
        client_roles: [ROLES.OPERATIONS_ADMIN.value],
      })

      await store.init()

      expect(store.authenticatedUser.id).toBe('123')
    })

    it('maps a BCeID user from the token', async () => {
      const store = useAuthStore()
      mockTokenParsed = makeBceidToken()

      await store.init()

      expect(store.authenticatedUser.id).toBe('456')
    })

    it('does not set a user when Keycloak reports unauthenticated', async () => {
      const store = useAuthStore()
      mockInit.mockResolvedValue(false)

      await store.init()

      expect(() => store.authenticatedUser).toThrow('User not available')
    })

    it('rethrows when Keycloak init fails', async () => {
      const store = useAuthStore()
      mockInit.mockRejectedValue(new Error('Keycloak Init Failed'))

      await expect(store.init()).rejects.toThrow('Keycloak Init Failed')
    })
  })

  describe('ensureFreshToken', () => {
    it('does nothing when no user is set', async () => {
      const store = useAuthStore()

      await store.ensureFreshToken()

      expect(mockUpdateToken).not.toHaveBeenCalled()
    })

    it('refreshes the token when a user is set', async () => {
      const store = useAuthStore()
      mockTokenParsed = makeIdirToken()
      await store.init()

      await store.ensureFreshToken()

      expect(mockUpdateToken).toHaveBeenCalledWith(30)
    })

    it('sets sessionExpired and clears user when token refresh fails', async () => {
      const store = useAuthStore()
      mockTokenParsed = makeIdirToken()
      await store.init()

      mockUpdateToken.mockRejectedValue(new Error('refresh failed'))
      await store.ensureFreshToken()

      expect(store.sessionExpired).toBe(true)
      expect(() => store.authenticatedUser).toThrow('User not available')
    })
  })
})
