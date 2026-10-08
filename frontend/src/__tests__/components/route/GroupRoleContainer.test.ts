import userEvent from '@testing-library/user-event'
import { render, screen, waitFor, within } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'

import {
  makeGroupService,
  makeGroupServiceRole,
} from '@/__tests__/__factories__'

import GroupRoleContainer from '@/components/route/GroupRoleContainer.vue'
import { type GroupId } from '@/models/group.model'
import {
  toGroupServiceId,
  type GroupService,
} from '@/models/groupservice.model'
import { type TenantId } from '@/models/tenant.model'
import { useGroupStore } from '@/stores/useGroupStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { ROLES } from '@/utils/constants'
import { currentUserHasRole } from '@/utils/permissions'
import { toGroupServiceRoleId } from '@/models/groupservicerole.model'

const { mockNotification, mockPush } = vi.hoisted(() => ({
  mockNotification: { error: vi.fn(), success: vi.fn() },
  mockPush: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/composables/useNotification', () => ({
  useNotification: () => mockNotification,
}))

vi.mock('@/utils/permissions', () => ({
  currentUserHasRole: vi.fn(),
}))

const vuetify = createVuetify()

const GROUP_ID = 'group-1' as GroupId
const TENANT_ID = 'tenant-1' as TenantId

type UserRole = 'none' | 'tenantOwner' | 'userAdmin'

const renderComponent = ({
  groupServices = [
    makeGroupService({
      id: toGroupServiceId('service-1'),
      displayName: 'Service One',
      roles: [
        makeGroupServiceRole({
          id: toGroupServiceRoleId('role-admin'),
          name: 'Admin',
          isEnabled: true,
        }),
        makeGroupServiceRole({
          id: toGroupServiceRoleId('role-viewer'),
          name: 'Viewer',
          isEnabled: false,
        }),
      ],
    }),
    makeGroupService({
      id: toGroupServiceId('service-2'),
      displayName: 'Service Two',
      roles: [
        makeGroupServiceRole({
          id: toGroupServiceRoleId('role-editor'),
          name: 'Editor',
          isEnabled: false,
        }),
      ],
    }),
  ],
  userRole = 'userAdmin',
}: { groupServices?: GroupService[]; userRole?: UserRole } = {}) => {
  vi.mocked(currentUserHasRole).mockImplementation(
    (_tenant: unknown, role: string) =>
      (userRole === 'tenantOwner' && role === ROLES.TENANT_OWNER.value) ||
      (userRole === 'userAdmin' && role === ROLES.USER_ADMIN.value),
  )

  const pinia = createPinia()
  setActivePinia(pinia)

  const groupStore = useGroupStore(pinia)
  groupStore.groupServices = groupServices
  vi.spyOn(groupStore, 'updateGroupServiceRoles').mockResolvedValue(undefined)

  const tenantStore = useTenantStore(pinia)
  vi.spyOn(tenantStore, 'getTenant').mockReturnValue({
    id: TENANT_ID,
  } as ReturnType<typeof tenantStore.getTenant>)

  const view = render(GroupRoleContainer, {
    global: {
      plugins: [vuetify, pinia],
    },
    props: {
      groupId: GROUP_ID,
      tenantId: TENANT_ID,
    },
  })

  return { ...view, groupStore }
}

const getButton = (name: string) => screen.getByRole('button', { name })

const getCheckbox = (name: string) => screen.getByRole('checkbox', { name })

const getDialog = () => screen.findByRole('dialog')

const expectDialogClosed = () =>
  waitFor(() => expect(screen.getByTestId('button-confirm')).not.toBeVisible())

