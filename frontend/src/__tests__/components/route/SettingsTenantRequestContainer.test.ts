import { fireEvent, render, screen, within } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeTenantRequest } from '@/__tests__/__factories__'

import TenantRequestContainer from '@/components/route/SettingsTenantRequestContainer.vue'
import { useNotification } from '@/composables/useNotification'
import { DomainError } from '@/errors/domain/DomainError'
import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import vuetify from '@/plugins/vuetify'
import { useTenantRequestStore } from '@/stores/useTenantRequestStore'
import { TENANT_REQUEST_STATUS } from '@/utils/constants'

vi.mock('@/composables/useNotification', () => ({
  useNotification: vi.fn(),
}))

const tenantRequestDisplayStub = {
  name: 'TenantRequestDisplay',
  props: ['isDuplicateName', 'tenantRequest'],
  emits: ['approved', 'cancel', 'clear-duplicate-error', 'rejected'],
  template: `
    <div>
      <div data-testid="is-duplicate-name">{{ String(isDuplicateName) }}</div>
      <div data-testid="selected-request-id">{{ tenantRequest.id }}</div>
      <button @click="$emit('approved', 'Approved Tenant Name')">
        stub-approve
      </button>
      <button @click="$emit('rejected', 'rejectionReason')">
        stub-reject
      </button>
      <button @click="$emit('cancel')">stub-cancel</button>
      <button @click="$emit('clear-duplicate-error')">
        stub-clear-duplicate-error
      </button>
    </div>
  `,
}

function renderComponent() {
  return render(TenantRequestContainer, {
    global: {
      plugins: [vuetify],
      stubs: {
        LoginContainer: { template: '<div><slot /></div>' },
        AdministratorContainer: { template: '<div><slot /></div>' },
        TenantRequestDisplay: tenantRequestDisplayStub,
      },
    },
  })
}

