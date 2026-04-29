import axios, { type AxiosInstance } from 'axios'

import { config } from '@/services/config.service'
import { useAuthStore } from '@/stores/useAuthStore'

/**
 * Create an Axios instance with authentication and default config.
 *
 * @param timeout - Milliseconds before timing out the request. Default is 60000
 *     (1 minute).
 * @returns An Axios instance with auth headers and the given timeout.
 */
export function authenticatedAxios(timeout = 60000): AxiosInstance {
  const instance = axios.create({ timeout })

  instance.interceptors.request.use(async (cfg) => {
    cfg.baseURL = config.api.baseUrl

    // If the user is authenticated, add the bearer token to the request.
    const authStore = useAuthStore()
    if (authStore.authenticatedUser !== null) {
      await authStore.ensureFreshToken()
      cfg.headers.Authorization = `Bearer ${authStore.getAccessToken()}`
    }

    return cfg
  })

  return instance
}
