import axios from 'axios'

import { useAuthStore } from '@/stores/useAuthStore'

/**
 * Returns an Axios instance with auth header and preconfiguration
 *
 * @param {integer} [timeout=60000] Number of milliseconds before timing out the
 *     request
 * @returns {object} An axios instance
 */
export function authenticatedAxios(timeout = 60000) {
  const axiosOptions = { timeout: timeout }
  const instance = axios.create(axiosOptions)

  instance.interceptors.request.use(
    (cfg) => {
      const authStore = useAuthStore()

      if (authStore.authenticated) {
        cfg.headers.Authorization = `Bearer ${authStore.keycloak?.token}`
      }

      return cfg
    },
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
