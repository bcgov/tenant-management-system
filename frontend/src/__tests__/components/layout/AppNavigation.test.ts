import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import AppNavigation from '@/components/layout/AppNavigation.vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { currentUserIsOperationsAdmin } from '@/utils/permissions'
import type { User } from '@/models/user.model'

// 1. Mock the router
const mockRoute = { path: '/' }
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => mockRoute),
}))

// 2. Mock permissions utility
vi.mock('@/utils/permissions', () => ({
  currentUserIsOperationsAdmin: vi.fn(),
}))

// 3. Mock the store
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: vi.fn(),
}))

const vuetify = createVuetify({ components, directives })

// Helper to cast the mock return type without linter/compiler errors
type AuthStoreMock = Partial<ReturnType<typeof useAuthStore>>
const mockStoreReturn = (props: AuthStoreMock) =>
  props as ReturnType<typeof useAuthStore>

describe('AppNavigation.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRoute.path = '/'

    vi.mocked(useAuthStore).mockReturnValue(
      mockStoreReturn({
        authenticatedUser: null,
      }),
    )
  })

  const mountComponent = () => {
    return mount(AppNavigation, {
      global: {
        plugins: [vuetify],
        stubs: { 'router-link': true },
      },
    })
  }

  it('renders nothing when not logged in', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).not.toContain('Tenants')
  })

  it('renders Tenants button when logged in', () => {
    vi.mocked(useAuthStore).mockReturnValue(
      mockStoreReturn({
        authenticatedUser: { guid: '123' } as unknown as User,
      }),
    )

    const wrapper = mountComponent()
    expect(wrapper.text()).toContain('Tenants')
  })

  it('renders Settings button only if user is operations admin', () => {
    vi.mocked(useAuthStore).mockReturnValue(
      mockStoreReturn({
        authenticatedUser: { guid: '123' } as unknown as User,
      }),
    )

    vi.mocked(currentUserIsOperationsAdmin).mockReturnValue(false)
    let wrapper = mountComponent()
    expect(wrapper.text()).not.toContain('Settings')

    vi.mocked(currentUserIsOperationsAdmin).mockReturnValue(true)
    wrapper = mountComponent()
    expect(wrapper.text()).toContain('Settings')
  })

  it('sets buttons to active based on current route', () => {
    vi.mocked(useAuthStore).mockReturnValue(
      mockStoreReturn({
        authenticatedUser: { guid: '123' } as unknown as User,
      }),
    )
    vi.mocked(currentUserIsOperationsAdmin).mockReturnValue(true)

    mockRoute.path = '/settings/users'

    const wrapper = mountComponent()

    const btns = wrapper.findAllComponents(components.VBtn)
    const tenantsBtn = btns.find((b) => b.text().includes('Tenants'))
    const settingsBtn = btns.find((b) => b.text().includes('Settings'))

    expect(settingsBtn?.props('active')).toBe(true)
    expect(tenantsBtn?.props('active')).toBe(false)
  })
})
