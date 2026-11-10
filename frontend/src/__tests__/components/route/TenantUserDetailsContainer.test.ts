import { render, screen, waitFor } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { makeTenant, makeUser } from '@/__tests__/__factories__'

import TenantUserDetailsContainer from '@/components/route/TenantUserDetailsContainer.vue'
import { useNotification } from '@/composables/useNotification'
import { toTenantId } from '@/models/tenant.model'
import { toUserId } from '@/models/user.model'
import vuetify from '@/plugins/vuetify'
import { useTenantStore } from '@/stores/useTenantStore'

vi.mock('@/composables/useNotification', () => ({
  useNotification: vi.fn(),
}))

vi.mock('@/services/config.service', () => ({
  config: { api: { baseUrl: 'https://api.example.com' } },
}))

const loadingWrapperStub = {
  name: 'LoadingWrapper',
  props: ['loading', 'loadingMessage'],
  template: '<div><slot /></div>',
}

const tenantUserDetailsStub = {
  props: ['tenant', 'user'],
  template: `
    <div
      data-testid="tenant-user-details"
      :data-tenant-id="tenant.id"
      :data-user-id="user.id"
    />
  `,
}

const renderComponent = ({
  tenantId = 'tenantIdDefault',
  userId = 'userIdDefault',
} = {}) => {
  return render(TenantUserDetailsContainer, {
    global: {
      plugins: [vuetify],
      stubs: {
        LoadingWrapper: loadingWrapperStub,
        TenantUserDetails: tenantUserDetailsStub,
      },
    },
    props: { tenantId: toTenantId(tenantId), userId: toUserId(userId) },
  })
}

describe('TenantUserDetailsContainer', () => {
  let tenantStore: ReturnType<typeof useTenantStore>

  let notificationMock: ReturnType<typeof useNotification>

  beforeEach(() => {
    setActivePinia(createPinia())

    tenantStore = useTenantStore()
    tenantStore.tenants = [
      makeTenant({
        id: toTenantId('tenantIdDefault'),
        users: [makeUser({ id: toUserId('userIdDefault') })],
      }),
    ]

    notificationMock = {
      messages: ref([]),

      dismiss: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
    }
    vi.mocked(useNotification).mockReturnValue(notificationMock)

    tenantStore.fetchTenantUser = vi.fn().mockResolvedValue(undefined)
  })

  describe('onMounted', () => {
    it('calls fetchTenantUser on mount', async () => {
      renderComponent()

      expect(tenantStore.fetchTenantUser).toHaveBeenCalled()
    })

    it('shows error notification when fetchTenantUser fails', async () => {
      tenantStore.fetchTenantUser = vi
        .fn()
        .mockRejectedValue(new Error('message'))

      renderComponent()

      await waitFor(() => {
        expect(notificationMock.error).toHaveBeenCalledWith(
          'Error loading user information',
        )
      })
    })
  })

  it('passes the requested tenant and user to the child', () => {
    tenantStore.tenants = [
      makeTenant({
        id: toTenantId('tenantId'),
        users: [makeUser({ id: toUserId('userId') })],
      }),
    ]

    renderComponent({ tenantId: 'tenantId', userId: 'userId' })

    const tenantUserDetails = screen.getByTestId('tenant-user-details')
    expect(tenantUserDetails).toHaveAttribute('data-tenant-id', 'tenantId')
    expect(tenantUserDetails).toHaveAttribute('data-user-id', 'userId')
  })

  it('passes only the requested user when the tenant has several', () => {
    tenantStore.tenants = [
      makeTenant({
        id: toTenantId('tenantId'),
        users: [
          makeUser({ id: toUserId('userId1') }),
          makeUser({ id: toUserId('userId2') }),
        ],
      }),
    ]

    renderComponent({ tenantId: 'tenantId', userId: 'userId2' })

    expect(screen.getByTestId('tenant-user-details')).toHaveAttribute(
      'data-user-id',
      'userId2',
    )
  })

  describe('when the data is missing', () => {
    it('throws a NotFoundError when the tenant is not in the store', () => {
      tenantStore.tenants = []

      expect(() => renderComponent({ tenantId: 'tenantId' })).toThrow(
        expect.objectContaining({
          userMessage: 'Error loading tenant information',
        }),
      )
    })

    it('throws a NotFoundError when the user is not in the tenant', () => {
      tenantStore.tenants = [
        makeTenant({ id: toTenantId('tenantId'), users: [] }),
      ]

      expect(() =>
        renderComponent({ tenantId: 'tenantId', userId: 'userId' }),
      ).toThrow(
        expect.objectContaining({
          userMessage: 'Error loading user information',
        }),
      )
    })
  })
})
