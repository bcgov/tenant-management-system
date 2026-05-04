import axios, { type AxiosInstance } from 'axios'

import { SessionExpiredError } from '@/errors/SessionExpiredError'
import { config } from '@/services/config.service'
import { logApiError } from '@/services/utils'
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

    const authStore = useAuthStore()

    // If the user session is already expired, do not make the request.
    if (authStore.isSessionExpired) {
      throw new SessionExpiredError()
    }

    // If the user is authenticated, add the bearer token to the request.
    if (authStore.isAuthenticated) {
      // Ensure the access token is fresh before calling the backend.
      await authStore.ensureFreshToken()

      // If the access token refresh failed due to an expired refresh token, do
      // not make the request.
      if (authStore.isSessionExpired) {
        throw new SessionExpiredError()
      }

      cfg.headers.Authorization = `Bearer ${authStore.getAccessToken()}`
    }

    return cfg
  })

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      logApiError('API request failed', error)

      // Swallow the error if it's a session expiration, as the app will handle
      // it globally by redirecting to the login page and showing a message.
      if (error instanceof SessionExpiredError) {
        return new Promise(() => {})
      }

      return Promise.reject(error)
    },
  )

  return instance
}
