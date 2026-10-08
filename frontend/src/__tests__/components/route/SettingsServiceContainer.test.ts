import { fireEvent, render, screen, within } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { makeService } from '@/__tests__/__factories__'

import ServiceContainer from '@/components/route/SettingsServiceContainer.vue'
import { useNotification } from '@/composables/useNotification'
import { DomainError } from '@/errors/domain/DomainError'
import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import vuetify from '@/plugins/vuetify'
import { useServiceStore } from '@/stores/useServiceStore'

vi.mock('@/composables/useNotification', () => ({
  useNotification: vi.fn(),
}))

const serviceFormStub = {
  name: 'ServiceForm',
  props: ['isDuplicateName'],
  emits: ['cancel', 'clear-duplicate-error', 'submit'],
  setup() {
    const details = { displayName: 'New Service' }
    return { details }
  },
  template: `
    <div>
      <div data-testid="is-duplicate-name">{{ String(isDuplicateName) }}</div>
      <button @click="$emit('submit', details)">stub-submit</button>
      <button @click="$emit('cancel')">stub-cancel</button>
      <button @click="$emit('clear-duplicate-error')">
        stub-clear-duplicate-error
      </button>
    </div>
  `,
}

function renderComponent() {
  return render(ServiceContainer, {
    global: {
      plugins: [vuetify],
      stubs: {
        LoginContainer: { template: '<div><slot /></div>' },
        AdministratorContainer: { template: '<div><slot /></div>' },
        ServiceForm: serviceFormStub,
      },
    },
  })
}

