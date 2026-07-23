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
let mockToken: string | null = ''
let mockTokenParsed: KeycloakTokenParsed | null = {}

vi.mock('keycloak-js', () => ({
  default: class MockKeycloak {
    init = mockInit
    login = mockLogin
    logout = mockLogout
    get token() {
      return mockToken
    }
    get tokenParsed() {
      return mockTokenParsed
    }
    updateToken = mockUpdateToken
  },
}))

const makeIdirToken = (
  overrides: Partial<KeycloakTokenParsed> = {},
): KeycloakTokenParsed => ({
  display_name: 'idir-display-name',
  email: 'idir-email',
  family_name: 'idir-family-name',
  given_name: 'idir-given-name',
  identity_provider: 'idir',
  idir_user_guid: 'idir-idir-user-guid',
  idir_username: 'idir-idir-username',
  ...overrides,
})

const makeBceidBusinessToken = (
  overrides: Partial<KeycloakTokenParsed> = {},
): KeycloakTokenParsed => ({
  bceid_business_guid: 'bceid-business-bceid-business-guid',
  bceid_user_guid: 'bceid-business-bceid-user-guid',
  bceid_username: 'bceid-business-bceid-username',
  identity_provider: 'bceidbusiness',
  ...overrides,
})

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('location', { origin: 'http://localhost' })

    mockInit.mockClear()
    mockInit.mockResolvedValue(true)

    mockLogin.mockClear()

    mockLogout.mockClear()
    mockUpdateToken.mockClear()
    mockUpdateToken.mockResolvedValue(true)

    mockTokenParsed = {}
  })

  describe('init', () => {
    it('maps idir user from the token', async () => {
      const store = useAuthStore()
      mockTokenParsed = makeIdirToken({
        display_name: 'idirDisplayName',
        email: 'idirEmail',
        family_name: 'idirFamilyName',
        given_name: 'idirGivenName',
        identity_provider: 'idir',
        idir_user_guid: 'idirIdirUserGuid',
        idir_username: 'idirIdirUsername',
      })

      await store.init()

      expect(store.authenticatedUser.id).toBe('')
      expect(store.authenticatedUser.roles).toEqual([])
      expect(store.authenticatedUser.ssoUser.displayName).toBe(
        'idirDisplayName',
      )
      expect(store.authenticatedUser.ssoUser.email).toBe('idirEmail')
      expect(store.authenticatedUser.ssoUser.firstName).toBe('idirGivenName')
      expect(store.authenticatedUser.ssoUser.lastName).toBe('idirFamilyName')
      expect(store.authenticatedUser.ssoUser.ssoUserId).toBe('idirIdirUserGuid')
      expect(store.authenticatedUser.ssoUser.userName).toBe('idirIdirUsername')
    })

    it('handles empty idir client roles in the token', async () => {
      const store = useAuthStore()
      mockTokenParsed = makeIdirToken({
        client_roles: [],
      })

      await store.init()

      expect(store.authenticatedUser.roles).toHaveLength(0)
    })

    it('maps idir client roles from the token', async () => {
      const store = useAuthStore()
      mockTokenParsed = makeIdirToken({
        client_roles: [ROLES.OPERATIONS_ADMIN.value],
      })

      await store.init()

      expect(store.authenticatedUser.roles).toHaveLength(1)
      expect(store.authenticatedUser.roles[0].description).toBe(
        ROLES.OPERATIONS_ADMIN.title,
      )
      expect(store.authenticatedUser.roles[0].id).toBe('')
      expect(store.authenticatedUser.roles[0].name).toBe(
        ROLES.OPERATIONS_ADMIN.value,
      )
    })

    it('maps business bceid user from the token', async () => {
      const store = useAuthStore()
      mockTokenParsed = makeBceidBusinessToken({
        bceid_business_guid: 'bceidBusinessBceidBusinessGuid',
        bceid_user_guid: 'bceidBusinessBceidUserGuid',
        bceid_username: 'bceidBusinessBceidUsername',
      })

      await store.init()

      expect(store.authenticatedUser.id).toBe('')
      expect(store.authenticatedUser.roles).toEqual([])
      expect(store.authenticatedUser.ssoUser.displayName).toBeUndefined()
      expect(store.authenticatedUser.ssoUser.email).toBeUndefined()
      expect(store.authenticatedUser.ssoUser.firstName).toBeUndefined()
      expect(store.authenticatedUser.ssoUser.lastName).toBeUndefined()
      expect(store.authenticatedUser.ssoUser.idpType).toBe('bceidbusiness')
      expect(store.authenticatedUser.ssoUser.ssoUserId).toBe(
        'bceidBusinessBceidUserGuid',
      )
      expect(store.authenticatedUser.ssoUser.userName).toBe(
        'bceidBusinessBceidUsername',
      )
    })

    it.skip('does not map bceid business client roles from the token', async () => {
      const store = useAuthStore()
      mockTokenParsed = makeBceidBusinessToken({
        client_roles: [ROLES.OPERATIONS_ADMIN.value],
      })

      await store.init()

      expect(store.authenticatedUser.roles).toHaveLength(0)
    })

    it('does not set a user when tokenParsed is null', async () => {
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

    it('does not set a user when JWT IdP is unknown', async () => {
      const store = useAuthStore()
      mockTokenParsed = { identity_provider: 'unknown' }

      await expect(store.init()).rejects.toThrow(
        'Unknown identity provider: "unknown"',
      )
    })

    it('rethrows when Keycloak init fails', async () => {
      const store = useAuthStore()
      mockInit.mockRejectedValueOnce(new Error('Keycloak Init Failed'))

      await expect(store.init()).rejects.toThrow('Keycloak Init Failed')
    })
  })

  describe('accessToken', () => {
    it('returns the access token from Keycloak', async () => {
      mockToken = 'mockToken'
      mockTokenParsed = makeIdirToken()
      const store = useAuthStore()
      await store.init()

      const token = store.getAccessToken()

      expect(token).toBe('mockToken')
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

      mockUpdateToken.mockRejectedValueOnce(new Error('refresh failed'))
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
