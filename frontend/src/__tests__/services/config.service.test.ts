import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ConfigError, config, loadConfig } from '@/services/config.service'

function mockFetch(body: string, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 404,
      statusText: ok ? 'OK' : 'Not Found',
      text: () => Promise.resolve(body),
    }),
  )
}

function setValidEnv() {
  import.meta.env.VITE_API_BASE_URL = 'https://api.example.com'
  import.meta.env.VITE_DISABLE_RUNTIME_CONFIG = 'true'
  import.meta.env.VITE_KEYCLOAK_BASIC_BCEID_HINT = 'basic-bceid'
  import.meta.env.VITE_KEYCLOAK_BUSINESS_BCEID_HINT = 'business-bceid'
  import.meta.env.VITE_KEYCLOAK_CLIENT_ID = 'client-id'
  import.meta.env.VITE_KEYCLOAK_IDIR_HINT = 'idir'
  import.meta.env.VITE_KEYCLOAK_LOGOUT_URL = 'https://logout.example.com'
  import.meta.env.VITE_KEYCLOAK_REALM = 'myrealm'
  import.meta.env.VITE_KEYCLOAK_URL = 'https://auth.example.com'
}

describe('loadConfig (env var path)', () => {
  beforeEach(() => {
    setValidEnv()
  })

  it('loads config successfully with all fields set', async () => {
    await loadConfig()

    expect(config.api.baseUrl).toBe('https://api.example.com')
  })

  it('throws when a field is missing', async () => {
    import.meta.env.VITE_API_BASE_URL = ''

    const error = await loadConfig().catch((e) => e)

    expect(error).toBeInstanceOf(ConfigError)
    expect(error.message).toMatch(/api\.baseUrl/)
  })

  it('throws listing all missing fields', async () => {
    import.meta.env.VITE_API_BASE_URL = ''
    import.meta.env.VITE_KEYCLOAK_REALM = ''

    const error = await loadConfig().catch((e) => e)

    expect(error).toBeInstanceOf(ConfigError)
    expect(error.message).toMatch(/api\.baseUrl/)
    expect(error.message).toMatch(/oidc\.realm/)
  })

  describe('loadConfig (fetch path)', () => {
    const validFetchConfig = {
      api: { baseUrl: 'https://api.example.com' },
      basicBceidBroker: 'basic-bceid',
      businessBceidBroker: 'business-bceid',
      idirBroker: 'idir',
      oidc: {
        clientId: 'client-id',
        logoutUrl: 'https://logout.example.com',
        realm: 'myrealm',
        serverUrl: 'https://auth.example.com',
      },
    }

    beforeEach(() => {
      import.meta.env.VITE_DISABLE_RUNTIME_CONFIG = 'false'
      vi.unstubAllGlobals()
    })

    it('loads config successfully from JSON', async () => {
      mockFetch(JSON.stringify(validFetchConfig))

      await loadConfig()

      expect(config.api.baseUrl).toBe('https://api.example.com')
    })

    it('throws when response is not ok', async () => {
      mockFetch('', false)

      const error = await loadConfig().catch((e) => e)

      expect(error).toBeInstanceOf(ConfigError)
      expect(error.message).toMatch(/404/)
    })

    it('throws when response is HTML', async () => {
      mockFetch('<!DOCTYPE html><html></html>')

      const error = await loadConfig().catch((e) => e)

      expect(error).toBeInstanceOf(ConfigError)
      expect(error.message).toMatch(/not valid JSON/)
    })

    it('throws when response is invalid JSON', async () => {
      mockFetch('{ not valid }')

      const error = await loadConfig().catch((e) => e)

      expect(error).toBeInstanceOf(ConfigError)
      expect(error.message).toMatch(/not valid JSON/)
    })

    it('throws when response is valid JSON but not an object', async () => {
      mockFetch('"just a string"')

      const error = await loadConfig().catch((e) => e)

      expect(error).toBeInstanceOf(ConfigError)
      expect(error.message).toMatch(/Config must be an object/)
    })
  })
})
