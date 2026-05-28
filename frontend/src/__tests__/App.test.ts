import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
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
    basicBceidBroker: 'basic-bceid',
    businessBceidBroker: 'business-bceid',
    idirBroker: 'idir',
    oidc: { clientId: 'test', realm: 'test', serverUrl: 'http://test' },
  },
}))

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => currentAuthStore,
}))

const mountApp = () =>
  mount(App, {
    global: {
      mocks: {
        $t: (key: string) => key,
      },
      plugins: [vuetify],
      stubs: {
        AppHeader: true,
        AppNavigation: true,
        AppNotifications: true,
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

  it('does not show login buttons when session is not expired', async () => {
    const wrapper = mountApp()
    await nextTick()

    expect(wrapper.find('[data-test-id="buttonIdir"]').exists()).toBe(false)
    expect(wrapper.find('[data-test-id="buttonBceidBasic"]').exists()).toBe(
      false,
    )
    expect(wrapper.find('[data-test-id="buttonBceidBusiness"]').exists()).toBe(
      false,
    )
  })

  it('shows login buttons when session is expired', async () => {
    currentAuthStore = createMockAuthStore({ isSessionExpired: true })

    const wrapper = mountApp()
    await nextTick()

    expect(wrapper.find('[data-test-id="buttonIdir"]').exists()).toBe(true)
    expect(wrapper.find('[data-test-id="buttonBceidBasic"]').exists()).toBe(
      true,
    )
    expect(wrapper.find('[data-test-id="buttonBceidBusiness"]').exists()).toBe(
      true,
    )
  })

  it('calls login with idir hint when IDIR button is clicked', async () => {
    currentAuthStore = createMockAuthStore({ isSessionExpired: true })

    const wrapper = mountApp()
    await nextTick()

    await wrapper.find('[data-test-id="buttonIdir"]').trigger('click')

    expect(currentAuthStore.login).toHaveBeenCalledWith({ idpHint: 'idir' })
  })

  it('calls login with basic bceid hint when Basic BCeID button is clicked', async () => {
    currentAuthStore = createMockAuthStore({ isSessionExpired: true })

    const wrapper = mountApp()
    await nextTick()

    await wrapper.find('[data-test-id="buttonBceidBasic"]').trigger('click')

    expect(currentAuthStore.login).toHaveBeenCalledWith({
      idpHint: 'basic-bceid',
    })
  })

  it('calls login with business bceid hint when Business BCeID button is clicked', async () => {
    currentAuthStore = createMockAuthStore({ isSessionExpired: true })

    const wrapper = mountApp()
    await nextTick()

    await wrapper.find('[data-test-id="buttonBceidBusiness"]').trigger('click')

    expect(currentAuthStore.login).toHaveBeenCalledWith({
      idpHint: 'business-bceid',
    })
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
    expect(
      wrapper.findComponent({ name: 'AppHeader' }).props('user'),
    ).toBeNull()
  })

  it('passes user to AppHeader when authenticated', async () => {
    const user = makeUser()
    currentAuthStore = createMockAuthStore({ user })

    const wrapper = mountApp()
    await nextTick()

    expect(wrapper.findComponent({ name: 'AppHeader' }).props('user')).toEqual(
      user,
    )
  })
})
