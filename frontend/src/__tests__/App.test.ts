import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'

import { makeUser } from '@/__tests__/__factories__'
import { createMockAuthStore } from '@/__tests__/__helpers__/useAuthStore.mock'

import App from '@/App.vue'

const vuetify = createVuetify()

let currentAuthStore = createMockAuthStore()

vi.mock('vue-router', () => ({
  useRoute: () => ({ fullPath: '/' }),
}))

vi.mock('@/services/config.service', () => ({
  config: {
    link: {
      contactUs: 'http://contact-us',
    },
    oidc: {
      clientId: 'test',
      hintBceidBusiness: 'business-bceid',
      hintIdir: 'idir',
      realm: 'test',
      serverUrl: 'http://test',
    },
  },
}))

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => currentAuthStore,
}))

const renderApp = () =>
  render(App, {
    global: {
      plugins: [vuetify],
      stubs: {
        AppNavigation: true,
        AppNotifications: true,
        'router-link': { template: '<a><slot /></a>' },
        'router-view': { template: '<div data-testid="router-view" />' },
      },
    },
  })

describe('App.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentAuthStore = createMockAuthStore()
  })

  describe('session timeout', () => {
    it('does not show login buttons when session is not expired', () => {
      renderApp()

      expect(
        screen.queryByRole('button', { name: 'Log in with IDIR' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Log in with Business BCeID' }),
      ).not.toBeInTheDocument()
    })

    it('shows login buttons when session is expired', () => {
      currentAuthStore = createMockAuthStore({ isSessionExpired: true })

      renderApp()

      expect(
        screen.getByRole('button', { name: 'Log in with IDIR' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Log in with Business BCeID' }),
      ).toBeInTheDocument()
    })

    it('calls login with idir hint when IDIR button is clicked', async () => {
      currentAuthStore = createMockAuthStore({ isSessionExpired: true })
      const user = userEvent.setup()

      renderApp()

      await user.click(screen.getByRole('button', { name: 'Log in with IDIR' }))

      expect(currentAuthStore.login).toHaveBeenCalledWith({ idpHint: 'idir' })
    })

    it('calls login with business bceid hint when Business BCeID button is clicked', async () => {
      currentAuthStore = createMockAuthStore({ isSessionExpired: true })
      const user = userEvent.setup()

      renderApp()

      await user.click(
        screen.getByRole('button', { name: 'Log in with Business BCeID' }),
      )

      expect(currentAuthStore.login).toHaveBeenCalledWith({
        idpHint: 'business-bceid',
      })
    })
  })

  describe('routing', () => {
    it('shows router view when session is not expired', () => {
      renderApp()

      expect(screen.getByTestId('router-view')).toBeInTheDocument()
    })

    it('hides router view when session is expired', () => {
      currentAuthStore = createMockAuthStore({ isSessionExpired: true })

      renderApp()

      expect(screen.queryByTestId('router-view')).not.toBeInTheDocument()
    })
  })

  describe('header', () => {
    it('does not show the user menu when not authenticated', () => {
      currentAuthStore = createMockAuthStore({ user: null })

      renderApp()

      expect(
        screen.queryByRole('button', { name: 'User menu' }),
      ).not.toBeInTheDocument()
    })

    it('shows the authenticated user in the user menu', async () => {
      const testUser = makeUser()
      currentAuthStore = createMockAuthStore({ user: testUser })
      const user = userEvent.setup()

      renderApp()

      await user.click(screen.getByRole('button', { name: 'User menu' }))

      expect(await screen.findByText(testUser.getName())).toBeInTheDocument()
    })

    it('calls logout when Logout is selected from the user menu', async () => {
      currentAuthStore = createMockAuthStore({ user: makeUser() })
      const user = userEvent.setup()

      renderApp()

      await user.click(screen.getByRole('button', { name: 'User menu' }))
      await user.click(await screen.findByText('Logout'))

      expect(currentAuthStore.logout).toHaveBeenCalledOnce()
    })
  })
})
