import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import BceidLandingContainer from '@/components/route/BCeidLandingContainer.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

const MOCK_LOGOUT_URL = 'https://example.com/logout'
const mockLogout = vi.fn().mockReturnValue(MOCK_LOGOUT_URL)

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
          template: '<a :href="href"><slot /></a>',
          props: ['href', 'color'],
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
    mockLogout.mockReturnValue(MOCK_LOGOUT_URL)
  })

  it('renders without crashing', () => {
    const wrapper = mountComponent()

    expect(wrapper.exists()).toBe(true)
  })

  it('calls authStore.logout() to compute the logout URL', () => {
    mountComponent()

    expect(mockLogout).toHaveBeenCalledOnce()
  })

  it('renders the logout button with the correct href from logoutURL', () => {
    const wrapper = mountComponent()
    const btn = wrapper.find('a')

    expect(btn.attributes('href')).toBe(MOCK_LOGOUT_URL)
  })

  it('renders i18n keys for expected text nodes', () => {
    const wrapper = mountComponent()
    const text = wrapper.text()

    expect(text).toContain('general.logout')
    expect(text).toContain('landing.bceidWelcome')
    expect(text).toContain('landing.bceidWelcomeDesc')
    expect(text).toContain('landing.learnMore')
  })

  it('renders the greeting icon', () => {
    const wrapper = mountComponent()
    const icon = wrapper.find('span')

    expect(icon.exists()).toBe(true)
  })

  it('renders the learn more link', () => {
    const wrapper = mountComponent()
    const links = wrapper.findAll('a')
    const learnMoreLink = links.find((l) => l.text() === 'landing.learnMore')

    expect(learnMoreLink).toBeDefined()
  })

  it('handles logout URL being an empty string', () => {
    mockLogout.mockReturnValue('')

    const wrapper = mountComponent()
    const btn = wrapper.find('a')

    expect(btn.attributes('href')).toBe('')
  })

  it('handles logout URL being undefined', () => {
    mockLogout.mockReturnValue(undefined)

    const wrapper = mountComponent()
    const btn = wrapper.find('a')

    expect(btn.attributes('href')).toBeUndefined()
  })
})
