import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { makeUser } from '@/__tests__/__factories__'
import {
  mockAuthStore,
  mockAuthStoreLogin,
} from '@/__tests__/__helpers__/useAuthStore.mock'

import LandingPageContainer from '@/components/route/LandingPageContainer.vue'

const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/services/config.service', () => ({
  config: {
    basicBceidBroker: 'basic-bceid-hint',
    businessBceidBroker: 'business-bceid-hint',
    idirBroker: 'idir-hint',
  },
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

describe('LandingPageContainer.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthStore(null)
  })

  it('renders all three login buttons', () => {
    const wrapper = mountComponent()
    const buttons = wrapper.findAll('button')

    expect(buttons).toHaveLength(3)
    expect(buttons[0].text()).toContain('IDIR')
    expect(buttons[1].text()).toContain('Basic BCeID')
    expect(buttons[2].text()).toContain('Business BCeID')
  })

  it('calls login with idirHint when IDIR button is clicked', async () => {
    const wrapper = mountComponent()
    await wrapper.findAll('button')[0].trigger('click')

    expect(mockAuthStoreLogin()).toHaveBeenCalledWith({ idpHint: 'idir-hint' })
  })

  it('calls login with basicBceidHint when Basic BCeID button is clicked', async () => {
    const wrapper = mountComponent()
    await wrapper.findAll('button')[1].trigger('click')

    expect(mockAuthStoreLogin()).toHaveBeenCalledWith({
      idpHint: 'basic-bceid-hint',
    })
  })

  it('calls login with businessBceidHint when Business BCeID button is clicked', async () => {
    const wrapper = mountComponent()
    await wrapper.findAll('button')[2].trigger('click')

    expect(mockAuthStoreLogin()).toHaveBeenCalledWith({
      idpHint: 'business-bceid-hint',
    })
  })

  it('redirects to /tenants when authenticated as IDIR', async () => {
    mockAuthStore(makeUser({ idpType: 'IDIR' }))
    mountComponent()
    await nextTick()

    expect(mockPush).toHaveBeenCalledWith('/tenants')
  })

  it('redirects to /bceid when authenticated as BCeID', async () => {
    mockAuthStore(makeUser({ idpType: 'BCeID' }))
    mountComponent()
    await nextTick()

    expect(mockPush).toHaveBeenCalledWith('/bceid')
  })

  it('does not redirect when not authenticated', async () => {
    mountComponent()
    await nextTick()

    expect(mockPush).not.toHaveBeenCalled()
  })
})
