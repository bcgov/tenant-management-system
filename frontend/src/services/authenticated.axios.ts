import axios from 'axios'

import { config } from '@/services/config.service'
import { useAuthStore } from '@/stores/useAuthStore'

/**
 * Create an Axios instance with authentication and default config.
 *
 * @param {number} [timeout=60000] Milliseconds before timing out the
 *     request.
 * @returns {import('axios').AxiosInstance} An Axios instance.
 */
export function authenticatedAxios(timeout = 60000) {
  const instance = axios.create({ timeout })

  instance.interceptors.request.use(
    (cfg) => {
      cfg.baseURL = config.api.baseUrl

      // If the user is authenticated, add the bearer token to the request.
      const authStore = useAuthStore()
      if (authStore.authenticated) {
        cfg.headers.Authorization = `Bearer ${authStore.keycloak?.token}`
      }

      return cfg
    },
    // Ensure all errors are proper Error objects. If the error is already an
    // Error, return it directly. Otherwise, create a new Error with the string
    // representation and preserve the original.
    (error) => {
      const authStore = useAuthStore()
      if (error?.code === 'ERR_NETWORK') {
        authStore.loggedOut = true
        authStore.authenticated = false
        authStore.token = ''
        authStore.user = null
        globalThis.location.href = '/'
        return Promise.reject(
          new Error('Network Error: Unable to reach the API server'),
        )
      }
      return Promise.reject(
        error instanceof Error
          ? error
          : Object.assign(new Error(String(error)), { originalError: error }),
      )
    },
  )

  return instance
}
