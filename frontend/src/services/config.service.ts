import { reactive, ref } from 'vue'

import { logger } from '@/utils/logger'

export interface AppConfig {
  api: {
    baseUrl: string
  }
  oidc: {
    clientId: string
    realm: string
    serverUrl: string
    logoutUrl: string
  }
}

// Default config for development
const defaultConfig: AppConfig = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  },
  oidc: {
    clientId:
      import.meta.env.VITE_KEYCLOAK_CLIENT_ID ||
      'tenant-management-system-6014',
    realm: import.meta.env.VITE_KEYCLOAK_REALM || 'standard',
    serverUrl:
      import.meta.env.VITE_KEYCLOAK_URL ||
      'https://dev.loginproxy.gov.bc.ca/auth',
    logoutUrl:
      import.meta.env.VITE_KEYCLOAK_LOGOUT_URL ||
      'https://dev.loginproxy.gov.bc.ca/auth/realms/standard/protocol/openid-connect/logout',
  },
}

// Create reactive config
export const config = reactive<AppConfig>({ ...defaultConfig })
export const configLoaded = ref(false)

// Load config at runtime
export async function loadConfig(): Promise<void> {
  if (configLoaded.value) {
    return
  }

  if (import.meta.env.VITE_DISABLE_RUNTIME_CONFIG === 'true') {
    logger.info('Runtime configuration loading is disabled')
    configLoaded.value = true

    return
  }

  try {
    // First try loading from the mounted ConfigMap
    const response = await fetch('/config/default.json')
    if (response.ok) {
      const runtimeConfig = await response.json()
      Object.assign(config, runtimeConfig)
      logger.info('Runtime configuration loaded from ConfigMap')
      configLoaded.value = true

      return
    } else {
      throw new Error(
        `Failed to load config: ${response.status} ${response.statusText}`,
      )
    }
  } catch (error: unknown) {
    logger.error('Failed to load from ConfigMap', error)

    setTimeout(() => {
      loadConfig().catch((e) => {
        logger.error('Retry attempt failed:', e)
      })
    }, 2000)
  }
}
