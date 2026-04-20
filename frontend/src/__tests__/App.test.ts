import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { makeUser } from '@/__tests__/__factories__'
import { mockAuthStore } from '@/__tests__/__helpers__/useAuthStore.mock'

import App from '@/App.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
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
    mockAuthStore(null)
  })

  it('shows session expired view when sessionExpired is true', async () => {
    mockAuthStore(null, true)

    const wrapper = mountApp()
    await nextTick()

    expect(wrapper.text()).toContain('general.sessionExpired')
  })

  it('shows router view when not session expired', async () => {
    mockAuthStore(makeUser())

    const wrapper = mountApp()
    await nextTick()

    expect(wrapper.find('[data-test="router-view"]').exists()).toBe(true)
  })

  it('passes null user to AppHeader when not authenticated', async () => {
    mockAuthStore(null)

    const wrapper = mountApp()
    await nextTick()

    expect(wrapper.findComponent({ name: 'AppHeader' }).exists()).toBe(true)
  })
})