describe('ServiceContainer', () => {
  let serviceStore: ReturnType<typeof useServiceStore>
  let notificationMock: ReturnType<typeof useNotification>

  beforeEach(() => {
    setActivePinia(createPinia())
    serviceStore = useServiceStore()
    serviceStore.fetchServices = vi.fn().mockResolvedValue(undefined)

    notificationMock = {
      messages: ref([]),

      dismiss: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
    }
    vi.mocked(useNotification).mockReturnValue(notificationMock)
  })

  describe('init', () => {
    it('shows a loading state until fetchServices resolves', async () => {
      let resolveFetch!: () => void
      serviceStore.fetchServices = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveFetch = () => resolve()
          }),
      )

      renderComponent()

      expect(screen.queryByText('Connected services')).not.toBeInTheDocument()

      resolveFetch()
      await screen.findByText('Connected services')
    })

    it('shows error notification when fetchServices fails', async () => {
      serviceStore.fetchServices = vi
        .fn()
        .mockRejectedValue(new Error('message'))

      renderComponent()
      await screen.findByText('Connected services')

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to load service data',
      )
    })
  })

  describe('empty state', () => {
    it('shows the no-services message and button when no services', async () => {
      serviceStore.services = []

      renderComponent()
      await screen.findByText('No connected services yet')

      expect(
        screen.getByRole('button', { name: 'Add connected service' }),
      ).toBeInTheDocument()
      expect(screen.queryByLabelText('Search')).not.toBeInTheDocument()
    })
  })

  describe('populated table', () => {
    it('renders each service and a search field', async () => {
      serviceStore.services = [
        makeService({ displayName: 'displayName1' }),
        makeService({ displayName: 'displayName2' }),
      ]

      renderComponent()
      await screen.findByText('Connected services')

      const table = screen.getByRole('table')
      expect(within(table).getByText('displayName1')).toBeInTheDocument()
      expect(within(table).getByText('displayName2')).toBeInTheDocument()
      expect(screen.getByLabelText('Search')).toBeInTheDocument()
    })
  })

  describe('search', () => {
    it('filters the table and shows a no-match message when the search term does not match', async () => {
      serviceStore.services = [makeService({ displayName: 'displayName' })]

      renderComponent()
      await screen.findByText('Connected services')

      const searchInput = screen.getByLabelText('Search')
      await fireEvent.update(searchInput, 'nonexistent')

      expect(
        await screen.findByText('No matching services'),
      ).toBeInTheDocument()
      expect(screen.queryByText('displayName')).not.toBeInTheDocument()
    })
  })

  describe('handleAddService / handleCancel', () => {
    it('shows ServiceForm when add is clicked and hides it again on cancel', async () => {
      serviceStore.services = [makeService({ displayName: 'displayName' })]

      renderComponent()
      await screen.findByText('Connected services')

      await fireEvent.click(
        screen.getByRole('button', { name: 'Add connected service' }),
      )

      expect(screen.getByTestId('is-duplicate-name')).toBeInTheDocument()
      expect(screen.queryByText('Connected services')).not.toBeInTheDocument()

      await fireEvent.click(screen.getByRole('button', { name: 'stub-cancel' }))

      expect(await screen.findByText('Connected services')).toBeInTheDocument()
    })
  })

  describe('handleSubmit', () => {
    it('creates the service, notifies success, and returns to the table on success', async () => {
      serviceStore.createService = vi.fn().mockResolvedValue(undefined)
      serviceStore.services = [makeService({ displayName: 'displayName' })]

      renderComponent()
      await screen.findByText('Connected services')
      await fireEvent.click(
        screen.getByRole('button', { name: 'Add connected service' }),
      )
      await fireEvent.click(screen.getByRole('button', { name: 'stub-submit' }))

      expect(serviceStore.createService).toHaveBeenCalledWith({
        displayName: 'New Service',
      })
      expect(notificationMock.success).not.toHaveBeenCalled()
      expect(await screen.findByText('Connected services')).toBeInTheDocument()
    })

    it('flags a duplicate name and keeps the form open on DuplicateEntityError', async () => {
      serviceStore.createService = vi
        .fn()
        .mockRejectedValue(new DuplicateEntityError())

      renderComponent()
      await screen.findByText('Connected services')
      await fireEvent.click(
        screen.getByRole('button', { name: 'Add connected service' }),
      )
      await fireEvent.click(screen.getByRole('button', { name: 'stub-submit' }))

      expect(screen.getByTestId('is-duplicate-name')).toHaveTextContent('true')
      expect(notificationMock.error).not.toHaveBeenCalled()
    })

    it('shows the API user message for a DomainError with userMessage', async () => {
      serviceStore.createService = vi
        .fn()
        .mockRejectedValue(new DomainError('message', 'userMessage'))

      renderComponent()
      await screen.findByText('Connected services')
      await fireEvent.click(
        screen.getByRole('button', { name: 'Add connected service' }),
      )
      await fireEvent.click(screen.getByRole('button', { name: 'stub-submit' }))

      expect(notificationMock.error).toHaveBeenCalledWith('userMessage')
    })

    it('shows a generic error notification for an unexpected error', async () => {
      serviceStore.createService = vi
        .fn()
        .mockRejectedValue(new Error('message'))

      renderComponent()
      await screen.findByText('Connected services')
      await fireEvent.click(
        screen.getByRole('button', { name: 'Add connected service' }),
      )
      await fireEvent.click(screen.getByRole('button', { name: 'stub-submit' }))

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to create service',
      )
    })

    it('clears the duplicate flag when clear-duplicate-error is emitted', async () => {
      serviceStore.createService = vi
        .fn()
        .mockRejectedValue(new DuplicateEntityError())

      renderComponent()
      await screen.findByText('Connected services')
      await fireEvent.click(
        screen.getByRole('button', { name: 'Add connected service' }),
      )
      await fireEvent.click(screen.getByRole('button', { name: 'stub-submit' }))
      expect(screen.getByTestId('is-duplicate-name')).toHaveTextContent('true')

      await fireEvent.click(
        screen.getByRole('button', { name: 'stub-clear-duplicate-error' }),
      )

      expect(screen.getByTestId('is-duplicate-name')).toHaveTextContent('false')
    })
  })
})
