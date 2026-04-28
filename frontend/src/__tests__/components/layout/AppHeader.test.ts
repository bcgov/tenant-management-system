import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeSsoUser, makeUser } from '@/__tests__/__factories__'
import {
  mockAuthStore,
  mockAuthStoreLogout,
} from '@/__tests__/__helpers__/useAuthStore.mock'

import AppHeader from '@/components/layout/AppHeader.vue'
import type { User } from '@/models/user.model'

const mountComponent = (user: User | null = null) =>
  mount(AppHeader, {
    props: { user },
    global: {
      stubs: {
        'v-app-bar': { template: '<header><slot /></header>' },
        'v-toolbar-title': { template: '<div><slot /></div>' },
        'v-btn': {
          template: '<button @click="$emit(\'click\')"><slot /></button>',
        },
        'v-icon': { template: '<span />' },
      },
    },
  })

describe('AppHeader.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthStore(null)
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
    const user = makeUser({
      ssoUser: makeSsoUser({ displayName: 'Ulysses Updike' }),
    })
    const wrapper = mountComponent(user)

    expect(wrapper.text()).toContain('Ulysses Updike')
  })

  it('renders the logout button when user is provided', () => {
    const wrapper = mountComponent(makeUser())

    expect(wrapper.find('.logout-btn').exists()).toBe(true)
  })

  it('does not render the logout button when user is null', () => {
    const wrapper = mountComponent(null)

    expect(wrapper.find('.logout-btn').exists()).toBe(false)
  })

  it('calls logout when the logout button is clicked', async () => {
    const wrapper = mountComponent(makeUser())

    await wrapper.find('.logout-btn').trigger('click')

    expect(mockAuthStoreLogout()).toHaveBeenCalled()
  })
})
