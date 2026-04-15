import Keycloak, {
  type KeycloakLoginOptions,
  type KeycloakTokenParsed,
} from 'keycloak-js'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { Role } from '@/models/role.model'
import { SsoUser } from '@/models/ssouser.model'
import { User } from '@/models/user.model'
import { config } from '@/services/config.service'
import { ROLES } from '@/utils/constants'
import { logger } from '@/utils/logger'

enum IdentityProvider {
  BCeID = 'BCeID',
  IDIR = 'IDIR',
}

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
 * - `identityProvider`: The source of the user's identity (IDIR or BCeID)
 * - `keycloak`: The raw Keycloak instance for advanced usage
 * - `sessionExpired`: Flag indicating if the session has expired
 * - `user`: The parsed `User` object (or `null`)
 *
 * It also provides convenient getters for accessing:
 * - `authenticatedUser`: A guaranteed non-null user (throws if not available)
 * - `isOperationsAdmin`: Whether the user has operations admin privileges
 *
 * Usage is to call `initKeycloak()` on app startup, and then rely on the state
 * and getters in components and services.
 */
export const useAuthStore = defineStore('auth', () => {
  // Private state

  /**
   * The Keycloak instance used for authentication.
   */
  const keycloak = ref<Keycloak | null>(null)

  /**
   * The parsed user object extracted from the Keycloak token, or `null` if
   * not yet available.
   */
  const user = ref<User | null>(null)

  // Exported state

  /**
   * If the user's token doesn't refresh then set this to true to show a
   * logged out message.
   */
  const sessionExpired = ref(false)

  // Private methods

  /**
   * Internal guard to handle the unlikely event that this store (and keycloak)
   * were never initialized.
   *
   * @returns the Keycloak instance
   */
  const getKeycloak = (): Keycloak => {
    if (!keycloak.value) {
      throw new Error('Keycloak not initialized')
    }

    return keycloak.value
  }

  /**
   * Parses the user data from the current Keycloak token.
   *
   * This method extracts claims like name, email, and GUID from the decoded
   * token and maps them to a `User` object.
   *
   * @returns The parsed `User` object.
   */
  const parseUserFromToken = (tokenParsed: KeycloakTokenParsed): User => {
    const identityProvider = tokenParsed.identity_provider?.toLowerCase()
    const isIdir = identityProvider?.includes('idir')
    const guid = isIdir
      ? tokenParsed.idir_user_guid
      : tokenParsed.bceid_user_guid

    const ssoUser = new SsoUser(
      guid,
      isIdir ? tokenParsed.idir_username : tokenParsed.bceid_username,
      tokenParsed.given_name,
      tokenParsed.family_name,
      tokenParsed.display_name,
      tokenParsed.email,
      tokenParsed.identity_provider?.toLowerCase().includes('idir')
        ? IdentityProvider.IDIR
        : IdentityProvider.BCeID,
    )

    const roles: Role[] = []
    const tokenRoles = tokenParsed.client_roles || []
    if (tokenRoles.includes(ROLES.OPERATIONS_ADMIN.value)) {
      roles.push(
        new Role(
          'unused_id',
          ROLES.OPERATIONS_ADMIN.value,
          ROLES.OPERATIONS_ADMIN.title,
        ),
      )
    }

    return new User(guid, ssoUser, roles)
  }

  // Exported Methods

  const accessToken = computed((): string | undefined => {
    return getKeycloak().token
  })

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
   * @returns The authenticated `User` object
   * @throws {Error} If the user is not yet available (e.g., before login)
   */
  const authenticatedUser = computed((): User => {
    if (!user.value) {
      throw new Error('User not available')
    }

    return user.value
  })

  /**
   * Checks that the token is valid for at least the next 30 seconds and
   * refreshes it if not.
   *
   * @returns a token valid for at least the next 30 seconds, or an empty
   * string if the user is not authenticated
   */
  const ensureFreshToken = async (): Promise<void> => {
    // Before login there is no point in trying to refresh the token.
    if (!user.value) {
      return
    }

    try {
      await getKeycloak().updateToken(30)
    } catch {
      sessionExpired.value = true
      user.value = null
    }
  }

  /**
   * Initializes Keycloak and sets the authenticated if successful.
   */
  const init = async (): Promise<void> => {
    try {
      keycloak.value = new Keycloak({
        clientId: config.oidc.clientId,
        realm: config.oidc.realm,
        url: config.oidc.serverUrl,
      })

      const authenticated = await keycloak.value.init({
        checkLoginIframe: false,
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri:
          globalThis.location.origin + '/silent-check-sso.html',
      })

      if (authenticated) {
        user.value = keycloak.value.tokenParsed
          ? parseUserFromToken(keycloak.value.tokenParsed)
          : null
      }
    } catch (error) {
      logger.error('Keycloak init failed', error)

      throw error
    }
  }

  /**
   * Initiates the login process using Keycloak.
   *
   * This redirects the user to the Keycloak login screen. Upon successful login
   * will redirect back to the app, where the `init()` method will complete the
   * authentication process and set the user data.
   */
  const login = (options: KeycloakLoginOptions = {}): void => {
    getKeycloak().login(options)
  }

  /**
   * Logs out the user.
   */
  const logout = (): void => {
    getKeycloak().logout({
      redirectUri: globalThis.location.origin,
    })
  }

  return {
    accessToken,
    authenticatedUser,
    ensureFreshToken,
    init,
    login,
    logout,
    sessionExpired,
  }
})
