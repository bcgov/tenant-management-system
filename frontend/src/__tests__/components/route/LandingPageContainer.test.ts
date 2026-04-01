import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import LandingPageContainer from '@/components/route/LandingPageContainer.vue'

vi.mock('@/services/config.service', () => ({
  config: {
    basicBceidBroker: 'basic-bceid-hint',
    businessBceidBroker: 'business-bceid-hint',
    idirBroker: 'idir-hint',
  },
  configLoaded: { value: true },
}))

const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockLogin = vi.fn()
const mockIsAuthenticated = { value: false }
const mockUserSource = { value: '' }

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    login: mockLogin,
    get isAuthenticated() {
      return mockIsAuthenticated.value
    },
    get userSource() {
      return mockUserSource.value
    },
  }),
}))

const mountComponent = () =>
  mount(LandingPageContainer, {
    global: {
      stubs: {
        'v-btn': {
          props: ['class', 'color', 'variant'],
          template: '<button @click="$emit(\'click\')"><slot /></button>',
        },
        'v-container': { template: '<div><slot /></div>' },
      },
    },
  })

describe('LandingPage.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAuthenticated.value = false
    mockUserSource.value = ''
  })

  it('renders without crashing', () => {
    const wrapper = mountComponent()

    expect(wrapper.exists()).toBe(true)
  })

  it('renders all three login buttons', () => {
    const wrapper = mountComponent()
    const buttons = wrapper.findAll('button')

    expect(buttons).toHaveLength(3)
    expect(buttons[0].text()).toBe('Log in with IDIR')
    expect(buttons[1].text()).toBe('Login with Basic BCeID')
    expect(buttons[2].text()).toBe('Login with Business BCeID')
  })

  it('calls login with idirHint when IDIR button is clicked', async () => {
    const wrapper = mountComponent()
    await wrapper.findAll('button')[0].trigger('click')

    expect(mockLogin).toHaveBeenCalledWith({ idpHint: 'idir-hint' })
  })

  it('calls login with basicBceidHint when Basic BCeID button is clicked', async () => {
    const wrapper = mountComponent()
    await wrapper.findAll('button')[1].trigger('click')

    expect(mockLogin).toHaveBeenCalledWith({ idpHint: 'basic-bceid-hint' })
  })

  it('calls login with businessBceidHint when Business BCeID button is clicked', async () => {
    const wrapper = mountComponent()
    await wrapper.findAll('button')[2].trigger('click')

    expect(mockLogin).toHaveBeenCalledWith({ idpHint: 'business-bceid-hint' })
  })

  it('redirects to /tenants when authenticated as IDIR', async () => {
    mockIsAuthenticated.value = true
    mockUserSource.value = 'IDIR'

    mountComponent()
    await nextTick()

    expect(mockPush).toHaveBeenCalledWith('/tenants')
  })

  it('redirects to /bceid when authenticated as non-IDIR', async () => {
    mockIsAuthenticated.value = true
    mockUserSource.value = 'BCEID'

    mountComponent()
    await nextTick()

    expect(mockPush).toHaveBeenCalledWith('/bceid')
  })

  it('does not redirect when not authenticated', async () => {
    mockIsAuthenticated.value = false

    mountComponent()
    await nextTick()

    expect(mockPush).not.toHaveBeenCalled()
  })
})
