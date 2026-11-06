import { render, screen, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  makeSsoUser,
  makeTenant,
  makeTenantRequest,
  makeUser,
} from '@/__tests__/__factories__'
import { createMockAuthStore } from '@/__tests__/__helpers__/useAuthStore.mock'
import {
  mockTenantRequestStore,
  mockTenantRequestStoreCreateTenantRequest,
  mockTenantRequestStoreFetchPendingTenantRequests,
  mockTenantRequestStoreError,
} from '@/__tests__/__helpers__/useTenantRequestStore.mock'
import {
  mockTenantStore,
  mockTenantStoreFetchError,
  mockTenantStoreFetchTenants,
} from '@/__tests__/__helpers__/useTenantStore.mock'

import TenantListContainer from '@/components/route/TenantListContainer.vue'
import { DomainError } from '@/errors/domain/DomainError'
import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import { toSsoUserId } from '@/models/ssouser.model'
import vuetify from '@/plugins/vuetify'

let currentAuthStore = createMockAuthStore()

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => currentAuthStore,
}))

const mockError = vi.fn()
const mockSuccess = vi.fn()

vi.mock('@/composables/useNotification', () => ({
  useNotification: () => ({
    success: mockSuccess,
    error: mockError,
  }),
}))

beforeEach(() => {
  currentAuthStore = createMockAuthStore()
  mockTenantRequestStore()
  mockTenantStore()
  vi.clearAllMocks()
})

const requestDetails = {
  description: 'description',
  ministryName: 'ministryName',
  name: 'name',
}

const tenantRequestDialogStub = {
  data: () => ({ details: requestDetails }),
  emits: ['clear-duplicate-error', 'submit', 'update:modelValue'],
  name: 'TenantRequestDialog',
  props: ['isDuplicateName', 'modelValue'],
  template: `
    <div role="dialog" v-show="modelValue">
      <p v-if="isDuplicateName">Duplicate name</p>
      <button @click="$emit('clear-duplicate-error')">clear</button>
      <button @click="$emit('submit', details)">submit</button>
      <button @click="$emit('update:modelValue', false)">close</button>
    </div>
  `,
}

const renderComponent = () => {
  const user = userEvent.setup()

  render(TenantListContainer, {
    global: {
      plugins: [vuetify],
      stubs: {
        LoadingWrapper: { template: '<div><slot /></div>' },
        TenantRequestDialog: tenantRequestDialogStub,
      },
    },
  })

  return { user }
}

describe('TenantListContainer.vue', () => {
  describe('onMounted', () => {
    it('fetches tenants on mount', async () => {
      const user = makeUser({
        ssoUser: makeSsoUser({
          ssoUserId: toSsoUserId('user.ssoUser.ssoUserId'),
        }),
      })
      currentAuthStore = createMockAuthStore({ user })

      renderComponent()

      await waitFor(() =>
        expect(mockTenantStoreFetchTenants).toHaveBeenCalledWith(
          'user.ssoUser.ssoUserId',
        ),
      )
    })

    it('fetches pending tenant requests on mount', async () => {
      const user = makeUser({
        ssoUser: makeSsoUser({
          ssoUserId: toSsoUserId('user.ssoUser.ssoUserId'),
        }),
      })
      currentAuthStore = createMockAuthStore({ user })

      renderComponent()

      await waitFor(() =>
        expect(
          mockTenantRequestStoreFetchPendingTenantRequests,
        ).toHaveBeenCalledWith('user.ssoUser.ssoUserId'),
      )
    })

    it('shows an error notification if fetching tenants fails', async () => {
      mockTenantStoreFetchError(new Error('message'))

      renderComponent()

      await waitFor(() =>
        expect(mockError).toHaveBeenCalledWith('Failed to load tenants'),
      )
    })

    it('shows an error notification if fetching pending tenant requests fails', async () => {
      mockTenantRequestStoreError(new Error('message'))

      renderComponent()

      await waitFor(() =>
        expect(mockError).toHaveBeenCalledWith(
          'Failed to load pending tenant requests',
        ),
      )
    })

    it('shows the tenant when tenants exist', async () => {
      mockTenantStore([makeTenant({ name: 'tenantName' })])

      renderComponent()

      expect(await screen.findByText('tenantName')).toBeInTheDocument()
    })

    it('shows the pending tenant request when exists', async () => {
      mockTenantRequestStore([makeTenantRequest({ name: 'tenantRequestName' })])

      renderComponent()

      expect(await screen.findByText('tenantRequestName')).toBeInTheDocument()
    })
  })

  describe('dialog', () => {
    it('opens the dialog when the button is clicked', async () => {
      const { user } = renderComponent()

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Request a tenant' }))

      expect(screen.getByRole('dialog')).toBeVisible()
    })

    it('closes the dialog when the dialog requests it', async () => {
      const { user } = renderComponent()

      await user.click(screen.getByRole('button', { name: 'Request a tenant' }))

      expect(screen.getByRole('dialog')).toBeVisible()

      await user.click(screen.getByRole('button', { name: 'close' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('submits a tenant request and closes the dialog', async () => {
      const testUser = makeUser()
      currentAuthStore = createMockAuthStore({ user: testUser })
      const { user } = renderComponent()

      await user.click(screen.getByRole('button', { name: 'Request a tenant' }))
      await user.click(screen.getByRole('button', { name: 'submit' }))

      await waitFor(() =>
        expect(mockTenantRequestStoreCreateTenantRequest).toHaveBeenCalledWith(
          requestDetails,
          testUser,
        ),
      )
      expect(mockSuccess).toHaveBeenCalledWith('Tenant request submitted')
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      )
    })

    it('flags a duplicate name when a DuplicateEntityError is thrown', async () => {
      mockTenantRequestStoreError(new DuplicateEntityError('oops'))
      const { user } = renderComponent()

      await user.click(screen.getByRole('button', { name: 'Request a tenant' }))
      await user.click(screen.getByRole('button', { name: 'submit' }))

      expect(await screen.findByText('Duplicate name')).toBeInTheDocument()
    })

    it('clears the duplicate name error when requested by the dialog', async () => {
      mockTenantRequestStoreError(new DuplicateEntityError('oops'))
      const { user } = renderComponent()

      await user.click(screen.getByRole('button', { name: 'Request a tenant' }))
      await user.click(screen.getByRole('button', { name: 'submit' }))

      expect(await screen.findByText('Duplicate name')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'clear' }))

      await waitFor(() =>
        expect(screen.queryByText('Duplicate name')).not.toBeInTheDocument(),
      )
    })

    it('shows an error notification on DomainError with userMessage', async () => {
      mockTenantRequestStoreError(new DomainError('message', 'userMessage'))
      const { user } = renderComponent()

      await user.click(screen.getByRole('button', { name: 'Request a tenant' }))
      await user.click(screen.getByRole('button', { name: 'submit' }))

      await waitFor(() => expect(mockError).toHaveBeenCalledWith('userMessage'))
    })

    it('shows an error notification on DomainError without userMessage', async () => {
      mockTenantRequestStoreError(new DomainError('message'))
      const { user } = renderComponent()

      await user.click(screen.getByRole('button', { name: 'Request a tenant' }))
      await user.click(screen.getByRole('button', { name: 'submit' }))

      await waitFor(() =>
        expect(mockError).toHaveBeenCalledWith(
          'Failed to create the new tenant',
        ),
      )
    })
  })
})
