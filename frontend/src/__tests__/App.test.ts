import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import App from '@/App.vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { User } from '@/models/user.model'
import { SsoUser } from '@/models/ssouser.model'

const makeUser = (): User =>
  new User(
    '123',
    new SsoUser('123', 'BOB', 'B', 'OB', 'OB, B', 'bob@example.com', 'idir'),
    [],
  )

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/services/config.service', () => ({
  config: {
    oidc: {
      clientId: 'test',
      realm: 'test',
      serverUrl: 'http://test',
    },
  },
}))

function mountApp() {
  return mount(App, {
    global: {
      mocks: {
        $t: (key: string) => key,
      },
      stubs: {
        AppHeader: true,
        AppNavigation: true,
        LandingPageContainer: true,
        VApp: { template: '<div><slot /></div>' },
        VMain: { template: '<div><slot /></div>' },
        VContainer: { template: '<div><slot /></div>' },
        'router-view': { template: '<div data-test="router-view" />' },
      },
    },
  })
}

describe('App.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows session expired view when sessionExpired is true', async () => {
    const store = useAuthStore()
    store.sessionExpired = true
    vi.spyOn(store, 'authenticatedUser', 'get').mockReturnValue(makeUser())

    const wrapper = mountApp()
    await nextTick()

    expect(wrapper.text()).toContain('sessionExpired')
  })

  it('shows router view when sessionExpired is false', async () => {
    const store = useAuthStore()
    store.sessionExpired = false
    vi.spyOn(store, 'authenticatedUser', 'get').mockReturnValue(makeUser())

    const wrapper = mountApp()
    await nextTick()

    expect(wrapper.find('[data-test="router-view"]').exists()).toBe(true)
  })
})
