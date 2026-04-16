import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import BceidLandingContainer from '@/components/route/BCeidLandingContainer.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

const mockLogout = vi.fn()

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    logout: mockLogout,
  }),
}))

const mountComponent = () =>
  mount(BceidLandingContainer, {
    global: {
      mocks: {
        $t: (key: string) => key,
      },
      stubs: {
        'v-btn': {
          template: '<button @click="$emit(\'click\')"><slot /></button>',
          props: ['color'],
        },
        'v-container': { template: '<div><slot /></div>' },
        'v-icon': { template: '<span><slot /></span>' },
        'v-row': { template: '<div><slot /></div>' },
      },
    },
  })

describe('BCeidLandingContainer.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const wrapper = mountComponent()

    expect(wrapper.exists()).toBe(true)
  })

  it('renders i18n keys for expected text nodes', () => {
    const wrapper = mountComponent()
    const text = wrapper.text()

    expect(text).toContain('general.logout')
    expect(text).toContain('landing.bceidWelcome')
    expect(text).toContain('landing.bceidWelcomeDesc')
  })

  it('renders the greeting icon', () => {
    const wrapper = mountComponent()
    const icon = wrapper.find('span')

    expect(icon.exists()).toBe(true)
  })

  it('calls authStore.logout() when the logout button is clicked', async () => {
    const wrapper = mountComponent()

    await wrapper.find('button').trigger('click')

    expect(mockLogout).toHaveBeenCalled()
  })
})
