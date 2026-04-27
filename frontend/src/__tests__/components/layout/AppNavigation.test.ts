import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import { makeUser } from '@/__tests__/__factories__'
import { mockAuthStore } from '@/__tests__/__helpers__/useAuthStore.mock'

import AppNavigation from '@/components/layout/AppNavigation.vue'
import {
  currentUserIsIdir,
  currentUserIsOperationsAdmin,
} from '@/utils/permissions'

const mockRoute = { path: '/' }
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => mockRoute),
}))

vi.mock('@/utils/permissions', () => ({
  currentUserIsIdir: vi.fn(),
  currentUserIsOperationsAdmin: vi.fn(),
}))

const vuetify = createVuetify({ components, directives })

const mountComponent = () =>
  mount(AppNavigation, {
    global: {
      plugins: [vuetify],
      stubs: { 'router-link': true },
    },
  })

describe('AppNavigation.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRoute.path = '/'
    mockAuthStore(null)
    vi.mocked(currentUserIsIdir).mockReturnValue(false)
    vi.mocked(currentUserIsOperationsAdmin).mockReturnValue(false)
  })

  it('renders nothing when not logged in', () => {
    const wrapper = mountComponent()

    expect(wrapper.text()).not.toContain('Tenants')
    expect(wrapper.text()).not.toContain('Settings')
  })

  it('renders Tenants button when logged in', () => {
    mockAuthStore(makeUser())
    vi.mocked(currentUserIsIdir).mockReturnValue(true)

    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('Tenants')
  })

  it('does not render Settings button when user is not operations admin', () => {
    mockAuthStore(makeUser())
    vi.mocked(currentUserIsOperationsAdmin).mockReturnValue(false)

    expect(mountComponent().text()).not.toContain('Settings')
  })

  it('renders Settings button only when user is operations admin', () => {
    mockAuthStore(makeUser())
    vi.mocked(currentUserIsOperationsAdmin).mockReturnValue(true)

    expect(mountComponent().text()).toContain('Settings')
  })

  it('sets tenant button to active based on current route', () => {
    mockAuthStore(makeUser())
    vi.mocked(currentUserIsIdir).mockReturnValue(true)
    vi.mocked(currentUserIsOperationsAdmin).mockReturnValue(true)
    mockRoute.path = '/tenants'

    const wrapper = mountComponent()

    const btns = wrapper.findAllComponents(components.VBtn)
    const tenantsBtn = btns.find((b) => b.text().includes('Tenants'))
    const settingsBtn = btns.find((b) => b.text().includes('Settings'))
    expect(tenantsBtn?.props('active')).toBe(true)
    expect(settingsBtn?.props('active')).toBe(false)
  })

  it('sets settings button to active based on current route', () => {
    mockAuthStore(makeUser())
    vi.mocked(currentUserIsIdir).mockReturnValue(true)
    vi.mocked(currentUserIsOperationsAdmin).mockReturnValue(true)
    mockRoute.path = '/settings/users'

    const wrapper = mountComponent()

    const btns = wrapper.findAllComponents(components.VBtn)
    const tenantsBtn = btns.find((b) => b.text().includes('Tenants'))
    const settingsBtn = btns.find((b) => b.text().includes('Settings'))
    expect(tenantsBtn?.props('active')).toBe(false)
    expect(settingsBtn?.props('active')).toBe(true)
  })
})
