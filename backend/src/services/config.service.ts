export class ConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigError'
  }
}

export interface AppConfig {
  allowedOrigins: string[]
  bcgovSsoApi: {
    clientId: string
    clientSecret: string
    tokenUrl: string
    url: string
    urlBceid: string
  }
  logLevel: string
  oidc: {
    issuer: string
    jwksUri: string
    tmsAudience: string
  }
  port: number
  postgres: {
    database: string
    host: string
    password: string
    port: number
    user: string
  }
}

/**
 * Validate the shape of a raw config object against the AppConfig interface. If
 * validation fails, it throws a list of all missing fields.
 *
 * @param raw The raw config object to validate
 * @returns The validated config object typed as AppConfig
 * @throws {ConfigError} If the config is missing required fields or is not an
 * object
 */
function validateConfig(raw: unknown): AppConfig {
  const config = raw as Record<string, unknown>
  const bcgovSsoApi = config.bcgovSsoApi as Record<string, unknown> | undefined
  const oidc = config.oidc as Record<string, unknown> | undefined
  const postgres = config.postgres as Record<string, unknown> | undefined

  const required: [string, unknown][] = [
    ['ALLOWED_ORIGINS', config.allowedOrigins],
    ['BCGOV_SSO_API_CLIENT_ID', bcgovSsoApi?.clientId],
    ['BCGOV_SSO_API_CLIENT_SECRET', bcgovSsoApi?.clientSecret],
    ['BCGOV_SSO_API_URL', bcgovSsoApi?.url],
    ['BCGOV_SSO_API_URL_BCEID', bcgovSsoApi?.urlBceid],
    ['BCGOV_TOKEN_URL', bcgovSsoApi?.tokenUrl],
    ['ISSUER', oidc?.issuer],
    ['JWKS_URI', oidc?.jwksUri],
    ['LOG_LEVEL', config.logLevel],
    ['PORT', config.port],
    ['POSTGRES_DATABASE', postgres?.database],
    ['POSTGRES_HOST', postgres?.host],
    ['POSTGRES_PASSWORD', postgres?.password],
    ['POSTGRES_PORT', postgres?.port],
    ['POSTGRES_USER', postgres?.user],
    ['TMS_AUDIENCE', oidc?.tmsAudience],
  ]

  const missing = required
    .filter(([, value]) => !value)
    .map(([key]) => ` - ${key}`)
  if (missing.length) {
    throw new ConfigError(
      `Config is missing required fields:\n${missing.join('\n')}`,
    )
  }

  return raw as AppConfig
}

export const config = {} as AppConfig

export function loadConfig() {
  // Guard against being called multiple times. The app.ts needs to load the
  // config for running the app, but the ormconfig.ts also needs to load it for
  // running migrations.
  if (Object.keys(config).length > 0) {
    return
  }

  const loadedConfig = {
    allowedOrigins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['*'],
    bcgovSsoApi: {
      clientId: process.env.BCGOV_SSO_API_CLIENT_ID,
      clientSecret: process.env.BCGOV_SSO_API_CLIENT_SECRET,
      tokenUrl: process.env.BCGOV_TOKEN_URL,
      url: process.env.BCGOV_SSO_API_URL,
      urlBceid: process.env.BCGOV_SSO_API_URL_BCEID,
    },
    logLevel: process.env.LOG_LEVEL?.toLowerCase() || 'info',
    oidc: {
      issuer: process.env.ISSUER,
      jwksUri: process.env.JWKS_URI,
      tmsAudience: process.env.TMS_AUDIENCE,
    },
    port: process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 4144,
    postgres: {
      database: process.env.POSTGRES_DATABASE,
      host: process.env.POSTGRES_HOST,
      password: process.env.POSTGRES_PASSWORD,
      port: process.env.POSTGRES_PORT
        ? Number.parseInt(process.env.POSTGRES_PORT, 10)
        : 5432,
      user: process.env.POSTGRES_USER,
    },
  }

  Object.assign(config, validateConfig(loadedConfig))
}
