import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeUser, makeUserBceid } from '@/__tests__/__factories__'
import { mockAuthStore } from '@/__tests__/__helpers__/useAuthStore.mock'
import LoginContainer from '@/components/auth/LoginContainer.vue'
import * as permissions from '@/utils/permissions'

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
    mockAuthStore(null)

    Object.defineProperty(globalThis, 'location', {
      value: mockLocation,
      writable: true,
    })
    mockLocation.href = 'http://localhost/none-of-the-above'
  })

  it('redirects to / when not authenticated', () => {
    mountComponent()

    expect(globalThis.location.href).toBe('/')
  })

  it('redirects to /bceid when bceid', () => {
    mockAuthStore(makeUserBceid())
    vi.mocked(permissions.currentUserIsBceid).mockReturnValue(true)

    mountComponent()

    expect(globalThis.location.href).toBe('/bceid')
  })

  it('does not render slot content when not authenticated', () => {
    const wrapper = mountComponent()

    expect(wrapper.find('[data-test-id="slot"]').exists()).toBe(false)
  })

  it('does not render slot content when authenticated but not idir', () => {
    mockAuthStore(makeUserBceid())

    const wrapper = mountComponent()

    expect(wrapper.find('[data-test-id="slot"]').exists()).toBe(false)
  })

  it('renders slot content when authenticated and idir', () => {
    mockAuthStore(makeUser())
    vi.mocked(permissions.currentUserIsIdir).mockReturnValue(true)

    const wrapper = mountComponent()

    expect(wrapper.find('[data-test-id="slot"]').exists()).toBe(true)
  })

  it('does not redirect when authenticated', () => {
    mockAuthStore(makeUser())
    const originalHref = globalThis.location.href

    mountComponent()

    expect(globalThis.location.href).toBe(originalHref)
  })
})
