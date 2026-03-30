import { loadConfig, config, ConfigError } from '../../services/config.service'

const validEnv = {
  ALLOWED_ORIGINS: 'http://localhost:3000',
  BCGOV_SSO_API_CLIENT_ID: 'test-client-id',
  BCGOV_SSO_API_CLIENT_SECRET: 'test-client-secret',
  BCGOV_SSO_API_URL: 'http://localhost/sso',
  BCGOV_SSO_API_URL_BCEID: 'http://localhost/sso/bceid',
  BCGOV_TOKEN_URL: 'http://localhost/token',
  ISSUER: 'http://localhost/issuer',
  JWKS_URI: 'http://localhost/jwks',
  LOG_LEVEL: 'info',
  PORT: '4144',
  POSTGRES_DATABASE: 'test',
  POSTGRES_HOST: 'localhost',
  POSTGRES_PASSWORD: 'test',
  POSTGRES_PORT: '5432',
  POSTGRES_USER: 'test',
  TMS_AUDIENCE: 'test-audience',
}

describe('config.service', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
    Object.assign(process.env, validEnv)
    // Reset between tests
    Object.keys(config).forEach(
      (key) => delete (config as unknown as Record<string, unknown>)[key],
    )
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('loadConfig', () => {
    it('loads a valid config', () => {
      loadConfig()
      expect(config.allowedOrigins).toEqual(['http://localhost:3000'])
      expect(config.bcgovSsoApi.clientId).toBe('test-client-id')
      expect(config.bcgovSsoApi.clientSecret).toBe('test-client-secret')
      expect(config.bcgovSsoApi.tokenUrl).toBe('http://localhost/token')
      expect(config.bcgovSsoApi.url).toBe('http://localhost/sso')
      expect(config.bcgovSsoApi.urlBceid).toBe('http://localhost/sso/bceid')
      expect(config.logLevel).toBe('info')
      expect(config.oidc.issuer).toBe('http://localhost/issuer')
      expect(config.oidc.jwksUri).toBe('http://localhost/jwks')
      expect(config.oidc.tmsAudience).toBe('test-audience')
      expect(config.port).toBe(4144)
      expect(config.postgres.database).toBe('test')
      expect(config.postgres.host).toBe('localhost')
      expect(config.postgres.password).toBe('test')
      expect(config.postgres.port).toBe(5432)
      expect(config.postgres.user).toBe('test')
    })

    it('only loads config once when called multiple times', () => {
      loadConfig()
      const originalClientId = config.bcgovSsoApi.clientId
      process.env.BCGOV_SSO_API_CLIENT_ID = 'changed-client-id'

      loadConfig()

      expect(config.bcgovSsoApi.clientId).toBe(originalClientId)
    })

    it('splits ALLOWED_ORIGINS by comma', () => {
      process.env.ALLOWED_ORIGINS =
        'http://localhost:3000,http://localhost:4000'

      loadConfig()

      expect(config.allowedOrigins).toEqual([
        'http://localhost:3000',
        'http://localhost:4000',
      ])
    })

    it('defaults ALLOWED_ORIGINS to wildcard when not set', () => {
      delete process.env.ALLOWED_ORIGINS

      loadConfig()

      expect(config.allowedOrigins).toEqual(['*'])
    })

    it('defaults PORT to 4144 when not set', () => {
      delete process.env.PORT

      loadConfig()

      expect(config.port).toBe(4144)
    })

    it('defaults POSTGRES_PORT to 5432 when not set', () => {
      delete process.env.POSTGRES_PORT

      loadConfig()

      expect(config.postgres.port).toBe(5432)
    })

    it('defaults LOG_LEVEL to info when not set', () => {
      delete process.env.LOG_LEVEL

      loadConfig()

      expect(config.logLevel).toBe('info')
    })

    it('lowercases LOG_LEVEL', () => {
      process.env.LOG_LEVEL = 'ERROR'

      loadConfig()

      expect(config.logLevel).toBe('error')
    })

    it('parses PORT as an integer', () => {
      process.env.PORT = '8080'

      loadConfig()

      expect(config.port).toBe(8080)
    })

    it('parses POSTGRES_PORT as an integer', () => {
      process.env.POSTGRES_PORT = '5433'

      loadConfig()

      expect(config.postgres.port).toBe(5433)
    })

    it.each([
      'BCGOV_SSO_API_CLIENT_ID',
      'BCGOV_SSO_API_CLIENT_SECRET',
      'BCGOV_SSO_API_URL',
      'BCGOV_SSO_API_URL_BCEID',
      'BCGOV_TOKEN_URL',
      'ISSUER',
      'JWKS_URI',
      'POSTGRES_DATABASE',
      'POSTGRES_HOST',
      'POSTGRES_PASSWORD',
      'POSTGRES_USER',
      'TMS_AUDIENCE',
    ])('throws ConfigError when %s is missing', (key) => {
      delete process.env[key]
      expect(() => loadConfig()).toThrow(ConfigError)
    })
  })
})
