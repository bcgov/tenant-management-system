import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import {
  makeGroup,
  makeGroupService,
  makeGroupServiceRole,
  makeTenant,
} from '@/__tests__/__factories__'

import GroupHeaderContainer from '@/components/route/GroupHeaderContainer.vue'
import { useNotification } from '@/composables/useNotification'
import { DomainError } from '@/errors/domain/DomainError'
import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import { ServerError } from '@/errors/domain/ServerError'
import { type GroupDetailFields, toGroupId } from '@/models/group.model'
import { toGroupServiceId } from '@/models/groupservice.model'
import { toGroupServiceRoleId } from '@/models/groupservicerole.model'
import { toTenantId } from '@/models/tenant.model'
import { useGroupStore } from '@/stores/useGroupStore'
import { useTenantStore } from '@/stores/useTenantStore'

vi.mock('@/composables/useNotification', () => ({
  useNotification: vi.fn(),
}))

const groupDetails = {
  description: 'groupDescriptionDefault',
  name: 'groupNameDefault',
} as GroupDetailFields

// The stub exposes the props it receives as data attributes and provides
// buttons that emit the events the container listens to, so the tests can
// observe and drive the container through the DOM.
const groupHeaderStub = {
  name: 'GroupHeader',
  emits: ['clear-duplicate-error', 'submit', 'update:dialogVisible'],
  props: [
    'dialogVisible',
    'enabledRolesCount',
    'enabledServiceCount',
    'group',
    'isDuplicateName',
    'tenant',
  ],
  setup: () => ({ groupDetails }),
  template: `
    <div
      data-testid="group-header"
      :data-dialog-visible="String(dialogVisible)"
      :data-enabled-roles-count="enabledRolesCount"
      :data-enabled-service-count="enabledServiceCount"
      :data-group-id="group.id"
      :data-is-duplicate-name="String(isDuplicateName)"
      :data-tenant-id="tenant.id"
    >
      <button @click="$emit('clear-duplicate-error')">Clear duplicate error</button>
      <button @click="$emit('submit', groupDetails)">Submit</button>
      <button @click="$emit('update:dialogVisible', true)">Open dialog</button>
      <button @click="$emit('update:dialogVisible', false)">Close dialog</button>
    </div>
  `,
}

const loadingWrapperStub = {
  name: 'LoadingWrapper',
  props: ['loading', 'loadingMessage'],
  template: '<div><slot /></div>',
}

const routerViewStub = {
  template: '<div data-testid="router-view" />',
}

const renderComponent = ({
  groupId = 'groupIdDefault',
  tenantId = 'tenantIdDefault',
} = {}) =>
  render(GroupHeaderContainer, {
    global: {
      stubs: {
        GroupHeader: groupHeaderStub,
        LoadingWrapper: loadingWrapperStub,
        RouterView: routerViewStub,
      },
    },
    props: { groupId: toGroupId(groupId), tenantId: toTenantId(tenantId) },
  })

