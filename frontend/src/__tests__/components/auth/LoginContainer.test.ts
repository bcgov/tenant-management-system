import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import LoginContainer from '@/components/auth/LoginContainer.vue'

const mockAuthStore = {
  authenticated: false,
}

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => mockAuthStore,
}))

const mountComponent = () =>
  mount(LoginContainer, {
    slots: {
      default: '<div class="slotted">Content</div>',
    },
  })

describe('LoginContainer.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthStore.authenticated = false
  })

  it('renders without crashing', () => {
    const wrapper = mountComponent()

    expect(wrapper.exists()).toBe(true)
  })

  it('redirects to / when not authenticated', () => {
    mountComponent()

    expect(globalThis.location.href).toBe('http://localhost:3000/')
  })

  it('does not render slot content when not authenticated', () => {
    const wrapper = mountComponent()

    expect(wrapper.find('.slotted').exists()).toBe(false)
  })

  it('does not redirect when authenticated', () => {
    mockAuthStore.authenticated = true
    globalThis.location.href = 'http://localhost/'

    mountComponent()

    expect(globalThis.location.href).not.toBe('/')
  })
})
