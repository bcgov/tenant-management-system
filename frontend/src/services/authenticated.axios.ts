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
  const axiosOptions = {
    baseURL: config.api.baseUrl,
    timeout: timeout,
  }

  const instance = axios.create(axiosOptions)

  instance.interceptors.request.use(
    (cfg) => {
      const authStore = useAuthStore()

      // If the user is authenticated, add the bearer token to the request.
      if (authStore.authenticated) {
        cfg.headers.Authorization = `Bearer ${authStore.keycloak?.token}`
      }

      return cfg
    },
    // Ensure all errors are proper Error objects. If the error is already an
    // Error, return it directly. Otherwise, create a new Error with the string
    // representation and preserve the original.
    (error) => {
      return Promise.reject(
        error instanceof Error
          ? error
          : Object.assign(new Error(String(error)), { originalError: error }),
      )
    },
  )

  return instance
}