describe('GroupHeaderContainer', () => {
  let groupStore: ReturnType<typeof useGroupStore>
  let tenantStore: ReturnType<typeof useTenantStore>

  let notificationMock: ReturnType<typeof useNotification>

  beforeEach(() => {
    setActivePinia(createPinia())

    groupStore = useGroupStore()
    groupStore.groups = [makeGroup({ id: toGroupId('groupIdDefault') })]
    groupStore.fetchGroup = vi.fn().mockResolvedValue(undefined)
    groupStore.fetchGroupServices = vi.fn().mockResolvedValue(undefined)
    groupStore.updateGroupDetails = vi.fn().mockResolvedValue(undefined)

    tenantStore = useTenantStore()
    tenantStore.tenants = [makeTenant({ id: toTenantId('tenantIdDefault') })]

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

  it('fetches the group and group services on mount', () => {
    groupStore.groups = [makeGroup({ id: toGroupId('groupId') })]
    tenantStore.tenants = [makeTenant({ id: toTenantId('tenantId') })]

    renderComponent({ groupId: 'groupId', tenantId: 'tenantId' })

    expect(groupStore.fetchGroup).toHaveBeenCalledWith('tenantId', 'groupId')
    expect(groupStore.fetchGroupServices).toHaveBeenCalledWith(
      'tenantId',
      'groupId',
    )
  })

  it('shows an error when loading the group fails', async () => {
    groupStore.fetchGroup = vi.fn().mockRejectedValue(new Error())

    renderComponent()

    await waitFor(() => {
      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to load group',
      )
    })
  })

  it('shows an error when loading group services fails', async () => {
    groupStore.fetchGroupServices = vi.fn().mockRejectedValue(new Error())

    renderComponent()

    await waitFor(() => {
      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to load group services',
      )
    })
  })

  it('passes computed props to GroupHeader', () => {
    groupStore.groups = [makeGroup({ id: toGroupId('groupId') })]
    tenantStore.tenants = [makeTenant({ id: toTenantId('tenantId') })]
    groupStore.groupServices = [
      makeGroupService({
        id: toGroupServiceId('groupServiceId1'),
        roles: [
          makeGroupServiceRole({
            id: toGroupServiceRoleId('roleId1'),
            isEnabled: false,
            name: 'roleName1',
          }),
        ],
      }),
      makeGroupService({
        id: toGroupServiceId('groupServiceId2'),
        roles: [
          makeGroupServiceRole({
            id: toGroupServiceRoleId('roleId2'),
            isEnabled: true,
            name: 'roleName2',
          }),
          makeGroupServiceRole({
            id: toGroupServiceRoleId('roleId3'),
            isEnabled: false,
            name: 'roleName3',
          }),
          makeGroupServiceRole({
            id: toGroupServiceRoleId('roleId4'),
            isEnabled: true,
            name: 'roleName4',
          }),
        ],
      }),
      makeGroupService({
        id: toGroupServiceId('groupServiceId3'),
        roles: [
          makeGroupServiceRole({
            id: toGroupServiceRoleId('roleId5'),
            isEnabled: true,
            name: 'roleName5',
          }),
        ],
      }),
    ]

    renderComponent({ groupId: 'groupId', tenantId: 'tenantId' })

    const header = screen.getByTestId('group-header')
    expect(header).toHaveAttribute('data-group-id', 'groupId')
    expect(header).toHaveAttribute('data-tenant-id', 'tenantId')
    expect(header).toHaveAttribute('data-enabled-roles-count', '3')
    expect(header).toHaveAttribute('data-enabled-service-count', '2')
  })

  it('renders the router view', () => {
    renderComponent()

    expect(screen.getByTestId('router-view')).toBeInTheDocument()
  })

  describe('edit dialog', () => {
    it('starts with the dialog closed and no duplicate error', () => {
      renderComponent()

      const header = screen.getByTestId('group-header')
      expect(header).toHaveAttribute('data-dialog-visible', 'false')
      expect(header).toHaveAttribute('data-is-duplicate-name', 'false')
    })

    it('updates dialogVisible when dialogVisible emitted', async () => {
      const user = userEvent.setup()

      renderComponent()
      await user.click(screen.getByRole('button', { name: 'Open dialog' }))

      expect(screen.getByTestId('group-header')).toHaveAttribute(
        'data-dialog-visible',
        'true',
      )

      await user.click(screen.getByRole('button', { name: 'Close dialog' }))

      expect(screen.getByTestId('group-header')).toHaveAttribute(
        'data-dialog-visible',
        'false',
      )
    })

    it('updates the group details when the form is submitted', async () => {
      const user = userEvent.setup()
      groupStore.groups = [makeGroup({ id: toGroupId('groupId') })]
      tenantStore.tenants = [makeTenant({ id: toTenantId('tenantId') })]

      renderComponent({ groupId: 'groupId', tenantId: 'tenantId' })
      await user.click(screen.getByRole('button', { name: 'Submit' }))

      expect(groupStore.updateGroupDetails).toHaveBeenCalledWith(
        'tenantId',
        'groupId',
        groupDetails,
      )
    })

    it('closes the dialog on success', async () => {
      const user = userEvent.setup()

      renderComponent()
      await user.click(screen.getByRole('button', { name: 'Open dialog' }))

      expect(screen.getByTestId('group-header')).toHaveAttribute(
        'data-dialog-visible',
        'true',
      )

      await user.click(screen.getByRole('button', { name: 'Submit' }))

      expect(screen.getByTestId('group-header')).toHaveAttribute(
        'data-dialog-visible',
        'false',
      )
      expect(notificationMock.error).not.toHaveBeenCalled()
      expect(notificationMock.success).not.toHaveBeenCalled()
    })

    describe('when the update fails', () => {
      it('flags a duplicate name and keeps the dialog open', async () => {
        const user = userEvent.setup()
        groupStore.updateGroupDetails = vi
          .fn()
          .mockRejectedValue(new DuplicateEntityError())

        renderComponent()
        await user.click(screen.getByRole('button', { name: 'Open dialog' }))

        expect(screen.getByTestId('group-header')).toHaveAttribute(
          'data-dialog-visible',
          'true',
        )

        await user.click(screen.getByRole('button', { name: 'Submit' }))

        const header = screen.getByTestId('group-header')
        expect(header).toHaveAttribute('data-is-duplicate-name', 'true')
        expect(header).toHaveAttribute('data-dialog-visible', 'true')
        expect(notificationMock.error).not.toHaveBeenCalled()
        expect(notificationMock.success).not.toHaveBeenCalled()
      })

      it('clears the duplicate name error when GroupHeader emits clear-duplicate-error', async () => {
        const user = userEvent.setup()
        groupStore.updateGroupDetails = vi
          .fn()
          .mockRejectedValue(new DuplicateEntityError())

        renderComponent()

        await user.click(screen.getByRole('button', { name: 'Submit' }))

        const header = screen.getByTestId('group-header')
        expect(header).toHaveAttribute('data-is-duplicate-name', 'true')

        await user.click(
          screen.getByRole('button', { name: 'Clear duplicate error' }),
        )

        expect(header).toHaveAttribute('data-is-duplicate-name', 'false')
      })

      it('resets the duplicate name error after a subsequent successful submit', async () => {
        const user = userEvent.setup()
        groupStore.updateGroupDetails = vi
          .fn()
          .mockRejectedValueOnce(new DuplicateEntityError())
          .mockResolvedValueOnce(undefined)

        renderComponent()
        await user.click(screen.getByRole('button', { name: 'Open dialog' }))

        expect(screen.getByTestId('group-header')).toHaveAttribute(
          'data-dialog-visible',
          'true',
        )

        await user.click(screen.getByRole('button', { name: 'Submit' }))

        const header = screen.getByTestId('group-header')
        expect(header).toHaveAttribute('data-is-duplicate-name', 'true')

        await user.click(screen.getByRole('button', { name: 'Submit' }))

        expect(header).toHaveAttribute('data-is-duplicate-name', 'false')
        expect(header).toHaveAttribute('data-dialog-visible', 'false')
      })

      it('shows the userMessage for a DomainError that has one', async () => {
        const user = userEvent.setup()
        groupStore.updateGroupDetails = vi
          .fn()
          .mockRejectedValue(new DomainError('message', 'userMessage'))

        renderComponent()
        await user.click(screen.getByRole('button', { name: 'Open dialog' }))

        expect(screen.getByTestId('group-header')).toHaveAttribute(
          'data-dialog-visible',
          'true',
        )

        await user.click(screen.getByRole('button', { name: 'Submit' }))

        const header = screen.getByTestId('group-header')
        expect(header).toHaveAttribute('data-is-duplicate-name', 'false')
        expect(header).toHaveAttribute('data-dialog-visible', 'true')
        await waitFor(() => {
          expect(notificationMock.error).toHaveBeenCalledWith('userMessage')
        })
      })

      it('shows the userMessage for a ServerError that has one', async () => {
        const user = userEvent.setup()
        groupStore.updateGroupDetails = vi
          .fn()
          .mockRejectedValue(new ServerError('userMessage'))

        renderComponent()
        await user.click(screen.getByRole('button', { name: 'Submit' }))

        await waitFor(() => {
          expect(notificationMock.error).toHaveBeenCalledWith('userMessage')
        })
      })

      it('falls back to a default message for a ServerError without a userMessage', async () => {
        const user = userEvent.setup()
        groupStore.updateGroupDetails = vi
          .fn()
          .mockRejectedValue(new ServerError())

        renderComponent()
        await user.click(screen.getByRole('button', { name: 'Submit' }))

        await waitFor(() => {
          expect(notificationMock.error).toHaveBeenCalledWith(
            'Failed to update the group',
          )
        })
      })

      it('shows a default message for an unknown error and keeps the dialog open', async () => {
        const user = userEvent.setup()
        groupStore.updateGroupDetails = vi
          .fn()
          .mockRejectedValue(new Error('unexpected'))

        renderComponent()
        await user.click(screen.getByRole('button', { name: 'Open dialog' }))

        expect(screen.getByTestId('group-header')).toHaveAttribute(
          'data-dialog-visible',
          'true',
        )

        await user.click(screen.getByRole('button', { name: 'Submit' }))

        expect(screen.getByTestId('group-header')).toHaveAttribute(
          'data-dialog-visible',
          'true',
        )
        await waitFor(() => {
          expect(notificationMock.error).toHaveBeenCalledWith(
            'Failed to update the group',
          )
        })
        expect(notificationMock.success).not.toHaveBeenCalled()
      })

      it('shows a default message when a non-Error value is thrown', async () => {
        const user = userEvent.setup()
        groupStore.updateGroupDetails = vi.fn().mockRejectedValue('nope')

        renderComponent()
        await user.click(screen.getByRole('button', { name: 'Submit' }))

        await waitFor(() => {
          expect(notificationMock.error).toHaveBeenCalledWith(
            'Failed to update the group',
          )
        })
      })
    })
  })
})
