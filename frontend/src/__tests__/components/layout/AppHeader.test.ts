import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AppHeader from '@/components/layout/AppHeader.vue'
import { SsoUser } from '@/models/ssouser.model'
import { User } from '@/models/user.model'

const mockLogout = vi.fn()

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    logout: mockLogout,
  }),
}))

function makeUser(displayName = 'Test User') {
  const ssoUser = new SsoUser(
    'u1',
    'username',
    'First',
    'Last',
    displayName,
    'e@e.com',
  )
  return new User('u1', ssoUser, [])
}

const mountComponent = (user: User | null = null) =>
  mount(AppHeader, {
    props: { user },
    global: {
      stubs: {
        'v-app-bar': { template: '<header><slot /></header>' },
        'v-toolbar-title': { template: '<div><slot /></div>' },
        'v-btn': { template: '<button><slot /></button>' },
        'v-icon': { template: '<span />' },
      },
    },
  })

describe('AppHeader.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const wrapper = mountComponent()

    expect(wrapper.exists()).toBe(true)
  })

  it('renders the app title', () => {
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain(
      'Connected Services, Team Access, and Roles (CSTAR)',
    )
  })

  it('does not render user info when user is null', () => {
    const wrapper = mountComponent(null)

    expect(wrapper.find('.user-info').exists()).toBe(false)
  })

  it('renders user display name when user is provided', () => {
    const wrapper = mountComponent(makeUser('Jane Doe'))

    expect(wrapper.text()).toContain('Jane Doe')
  })

  it('renders the logout button when user is provided', () => {
    const wrapper = mountComponent(makeUser())

    expect(wrapper.find('.logout-btn').exists()).toBe(true)
  })

  it('does not render the logout button when user is null', () => {
    const wrapper = mountComponent(null)

    expect(wrapper.find('.logout-btn').exists()).toBe(false)
  })

  it('calls authStore.logout() when the logout button is clicked', async () => {
    const wrapper = mountComponent(makeUser())

    await wrapper.find('.logout-btn').trigger('click')

    expect(mockLogout).toHaveBeenCalled()
  })
})
