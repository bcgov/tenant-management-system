import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ConfigError, config, loadConfig } from '@/services/config.service'

const mockFetch = (body: string, ok = true) => {
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

const setValidEnv = () => {
  import.meta.env.VITE_API_BASE_URL = 'https://api.example.com'
  import.meta.env.VITE_DISABLE_RUNTIME_CONFIG = 'true'
  import.meta.env.VITE_KEYCLOAK_CLIENT_ID = 'client-id'
  import.meta.env.VITE_KEYCLOAK_HINT_BCEID_BUSINESS = 'business-bceid'
  import.meta.env.VITE_KEYCLOAK_HINT_IDIR = 'idir'
  import.meta.env.VITE_KEYCLOAK_LOGOUT_URL = 'https://logout.example.com'
  import.meta.env.VITE_KEYCLOAK_REALM = 'myrealm'
  import.meta.env.VITE_KEYCLOAK_URL = 'https://auth.example.com'
  import.meta.env.VITE_LINK_CONTACT_US = 'https://contact-us.example.com'
  import.meta.env.VITE_LINK_DOCUMENTATION = 'https://documentation.example.com'
  import.meta.env.VITE_LINK_NOTIFY = 'https://notify.example.com'
  import.meta.env.VITE_LINK_SUBMIT = 'https://submit.example.com'
  import.meta.env.VITE_LINK_WORKFLOW = 'https://workflow.example.com'
}

describe('loadConfig', () => {
  describe('environment variable path)', () => {
    beforeEach(() => {
      setValidEnv()
    })

    it('loads config successfully with all fields set', async () => {
      await loadConfig()

      expect(config.api.baseUrl).toBe('https://api.example.com')
      expect(config.link.contactUs).toBe('https://contact-us.example.com')
      expect(config.link.documentation).toBe(
        'https://documentation.example.com',
      )
      expect(config.link.notify).toBe('https://notify.example.com')
      expect(config.link.submit).toBe('https://submit.example.com')
      expect(config.link.workflow).toBe('https://workflow.example.com')
      expect(config.oidc.clientId).toBe('client-id')
      expect(config.oidc.hintBceidBusiness).toBe('business-bceid')
      expect(config.oidc.hintIdir).toBe('idir')
      expect(config.oidc.logoutUrl).toBe('https://logout.example.com')
      expect(config.oidc.realm).toBe('myrealm')
      expect(config.oidc.serverUrl).toBe('https://auth.example.com')
    })

    it('throws when a field is missing', async () => {
      import.meta.env.VITE_API_BASE_URL = ''

      const error = await loadConfig().catch((e) => e)

      expect(error).toBeInstanceOf(ConfigError)
      expect(error.message).toMatch(/api\.baseUrl/)
    })

    it('throws listing multiple missing fields', async () => {
      import.meta.env.VITE_API_BASE_URL = ''
      import.meta.env.VITE_KEYCLOAK_REALM = ''

      const error = await loadConfig().catch((e) => e)

      expect(error).toBeInstanceOf(ConfigError)
      expect(error.message).toMatch(/api\.baseUrl/)
      expect(error.message).toMatch(/oidc\.realm/)
    })
  })

  describe('fetch path', () => {
    const validFetchConfig = {
      api: { baseUrl: 'https://api.example.com' },
      link: {
        contactUs: 'https://contact-us.example.com',
        documentation: 'https://documentation.example.com',
        notify: 'https://notify.example.com',
        submit: 'https://submit.example.com',
        workflow: 'https://workflow.example.com',
      },
      oidc: {
        clientId: 'client-id',
        hintBceidBusiness: 'business-bceid',
        hintIdir: 'idir',
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
      expect(config.link.contactUs).toBe('https://contact-us.example.com')
      expect(config.link.documentation).toBe(
        'https://documentation.example.com',
      )
      expect(config.link.notify).toBe('https://notify.example.com')
      expect(config.link.submit).toBe('https://submit.example.com')
      expect(config.link.workflow).toBe('https://workflow.example.com')
      expect(config.oidc.clientId).toBe('client-id')
      expect(config.oidc.hintBceidBusiness).toBe('business-bceid')
      expect(config.oidc.hintIdir).toBe('idir')
      expect(config.oidc.logoutUrl).toBe('https://logout.example.com')
      expect(config.oidc.realm).toBe('myrealm')
      expect(config.oidc.serverUrl).toBe('https://auth.example.com')
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
