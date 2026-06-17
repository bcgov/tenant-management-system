import { reactive } from 'vue'

export class ConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigError'
  }
}

export interface AppConfig {
  api: {
    baseUrl: string
  }
  oidc: {
    clientId: string
    hintBceidBusiness: string
    hintIdir: string
    logoutUrl: string
    realm: string
    serverUrl: string
  }
}

/**
 * Validate the shape of a raw config object against the AppConfig interface. If
 * validation fails, it throws a list of all missing fields.
 *
 * @param raw - The raw config object to validate
 * @returns The validated config object typed as AppConfig
 * @throws {ConfigError} If the config is missing required fields or is not an
 * object
 */
const validateConfig = (raw: unknown): AppConfig => {
  if (!raw || typeof raw !== 'object') {
    throw new ConfigError('Config must be an object')
  }

  const config = raw as Record<string, unknown>
  const api = config.api as Record<string, unknown> | undefined
  const oidc = config.oidc as Record<string, unknown> | undefined

  const required: [string, unknown][] = [
    ['api.baseUrl', api?.baseUrl],
    ['oidc.clientId', oidc?.clientId],
    ['oidc.hintBceidBusiness', oidc?.hintBceidBusiness],
    ['oidc.hintIdir', oidc?.hintIdir],
    ['oidc.logoutUrl', oidc?.logoutUrl],
    ['oidc.realm', oidc?.realm],
    ['oidc.serverUrl', oidc?.serverUrl],
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

export const config = reactive<AppConfig>({} as AppConfig)

export async function loadConfig(): Promise<void> {
  let loadedConfig
  if (import.meta.env.VITE_DISABLE_RUNTIME_CONFIG === 'true') {
    loadedConfig = {
      api: {
        baseUrl: import.meta.env.VITE_API_BASE_URL,
      },
      oidc: {
        clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
        hintBceidBusiness: import.meta.env.VITE_KEYCLOAK_HINT_BCEID_BUSINESS,
        hintIdir: import.meta.env.VITE_KEYCLOAK_HINT_IDIR,
        logoutUrl: import.meta.env.VITE_KEYCLOAK_LOGOUT_URL,
        realm: import.meta.env.VITE_KEYCLOAK_REALM,
        serverUrl: import.meta.env.VITE_KEYCLOAK_URL,
      },
    }
  } else {
    const response = await fetch('/config/default.json')
    if (!response.ok) {
      throw new ConfigError(
        `Failed to load config from ` +
          `${globalThis.location.origin}/config/default.json: ` +
          `${response.status} ${response.statusText}`,
      )
    }

    // Handle an HTML response, such as /index.html on 404, or an error page.
    const text = await response.text()
    try {
      loadedConfig = JSON.parse(text)
    } catch {
      throw new ConfigError(
        // Be verbose, as it might be useful.
        `Config at ${globalThis.location.origin}/config/default.json is not ` +
          `valid JSON:\n${text}`,
      )
    }
  }

  Object.assign(config, validateConfig(loadedConfig))
}
