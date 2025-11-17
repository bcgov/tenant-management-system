import Keycloak from 'keycloak-js'
import { defineStore } from 'pinia'

import { SsoUser, User } from '@/models'
import { config, configLoaded } from '@/services/config.service'
import { logger } from '@/utils/logger'
import { ROLES } from '@/utils/constants'

let refreshTimer: number | undefined

/**
 * Pinia store for managing user authentication state via Keycloak.
 *
 * This store handles:
 * - Initializing and configuring Keycloak
 * - Managing login and logout flows
 * - Persisting the authenticated user's identity and token
 * - Automatically refreshing tokens
 *
 * It exposes:
 * - `authenticated`: Boolean indicating login status
 * - `user`: The parsed `User` object (or `null`)
 * - `token`: The current access token string
 * - `keycloak`: The raw Keycloak instance for advanced usage
 *
 * It also provides convenient getters for accessing:
 * - `authenticatedUser`: A guaranteed non-null user (throws if not available)
 * - `getUser`: The current user (or `null`)
 * - `isAuthenticated`: Whether the user is logged in
 *
 * Typical usage involves calling `initKeycloak()` on app startup, and then
 * relying on the state and getters in your components and services.
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    /**
     * Whether the user is currently authenticated via Keycloak.
     */
    authenticated: false,

    /**
     * The Keycloak instance used for authentication.
     * TODO: This never should have been allowed to be null. Fix it.
     */
    keycloak: null as Keycloak | null,

    /**
     * The current Keycloak JWT token as a string, or an empty string if not
     * authenticated.
     */
    token: '' as string,

    /**
     * The parsed user object extracted from the Keycloak token, or `null` if
     * not yet available.
     */
    user: null as User | null,
  }),

  getters: {
    /**
     * Getter for the authenticated user that throws an exception if the user
     * is not yet available.
     *
     * This allows calling code to assume a logged-in state without repeatedly
     * checking if `state.user` is `null`. It simplifies logic in components or
     * services that require the user to be authenticated.
     *
     * This should only be used in places where authentication has already been
     * guaranteed (e.g., after login, in protected routes, etc.).
     *
     * @param state - The state for this store
     * @returns The authenticated `User` object
     * @throws {Error} If the user is not yet available (e.g., before login)
     */
    authenticatedUser: (state): User => {
      if (!state.user) {
        throw new Error('User is not available yet')
      }

      return state.user
    },

    /**
     * Getter for the current user.
     *
     * Returns the current `User` object from the store, or `null` if the user
     * is not logged in. This is the safe way to access user information in
     * places where the user might not be authenticated yet.
     *
     * @param state - The state for this store
     * @returns The current `User` or `null` if not logged in
     */
    getUser: (state) => state.user,

    /**
     * Getter for the authentication status.
     *
     * Indicates whether the user is currently authenticated. Useful for
     * conditionally showing authenticated-only features in the UI.
     *
     * @param state - The state for this store
     * @returns `true` if the user is authenticated, `false` otherwise
     */
    isAuthenticated: (state) => state.authenticated,

    /**
     * Checks if the current user has operations admin privileges.
     *
     * @param state - The state for this store
     * @returns `true` if user is an operations admin, `false` otherwise
     */
    isOperationsAdmin: (state): boolean => {
      if (!state.authenticated || !state.keycloak?.tokenParsed) {
        return false
      }

      const clientRoles = state.keycloak.tokenParsed.client_roles || []

      return clientRoles.includes(ROLES.OPERATIONS_ADMIN.value)
    },
  },

  actions: {
    /**
     * Initializes Keycloak and sets the authenticated if successful.
     */
    async initKeycloak(): Promise<void> {
      try {
        if (!configLoaded.value) {
          logger.error('Configuration not loaded yet')
          throw new Error('Configuration not loaded')
        }

        // TODO - not sure why this was committed, but it needs to be fixed.
        if (!this.keycloak) {
          this.keycloak = new Keycloak({
            clientId: config.oidc.clientId,
            realm: config.oidc.realm,
            url: config.oidc.serverUrl,
          })
        }

        const authenticated = await this.keycloak.init({
          // onLoad: 'login-required',
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri:
            globalThis.location.origin + '/silent-check-sso.html',
          checkLoginIframe: false,
        })

        // if (!authenticated) {
        //   logger.warning('User not authenticated')
        //   throw new Error('User not authenticated')
        // }

        this.authenticated = authenticated
        if (authenticated) {
          this.token = this.keycloak.token ?? ''
          this.user = this.parseUserFromToken()
          this.scheduleTokenRefresh()
          logger.info('Keycloak authenticated')
        }
      } catch (error) {
        logger.error('Keycloak init failed', error)
        throw error
      }
    },

    /**
     * Initiates the login process using Keycloak.
     *
     * Redirects the user to the Keycloak login screen. Upon successful login,
     * Keycloak will redirect back to the app.
     */
    login(options: object = {}): void {
      this.keycloak?.login(options)
    },

    /**
     * Logs out the user and clears local/session storage and token refresh
     * timer.
     *
     * This will trigger a redirect to Keycloak's logout endpoint and then back
     * to the app. It also clears authentication state from the store and
     * browser storage.
     */
    logout(): string | undefined {
      // For whatever reason the components in this app are getting cancelled with the logout method
      // so instead returning a string to use as a href
      const q = this.keycloak?.createLogoutUrl({
        redirectUri: globalThis.location.origin,
      }) // Ensure redirectUri is set
      return q
    },

    /**
     * Parses the user data from the current Keycloak token.
     *
     * This method extracts claims like name, email, and GUID from the decoded
     * token and maps them to a `User` object. If no token is present, it
     * returns `null`.
     *
     * @returns The parsed `User` object or `null` if no token is present.
     */
    parseUserFromToken(): User | null {
      const parsed = this.keycloak?.tokenParsed
      if (!parsed) {
        return null
      }

      const ssoUser = new SsoUser(
        parsed.idir_user_guid,
        parsed.idir_username,
        parsed.given_name,
        parsed.family_name,
        parsed.display_name,
        parsed.email,
      )

      return new User(parsed.idir_user_guid, ssoUser, [])
    },

    /**
     * Sets up a recurring timer to refresh the Keycloak token.
     *
     * Attempts to refresh the token every 10 seconds. If the token is
     * successfully refreshed, the store's `token` and `user` state are updated.
     * If the refresh fails, the error is logged.
     */
    scheduleTokenRefresh(): void {
      if (refreshTimer) {
        clearTimeout(refreshTimer)
      }

      refreshTimer = window.setTimeout(() => {
        this.keycloak
          ?.updateToken(30)
          .then((refreshed) => {
            if (refreshed) {
              this.token = this.keycloak?.token ?? ''
              this.user = this.parseUserFromToken()
              logger.info('Token successfully refreshed')
            }
          })
          .catch((error) => {
            logger.error('Failed to refresh token', error)
          })
          .finally(() => {
            this.scheduleTokenRefresh()
          })
      }, 10000)
    },
  },
})
