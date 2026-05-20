import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockAuthStore } from '@/__tests__/__helpers__/useAuthStore.mock'

import LandingPageBceidContainer from '@/components/route/LandingPageBceidContainer.vue'

let currentAuthStore = createMockAuthStore()

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => currentAuthStore,
}))

const mountComponent = () =>
  mount(LandingPageBceidContainer, {
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

describe('LandingPageBceidContainer.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentAuthStore = createMockAuthStore()
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

    expect(wrapper.find('span').exists()).toBe(true)
  })

  it('calls logout when the logout button is clicked', async () => {
    const wrapper = mountComponent()

    await wrapper.find('button').trigger('click')

    expect(currentAuthStore.logout).toHaveBeenCalled()
  })
})
