import Keycloak from 'keycloak-js'

import { logError, logMessage, logWarning } from '@/plugins/console'
import type { User } from '@/types/User'

const keycloak = new Keycloak({
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  url: import.meta.env.VITE_KEYCLOAK_URL,
})

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
    id: keycloak.tokenParsed?.sub ?? '',
    firstName: keycloak.tokenParsed?.given_name,
    lastName: keycloak.tokenParsed?.family_name,
    displayName: keycloak.tokenParsed?.display_name,
    userName: keycloak.tokenParsed?.idir_username,
    ssoUserId: keycloak.tokenParsed?.idir_user_guid,
    email: keycloak.tokenParsed?.email,
  }
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
 * Logs out the user and clears local storage and session storage.
 */
export const logout = () => {
  // TODO: used below
  // const logoutUrl = import.meta.env.VITE_KEYCLOAK_LOGOUT_URL
  // const idToken = keycloak.idToken
  keycloak
    .logout({
      redirectUri: window.location.origin,
      // TODO: this doesn't exist in the KeycloakLogoutOptions object
      // url: `${logoutUrl}?post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}&id_token_hint=${idToken}`,
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
