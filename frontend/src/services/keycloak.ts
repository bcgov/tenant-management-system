import Keycloak from 'keycloak-js'

import { logError, logMessage, logWarning } from '@/plugins/console'
import type { User } from '@/types/User'

const keycloak = new Keycloak({
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  url: import.meta.env.VITE_KEYCLOAK_URL,
})

// Holds the refresh timer so we can cancel it on logout or re-init
let refreshTimer: number | undefined

/**
 * Returns the current authentication token.
 * @returns {string | undefined} The authentication token.
 */
export const getToken = (): string | undefined => keycloak.token

/**
 * Returns the current user's information.
 * @returns {User} The user's information.
 */
export const getUser = (): User => {
  return {
    id: 'TODO',
    firstName: keycloak.tokenParsed?.given_name,
    lastName: keycloak.tokenParsed?.family_name,
    displayName: keycloak.tokenParsed?.display_name,
    userName: keycloak.tokenParsed?.idir_username,
    ssoUser: {
      displayName: 'TODO',
      email: 'TODO',
    },
    ssoUserId: keycloak.tokenParsed?.idir_user_guid,
    email: keycloak.tokenParsed?.email,
    roles: [],
  }
}

/**
 * Schedules a token refresh based on token expiration time.
 */
const scheduleTokenRefresh = () => {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
  }

  refreshTimer = window.setTimeout(() => {
    keycloak
      .updateToken(30)
      .then((refreshed) => {
        if (refreshed) {
          logMessage('Token successfully refreshed')
        }
      })
      .catch((error) => {
        logError('Failed to refresh token', error)
      })
      .finally(() => {
        scheduleTokenRefresh()
      })
  }, 10000)
}

/**
 * Initializes Keycloak and sets the authenticated if successful.
 */
export const initKeycloak = async (): Promise<void> => {
  try {
    const authenticated = await keycloak.init({
      onLoad: 'login-required',
      checkLoginIframe: false,
    })

    if (!authenticated) {
      logWarning('User not authenticated')
      throw new Error('User not authenticated')
    }

    logMessage('Keycloak authenticated')
    scheduleTokenRefresh()
  } catch (error) {
    logError('Keycloak init failed', error)

    throw error
  }
}

/**
 * Checks if the user is logged in.
 * @returns {boolean} True if the user is logged in, otherwise false.
 */
export const isLoggedIn = (): boolean => keycloak.authenticated === true

/**
 * Initiates the login process using Keycloak.
 */
export const login = () => keycloak.login()

/**
 * Logs out the user and clears local/session storage and token refresh timer.
 */
export const logout = () => {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = undefined
  }

  keycloak
    .logout({
      redirectUri: window.location.origin,
    })
    .then(() => {
      localStorage.clear()
      sessionStorage.clear()
      logMessage('Logged out and storage cleared')
    })
    .catch((error: Error) => {
      logError('Logout failed', error)
    })
}
