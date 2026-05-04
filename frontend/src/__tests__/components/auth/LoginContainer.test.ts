import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeUserBceid } from '@/__tests__/__factories__'
import { createMockAuthStore } from '@/__tests__/__helpers__/useAuthStore.mock'

import LoginContainer from '@/components/auth/LoginContainer.vue'
import * as permissions from '@/utils/permissions'

let currentAuthStore = createMockAuthStore()

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => currentAuthStore,
}))

vi.mock('@/utils/permissions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/permissions')>()
  return {
    ...actual,
    currentUserIsBceid: vi.fn(),
    currentUserIsIdir: vi.fn(),
  }
})

const mockLocation = { href: '' }

const mountComponent = () => mount(LoginContainer, {})

describe('LoginContainer.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentAuthStore = createMockAuthStore()

    Object.defineProperty(globalThis, 'location', {
      value: mockLocation,
      writable: true,
    })
    mockLocation.href = 'http://localhost/none-of-the-above'
  })

  it('redirects to / when not authenticated', () => {
    currentAuthStore = createMockAuthStore({ user: null })

    mountComponent()

    expect(globalThis.location.href).toBe('/')
  })

  it('redirects to /bceid when bceid', () => {
    currentAuthStore = createMockAuthStore({ user: makeUserBceid() })
    vi.mocked(permissions.currentUserIsBceid).mockReturnValue(true)

    mountComponent()

    expect(globalThis.location.href).toBe('/bceid')
  })

  it('does not render slot content when not authenticated', () => {
    const wrapper = mountComponent()

    expect(wrapper.find('[data-test-id="slot"]').exists()).toBe(false)
  })

  it('does not render slot content when authenticated but not idir', () => {
    currentAuthStore = createMockAuthStore({ user: makeUserBceid() })

    const wrapper = mountComponent()

    expect(wrapper.find('[data-test-id="slot"]').exists()).toBe(false)
  })

  it('renders slot content when authenticated and idir', () => {
    vi.mocked(permissions.currentUserIsIdir).mockReturnValue(true)

    const wrapper = mountComponent()

    expect(wrapper.find('[data-test-id="slot"]').exists()).toBe(true)
  })
})