describe('GroupRoleContainer.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('no connected services', () => {
    it('shows the setup instructions to a tenant owner', () => {
      renderComponent({ groupServices: [], userRole: 'tenantOwner' })

      expect(
        screen.getByText('No connected services added yet'),
      ).toBeInTheDocument()
      expect(getButton('Go to connected services')).toBeInTheDocument()
    })

    it('shows the setup instructions to a user admin', () => {
      renderComponent({ groupServices: [], userRole: 'userAdmin' })

      expect(
        screen.getByText('No connected services added yet'),
      ).toBeInTheDocument()
    })

    it('navigates to the services page when the button is clicked', async () => {
      const user = userEvent.setup()
      renderComponent({ groupServices: [], userRole: 'userAdmin' })

      await user.click(getButton('Go to connected services'))

      expect(mockPush).toHaveBeenCalledWith(`/tenants/${TENANT_ID}/services`)
    })

    it('tells a non-admin to contact the tenant owner', () => {
      renderComponent({ groupServices: [], userRole: 'none' })

      expect(
        screen.getByText('No service roles available yet'),
      ).toBeInTheDocument()
      expect(
        screen.getByText('Contact your tenant owner for assistance.'),
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Go to connected services' }),
      ).not.toBeInTheDocument()
    })
  })

  describe('with connected services', () => {
    it('renders the heading and each service', () => {
      renderComponent()

      expect(
        screen.getByText('Adding connected services roles'),
      ).toBeInTheDocument()
      expect(screen.getByText('Service One')).toBeInTheDocument()
      expect(screen.getByText('Service Two')).toBeInTheDocument()
    })

    it('renders a checkbox per role reflecting isEnabled', () => {
      renderComponent()

      expect(getCheckbox('Admin')).toBeChecked()
      expect(getCheckbox('Viewer')).not.toBeChecked()
      expect(getCheckbox('Editor')).not.toBeChecked()
    })

    it('disables the checkboxes when not editing', () => {
      renderComponent()

      expect(getCheckbox('Admin')).toBeDisabled()
      expect(getCheckbox('Viewer')).toBeDisabled()
    })

    it('disables the action buttons when not editing', () => {
      renderComponent()

      expect(getButton('Cancel')).toBeDisabled()
      expect(getButton('Clear all')).toBeDisabled()
      expect(getButton('Undo changes')).toBeDisabled()
      expect(getButton('Save')).toBeDisabled()
    })
  })

  describe('permissions', () => {
    it.each<UserRole>(['tenantOwner', 'userAdmin'])(
      'shows Edit and the action buttons for a %s',
      (userRole) => {
        renderComponent({ userRole })

        expect(getButton('Edit')).toBeInTheDocument()
        expect(getButton('Save')).toBeInTheDocument()
      },
    )

    it('hides Edit and the action buttons for a non-admin', () => {
      renderComponent({ userRole: 'none' })

      expect(
        screen.queryByRole('button', { name: 'Edit' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Save' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Clear All' }),
      ).not.toBeInTheDocument()
    })

    it('still lets a non-admin see the roles', () => {
      renderComponent({ userRole: 'none' })

      expect(getCheckbox('Admin')).toBeChecked()
      expect(getCheckbox('Admin')).toBeDisabled()
    })
  })

  describe('editing', () => {
    it('enables the checkboxes and buttons and hides Edit', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(getButton('Edit'))

      expect(
        screen.queryByRole('button', { name: 'Edit' }),
      ).not.toBeInTheDocument()
      expect(getCheckbox('Admin')).toBeEnabled()
      expect(getButton('Cancel')).toBeEnabled()
      expect(getButton('Clear all')).toBeEnabled()
      expect(getButton('Undo changes')).toBeEnabled()
      expect(getButton('Save')).toBeEnabled()
    })

    it('starts the draft from the current role state', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(getButton('Edit'))

      expect(getCheckbox('Admin')).toBeChecked()
      expect(getCheckbox('Viewer')).not.toBeChecked()
    })

    it('toggles a role in the draft', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(getButton('Edit'))
      await user.click(getCheckbox('Viewer'))
      await user.click(getCheckbox('Admin'))

      expect(getCheckbox('Viewer')).toBeChecked()
      expect(getCheckbox('Admin')).not.toBeChecked()
    })

    it('discards changes and exits edit mode on Cancel', async () => {
      const user = userEvent.setup()
      const { groupStore } = renderComponent()

      await user.click(getButton('Edit'))
      await user.click(getCheckbox('Viewer'))
      await user.click(getButton('Cancel'))

      expect(getButton('Edit')).toBeInTheDocument()
      expect(getCheckbox('Viewer')).not.toBeChecked()
      expect(getCheckbox('Viewer')).toBeDisabled()
      expect(groupStore.updateGroupServiceRoles).not.toHaveBeenCalled()
    })
  })

  describe('saving', () => {
    it('sends the draft selections to the store', async () => {
      const user = userEvent.setup()
      const { groupStore } = renderComponent()

      await user.click(getButton('Edit'))
      await user.click(getCheckbox('Viewer'))
      await user.click(getCheckbox('Admin'))
      await user.click(getButton('Save'))

      await waitFor(() =>
        expect(groupStore.updateGroupServiceRoles).toHaveBeenCalledTimes(1),
      )
      expect(groupStore.updateGroupServiceRoles).toHaveBeenCalledWith(
        TENANT_ID,
        GROUP_ID,
        [
          expect.objectContaining({
            id: 'service-1',
            roles: [
              expect.objectContaining({ id: 'role-admin', isEnabled: false }),
              expect.objectContaining({ id: 'role-viewer', isEnabled: true }),
            ],
          }),
          expect.objectContaining({
            id: 'service-2',
            roles: [
              expect.objectContaining({ id: 'role-editor', isEnabled: false }),
            ],
          }),
        ],
      )
    })

    it('exits edit mode', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(getButton('Edit'))
      await user.click(getButton('Save'))

      expect(
        await screen.findByRole('button', { name: 'Edit' }),
      ).toBeInTheDocument()
    })

    it('shows an error notification and stays in edit mode on failure', async () => {
      const user = userEvent.setup()
      const { groupStore } = renderComponent()
      vi.mocked(groupStore.updateGroupServiceRoles).mockRejectedValue(
        new Error('boom'),
      )

      await user.click(getButton('Edit'))
      await user.click(getCheckbox('Viewer'))
      await user.click(getButton('Save'))

      await waitFor(() =>
        expect(mockNotification.error).toHaveBeenCalledWith(
          'Error saving roles',
        ),
      )
      expect(mockNotification.success).not.toHaveBeenCalled()
      expect(
        screen.queryByRole('button', { name: 'Edit' }),
      ).not.toBeInTheDocument()
      expect(getCheckbox('Viewer')).toBeChecked()
    })
  })

  describe('clear all', () => {
    it('opens a confirmation dialog', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(getButton('Edit'))
      await user.click(getButton('Clear all'))

      const dialog = await getDialog()
      expect(
        within(dialog).getByText('Delete all selections?'),
      ).toBeInTheDocument()
      expect(
        within(dialog).getByText(/delete all of your current role selections/i),
      ).toBeInTheDocument()
    })

    it('unchecks every role when confirmed', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(getButton('Edit'))
      await user.click(getButton('Clear all'))
      await user.click(
        within(await getDialog()).getByRole('button', { name: 'Clear all' }),
      )

      await waitFor(() => expect(getCheckbox('Admin')).not.toBeChecked())
      expect(getCheckbox('Viewer')).not.toBeChecked()
      expect(getCheckbox('Editor')).not.toBeChecked()
      await expectDialogClosed()
    })

    it('keeps the selections when the dialog is cancelled', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(getButton('Edit'))
      await user.click(getButton('Clear all'))
      await user.click(
        within(await getDialog()).getByRole('button', { name: 'Cancel' }),
      )

      await expectDialogClosed()
      expect(getCheckbox('Admin')).toBeChecked()
    })
  })

  describe('undo changes', () => {
    it('opens a confirmation dialog', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(getButton('Edit'))
      await user.click(getButton('Undo changes'))

      const dialog = await getDialog()
      expect(
        within(dialog).getByText('Revert to previous roles?'),
      ).toBeInTheDocument()
      expect(
        within(dialog).getByRole('button', { name: 'Revert' }),
      ).toBeInTheDocument()
    })

    it('restores the original selections when confirmed', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(getButton('Edit'))
      await user.click(getCheckbox('Viewer'))
      await user.click(getCheckbox('Admin'))
      await user.click(getButton('Undo changes'))
      await user.click(
        within(await getDialog()).getByRole('button', { name: 'Revert' }),
      )

      await waitFor(() => expect(getCheckbox('Viewer')).not.toBeChecked())
      expect(getCheckbox('Admin')).toBeChecked()
    })

    it('keeps the current selections when the dialog is cancelled', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(getButton('Edit'))
      await user.click(getCheckbox('Viewer'))
      await user.click(getButton('Undo changes'))
      await user.click(
        within(await getDialog()).getByRole('button', { name: 'Cancel' }),
      )

      await expectDialogClosed()
      expect(getCheckbox('Viewer')).toBeChecked()
    })
  })
})
