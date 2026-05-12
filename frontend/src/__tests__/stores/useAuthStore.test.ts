import { type KeycloakTokenParsed } from 'keycloak-js'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/stores/useAuthStore'
import { ROLES } from '@/utils/constants'

vi.mock('@/services/config.service', () => ({
  config: {
    api: { baseUrl: 'http://api' },
    oidc: { clientId: 'test', realm: 'test', serverUrl: 'http://localhost' },
  },
}))

const mockInit = vi.fn().mockResolvedValue(true)
const mockLogin = vi.fn()
const mockLogout = vi.fn()
const mockUpdateToken = vi.fn().mockResolvedValue(true)
let mockTokenParsed: KeycloakTokenParsed | null = {} as KeycloakTokenParsed

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
    identity_provider: 'bceidbasic',
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

    it('does not set a user when tokenParsed is null after authentication', async () => {
      const store = useAuthStore()
      mockTokenParsed = null

      await store.init()

      expect(() => store.authenticatedUser).toThrow('User not available')
    })

    it('does not set a user when Keycloak reports unauthenticated', async () => {
      const store = useAuthStore()
      mockInit.mockResolvedValue(false)

      await store.init()

      expect(() => store.authenticatedUser).toThrow('User not available')
    })

    it('does not set a user when JWT IdP is missing', async () => {
      const store = useAuthStore()
      mockTokenParsed = {}

      await expect(store.init()).rejects.toThrow(
        'Authentication is missing the identity_provider',
      )
    })

    it('rethrows when Keycloak init fails', async () => {
      const store = useAuthStore()
      mockInit.mockRejectedValue(new Error('Keycloak Init Failed'))

      await expect(store.init()).rejects.toThrow('Keycloak Init Failed')
    })
  })

  describe('accessToken', () => {
    it('returns the access token from Keycloak', async () => {
      mockTokenParsed = makeIdirToken()
      const store = useAuthStore()
      await store.init()

      const token = store.getAccessToken()

      expect(token).toBe('fake-token')
    })

    it('throws an exception when not initialized', async () => {
      mockTokenParsed = makeIdirToken()
      const store = useAuthStore()

      expect(() => store.getAccessToken()).toThrow('Keycloak not initialized')
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

      expect(store.isSessionExpired).toBe(true)
      expect(() => store.authenticatedUser).toThrow('User not available')
    })
  })

  describe('isAuthenticated', () => {
    it('returns true when a user is set', async () => {
      mockTokenParsed = makeIdirToken()
      const store = useAuthStore()
      await store.init()

      expect(store.isAuthenticated).toBe(true)
    })

    it('returns false when no user is set', async () => {
      const store = useAuthStore()

      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('login', () => {
    it('calls keycloak login with provided options', async () => {
      mockTokenParsed = makeIdirToken()
      const store = useAuthStore()
      await store.init()

      store.login({ idpHint: 'idir' })

      expect(mockLogin).toHaveBeenCalledWith({ idpHint: 'idir' })
    })

    it('calls keycloak login with no options by default', async () => {
      mockTokenParsed = makeIdirToken()
      const store = useAuthStore()
      await store.init()

      store.login()

      expect(mockLogin).toHaveBeenCalledWith({})
    })
  })

  describe('logout', () => {
    it('calls keycloak logout with the origin as redirect URI', async () => {
      mockTokenParsed = makeIdirToken()
      const store = useAuthStore()
      await store.init()

      store.logout()

      expect(mockLogout).toHaveBeenCalledWith({
        redirectUri: 'http://localhost',
      })
    })
  })
})