describe('TenantRequestContainer', () => {
  let tenantRequestStore: ReturnType<typeof useTenantRequestStore>
  let notificationMock: ReturnType<typeof useNotification>

  beforeEach(() => {
    setActivePinia(createPinia())
    tenantRequestStore = useTenantRequestStore()
    tenantRequestStore.fetchTenantRequests = vi
      .fn()
      .mockResolvedValue(undefined)

    notificationMock = {
      error: vi.fn(),
      info: vi.fn(),
      remove: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),

      items: [],
    }
    vi.mocked(useNotification).mockReturnValue(notificationMock)
  })

  describe('init', () => {
    it('shows a loading state until fetchTenantRequests resolves', async () => {
      let resolveFetch!: () => void
      tenantRequestStore.fetchTenantRequests = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveFetch = () => resolve()
          }),
      )

      renderComponent()

      expect(screen.queryByText('Tenant Requests')).not.toBeInTheDocument()

      resolveFetch()
      await screen.findByText('Tenant Requests')
    })

    it('shows error notification when fetchTenantRequests fails', async () => {
      tenantRequestStore.fetchTenantRequests = vi
        .fn()
        .mockRejectedValue(new Error('message'))

      renderComponent()
      await screen.findByText('Tenant Requests')

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to load tenant request data',
      )
    })
  })

  describe('empty state', () => {
    it('shows the no-requests message and no search field when there are none', async () => {
      tenantRequestStore.tenantRequests = []

      renderComponent()
      await screen.findByText('No tenant requests yet')

      expect(screen.queryByLabelText('Search')).not.toBeInTheDocument()
    })
  })

  describe('populated table', () => {
    it('renders each tenant request', async () => {
      tenantRequestStore.tenantRequests = [
        makeTenantRequest({ name: 'name1' }),
        makeTenantRequest({ name: 'name2' }),
      ]

      renderComponent()
      await screen.findByText('Tenant Requests')

      const table = screen.getByRole('table')
      expect(within(table).getByText('name1')).toBeInTheDocument()
      expect(within(table).getByText('name2')).toBeInTheDocument()
      expect(screen.getByLabelText('Search')).toBeInTheDocument()
    })
  })

  describe('status color', () => {
    it.each([
      [TENANT_REQUEST_STATUS.APPROVED.value, 'success'],
      [TENANT_REQUEST_STATUS.NEW.value, 'info'],
      [TENANT_REQUEST_STATUS.REJECTED.value, 'error'],
      ['some-unexpected-status', 'warning'],
    ])('renders %s status with %s color', async (status, color) => {
      tenantRequestStore.tenantRequests = [
        makeTenantRequest({ name: 'Alpha Tenant', status }),
      ]

      renderComponent()
      await screen.findByText('Tenant Requests')

      const chip = screen.getByText(status).closest('.v-chip')
      expect(chip?.className).toMatch(new RegExp(`text-${color}\\b`))
    })
  })

  describe('search', () => {
    it('shows a no-match message when the search term does not match', async () => {
      tenantRequestStore.tenantRequests = [makeTenantRequest({ name: 'name' })]

      renderComponent()
      await screen.findByText('Tenant Requests')

      await fireEvent.update(screen.getByLabelText('Search'), 'nonexistent')

      expect(
        await screen.findByText('No matching tenant requests'),
      ).toBeInTheDocument()
      expect(screen.queryByText('name')).not.toBeInTheDocument()
    })
  })

  describe('handleRowClick', () => {
    it('selects the tenant request and shows TenantRequestDisplay', async () => {
      const tenantRequest = makeTenantRequest({ name: 'name' })
      tenantRequestStore.tenantRequests = [tenantRequest]

      renderComponent()
      await screen.findByText('Tenant Requests')

      await fireEvent.click(screen.getByText('name'))

      expect(screen.getByTestId('selected-request-id')).toHaveTextContent(
        tenantRequest.id,
      )
      expect(screen.queryByText('Tenant Requests')).not.toBeInTheDocument()
    })
  })

  describe('handleCancel', () => {
    it('returns to the table when cancel is emitted', async () => {
      tenantRequestStore.tenantRequests = [makeTenantRequest({ name: 'name' })]

      renderComponent()
      await screen.findByText('Tenant Requests')
      await fireEvent.click(screen.getByText('name'))

      await fireEvent.click(screen.getByRole('button', { name: 'stub-cancel' }))

      expect(await screen.findByText('Tenant Requests')).toBeInTheDocument()
    })
  })

  describe('handleApproved', () => {
    const selectRequest = async () => {
      const tenantRequest = makeTenantRequest({ name: 'name' })
      tenantRequestStore.tenantRequests = [tenantRequest]

      renderComponent()
      await screen.findByText('Tenant Requests')
      await fireEvent.click(screen.getByText('name'))

      return tenantRequest
    }

    it('updates status, notifies success, and returns to the table', async () => {
      tenantRequestStore.updateTenantRequestStatus = vi
        .fn()
        .mockResolvedValue(undefined)

      const tenantRequest = await selectRequest()
      await fireEvent.click(
        screen.getByRole('button', { name: 'stub-approve' }),
      )

      expect(tenantRequestStore.updateTenantRequestStatus).toHaveBeenCalledWith(
        tenantRequest.id,
        TENANT_REQUEST_STATUS.APPROVED.value,
        undefined,
        'Approved Tenant Name',
      )
      expect(notificationMock.success).toHaveBeenCalledWith(
        'Tenant Request has been successfully updated',
      )
      expect(await screen.findByText('Tenant Requests')).toBeInTheDocument()
    })

    it('flags a duplicate name on a generic DuplicateEntityError', async () => {
      tenantRequestStore.updateTenantRequestStatus = vi
        .fn()
        .mockRejectedValue(new DuplicateEntityError())

      await selectRequest()
      await fireEvent.click(
        screen.getByRole('button', { name: 'stub-approve' }),
      )

      expect(screen.getByTestId('is-duplicate-name')).toHaveTextContent('true')
      expect(notificationMock.error).not.toHaveBeenCalled()
    })

    it('shows a specific message when the request status has already changed', async () => {
      const error = new DuplicateEntityError()
      error.userMessage = 'Cannot update tenant request with status APPROVED'
      tenantRequestStore.updateTenantRequestStatus = vi
        .fn()
        .mockRejectedValue(error)

      await selectRequest()
      await fireEvent.click(
        screen.getByRole('button', { name: 'stub-approve' }),
      )

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Requests can only have a status change from New. Start a new ' +
          'request instead',
      )
      expect(screen.getByTestId('is-duplicate-name')).toHaveTextContent('false')
    })

    it('shows the API user message for a DomainError with userMessage', async () => {
      tenantRequestStore.updateTenantRequestStatus = vi
        .fn()
        .mockRejectedValue(new DomainError('message', 'userMessage'))

      await selectRequest()
      await fireEvent.click(
        screen.getByRole('button', { name: 'stub-approve' }),
      )

      expect(notificationMock.error).toHaveBeenCalledWith('userMessage')
    })

    it('shows a generic error notification for an unexpected error', async () => {
      tenantRequestStore.updateTenantRequestStatus = vi
        .fn()
        .mockRejectedValue(new Error('message'))

      await selectRequest()
      await fireEvent.click(
        screen.getByRole('button', { name: 'stub-approve' }),
      )

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to update Tenant Request',
      )
    })

    it('clears the duplicate flag when clear-duplicate-error is emitted', async () => {
      tenantRequestStore.updateTenantRequestStatus = vi
        .fn()
        .mockRejectedValue(new DuplicateEntityError())

      await selectRequest()
      await fireEvent.click(
        screen.getByRole('button', { name: 'stub-approve' }),
      )
      expect(screen.getByTestId('is-duplicate-name')).toHaveTextContent('true')

      await fireEvent.click(
        screen.getByRole('button', { name: 'stub-clear-duplicate-error' }),
      )

      expect(screen.getByTestId('is-duplicate-name')).toHaveTextContent('false')
    })
  })

  describe('handleRejected', () => {
    it('updates status with notes, notifies success, and returns to the table', async () => {
      tenantRequestStore.updateTenantRequestStatus = vi
        .fn()
        .mockResolvedValue(undefined)
      const tenantRequest = makeTenantRequest({ name: 'name' })
      tenantRequestStore.tenantRequests = [tenantRequest]

      renderComponent()
      await screen.findByText('Tenant Requests')
      await fireEvent.click(screen.getByText('name'))

      await fireEvent.click(screen.getByRole('button', { name: 'stub-reject' }))

      expect(tenantRequestStore.updateTenantRequestStatus).toHaveBeenCalledWith(
        tenantRequest.id,
        TENANT_REQUEST_STATUS.REJECTED.value,
        'rejectionReason',
      )
      expect(notificationMock.success).toHaveBeenCalledWith(
        'Tenant Request has been successfully updated',
      )
      expect(await screen.findByText('Tenant Requests')).toBeInTheDocument()
    })

    it('shows a generic error notification when the update fails', async () => {
      tenantRequestStore.updateTenantRequestStatus = vi
        .fn()
        .mockRejectedValue(new Error('fail'))
      tenantRequestStore.tenantRequests = [makeTenantRequest({ name: 'name' })]

      renderComponent()
      await screen.findByText('Tenant Requests')
      await fireEvent.click(screen.getByText('name'))

      await fireEvent.click(screen.getByRole('button', { name: 'stub-reject' }))

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to update Tenant Request',
      )
    })
  })
})
