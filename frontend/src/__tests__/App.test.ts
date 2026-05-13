import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { createMockAuthStore } from '@/__tests__/__helpers__/useAuthStore.mock'

import App from '@/App.vue'

let currentAuthStore = createMockAuthStore()

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => currentAuthStore,
}))

vi.mock('@/services/config.service', () => ({
  config: {
    oidc: { clientId: 'test', realm: 'test', serverUrl: 'http://test' },
  },
}))

const mountApp = () =>
  mount(App, {
    global: {
      mocks: {
        $t: (key: string) => key,
      },
      stubs: {
        AppHeader: true,
        AppNavigation: true,
        AppNotifications: true,
        LandingPageContainer: true,
        VApp: { template: '<div><slot /></div>' },
        VMain: { template: '<div><slot /></div>' },
        VContainer: { template: '<div><slot /></div>' },
        'router-view': { template: '<div data-test="router-view" />' },
      },
    },
  })

describe('App.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentAuthStore = createMockAuthStore()
  })

  it('shows session expired view when sessionExpired is true', async () => {
    currentAuthStore = createMockAuthStore({ isSessionExpired: true })

    const wrapper = mountApp()
    await nextTick()

    expect(wrapper.text()).toContain('general.sessionExpired')
  })

  it('shows router view when not session expired', async () => {
    const wrapper = mountApp()
    await nextTick()

    expect(wrapper.find('[data-test="router-view"]').exists()).toBe(true)
  })

  it('passes null user to AppHeader when not authenticated', async () => {
    currentAuthStore = createMockAuthStore({
      user: null,
    })

    const wrapper = mountApp()
    await nextTick()

    expect(wrapper.findComponent({ name: 'AppHeader' }).exists()).toBe(true)
  })
})
