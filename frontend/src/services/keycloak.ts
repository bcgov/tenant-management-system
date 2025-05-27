import Keycloak from 'keycloak-js'

import { logger } from '@/utils/logger'
import { SsoUser } from '@/models/ssouser.model'
import { User } from '@/models/user.model'

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
 *
 * @returns {User} The user's information.
 */
export const getUser = (): User => {
  // TODO: how is this needed?
  const ssoUser = new SsoUser(
    keycloak.tokenParsed?.idir_user_guid,
    keycloak.tokenParsed?.display_name,
    keycloak.tokenParsed?.email,
  )

  return new User(
    'TODO', // TODO: What is the ID for the user?
    keycloak.tokenParsed?.idir_username,
    keycloak.tokenParsed?.given_name,
    keycloak.tokenParsed?.family_name,
    keycloak.tokenParsed?.display_name,
    keycloak.tokenParsed?.email,
    ssoUser,
    [],
  )
}

/**
 * Every ten seconds will call keycloak.updateToken to check if the token
 * expires within 30 seconds. If so, it will be updated.
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
          logger.info('Token successfully refreshed')
        }
      })
      .catch((error) => {
        logger.error('Failed to refresh token', error)
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
      logger.warning('User not authenticated')
      throw new Error('User not authenticated')
    }

    logger.info('Keycloak authenticated')
    scheduleTokenRefresh()
  } catch (error) {
    logger.error('Keycloak init failed', error)

    throw error
  }
}

/**
 * Checks if the user is logged in.
 *
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
      logger.info('Logged out and storage cleared')
    })
    .catch((error: Error) => {
      logger.error('Logout failed', error)
    })
}
