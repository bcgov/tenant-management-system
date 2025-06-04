import { reactive, ref } from 'vue';
import { logger } from '@/utils/logger'

export interface AppConfig {
  api: {
    baseUrl: string;
  };
  oidc: {
    clientId: string;
    realm: string;
    serverUrl: string;
    logoutUrl: string;
  };
}

// Default config for development
const defaultConfig: AppConfig = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1'
  },
  oidc: {
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'tenant-management-system-6014',
    realm: import.meta.env.VITE_KEYCLOAK_REALM || 'standard',
    serverUrl: import.meta.env.VITE_KEYCLOAK_URL || 'https://dev.loginproxy.gov.bc.ca/auth',
    logoutUrl: import.meta.env.VITE_KEYCLOAK_LOGOUT_URL || 'https://dev.loginproxy.gov.bc.ca/auth/realms/standard/protocol/openid-connect/logout'
  }
};

// Create reactive config
export const config = reactive<AppConfig>({...defaultConfig});
export const configLoaded = ref(false);

// Load config at runtime
export async function loadConfig(): Promise<void> {
  try {
    // First try loading from the mounted ConfigMap
    const response = await fetch('/config/default.json');
    if (response.ok) {
      const runtimeConfig = await response.json();
      Object.assign(config, runtimeConfig);
      logger.info('Runtime configuration loaded from ConfigMap');
      configLoaded.value = true;
      return;
    }
  } catch (error) {
    logger.warning('Failed to load from ConfigMap');
  }
  
  configLoaded.value = true;
}