import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeUser } from '@/__tests__/__factories__'
import { mockAuthStore } from '@/__tests__/__helpers__/useAuthStore.mock'

import LoginContainer from '@/components/auth/LoginContainer.vue'

const mountComponent = () =>
  mount(LoginContainer, {
    slots: {
      default: '<div class="slotted">Content</div>',
    },
  })

describe('LoginContainer.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthStore(null)
  })

  it('redirects to / when not authenticated', () => {
    mountComponent()

    expect(new URL(globalThis.location.href).pathname).toBe('/')
  })

  it('does not render slot content when not authenticated', () => {
    const wrapper = mountComponent()

    expect(wrapper.find('.slotted').exists()).toBe(false)
  })

  it('renders slot content when authenticated', () => {
    mockAuthStore(makeUser())

    const wrapper = mountComponent()

    expect(wrapper.find('.slotted').exists()).toBe(true)
  })

  it('does not redirect when authenticated', () => {
    mockAuthStore(makeUser())
    const originalHref = globalThis.location.href

    mountComponent()

    expect(globalThis.location.href).toBe(originalHref)
  })
})
