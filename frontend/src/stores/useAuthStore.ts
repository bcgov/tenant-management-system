import Keycloak from 'keycloak-js'
import { defineStore } from 'pinia'

import { SsoUser } from '@/models/ssouser.model'
import { User } from '@/models/user.model'
import { logger } from '@/utils/logger'

const keycloak = new Keycloak({
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  url: import.meta.env.VITE_KEYCLOAK_URL,
})

let refreshTimer: number | undefined

export const useAuthStore = defineStore('auth', {
  state: () => ({
    authenticated: false,
    keycloak: keycloak,
    token: '' as string,
    user: null as User | null,
  }),

  getters: {
    getToken: (state) => state.token,
    getUser: (state) => state.user,
    isAuthenticated: (state) => state.authenticated,
  },

  actions: {
    /**
     * Initializes Keycloak and sets the authenticated if successful.
     */
    async initKeycloak(): Promise<void> {
      try {
        const authenticated = await this.keycloak.init({
          onLoad: 'login-required',
          checkLoginIframe: false,
        })

        if (!authenticated) {
          logger.warning('User not authenticated')
          throw new Error('User not authenticated')
        }

        this.authenticated = true
        this.token = this.keycloak.token ?? ''
        this.user = this.parseUserFromToken()
        this.scheduleTokenRefresh()
        logger.info('Keycloak authenticated: ' + this.user?.ssoUser?.id)
      } catch (error) {
        logger.error('Keycloak init failed', error)
        throw error
      }
    },

    /**
     * Initiates the login process using Keycloak.
     */
    login(): void {
      this.keycloak.login()
    },

    /**
     * Logs out the user and clears local/session storage and token refresh
     * timer.
     */
    logout(): void {
      if (refreshTimer) {
        clearTimeout(refreshTimer)
        refreshTimer = undefined
      }

      this.keycloak
        .logout({
          redirectUri: window.location.origin,
        })
        .then(() => {
          localStorage.clear()
          sessionStorage.clear()
          this.authenticated = false
          this.token = ''
          this.user = null
          logger.info('Logged out and storage cleared')
        })
        .catch((error: Error) => {
          logger.error('Logout failed', error)
        })
    },

    parseUserFromToken(): User | null {
      const parsed = this.keycloak.tokenParsed
      if (!parsed) {
        return null
      }

      const ssoUser = new SsoUser(
        parsed.idir_user_guid,
        parsed.display_name,
        parsed.email,
      )

      return new User(
        'TODO', // Replace if you have a user ID in the token
        parsed.idir_username,
        parsed.given_name,
        parsed.family_name,
        parsed.display_name,
        parsed.email,
        ssoUser,
        [], // Add roles if needed
      )
    },

    scheduleTokenRefresh(): void {
      if (refreshTimer) {
        clearTimeout(refreshTimer)
      }

      refreshTimer = window.setTimeout(() => {
        this.keycloak
          .updateToken(30)
          .then((refreshed) => {
            if (refreshed) {
              this.token = this.keycloak.token ?? ''
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
