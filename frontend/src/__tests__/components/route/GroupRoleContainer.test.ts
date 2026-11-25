import userEvent from '@testing-library/user-event'
import { render, screen, waitFor, within } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'
import { ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import {
  makeGroup,
  makeGroupService,
  makeGroupServiceRole,
  makeRoleServiceUser,
  makeRoleTenantOwner,
  makeRoleUserAdmin,
  makeTenant,
  makeUser,
} from '@/__tests__/__factories__'
import { createMockAuthStore } from '@/__tests__/__helpers__/useAuthStore.mock'

import GroupRoleContainer from '@/components/route/GroupRoleContainer.vue'
import { useNotification } from '@/composables/useNotification'
import { toGroupId } from '@/models/group.model'
import { toGroupServiceId } from '@/models/groupservice.model'
import { toGroupServiceRoleId } from '@/models/groupservicerole.model'
import { toTenantId } from '@/models/tenant.model'
import { useGroupStore } from '@/stores/useGroupStore'
import { useTenantStore } from '@/stores/useTenantStore'

vi.mock('@/composables/useNotification', () => ({
  useNotification: vi.fn(),
}))

let currentAuthStore = createMockAuthStore()
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => currentAuthStore,
}))

const vuetify = createVuetify()

const renderComponent = ({
  groupId = 'groupIdDefault',
  tenantId = 'tenantIdDefault',
} = {}) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '',
        component: { template: '<div />' },
      },
      {
        path: '/tenants/:tenantId/services',
        component: { template: '<div />' },
      },
    ],
  })

  const view = render(GroupRoleContainer, {
    global: {
      plugins: [router, vuetify],
    },
    props: { groupId: toGroupId(groupId), tenantId: toTenantId(tenantId) },
  })

  return { ...view, router }
}

describe('GroupRoleContainer.vue', () => {
  let groupStore: ReturnType<typeof useGroupStore>
  let tenantStore: ReturnType<typeof useTenantStore>

  let notificationMock: ReturnType<typeof useNotification>

  beforeEach(() => {
    setActivePinia(createPinia())

    currentAuthStore = createMockAuthStore()

    groupStore = useGroupStore()
    groupStore.groups = [makeGroup({ id: toGroupId('groupIdDefault') })]
    groupStore.updateGroupServiceRoles = vi.fn().mockResolvedValue(undefined)

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

    vi.clearAllMocks()
  })

  describe('when the tenant is missing', () => {
    it('reports an error', async () => {
      expect(() => renderComponent({ tenantId: 'tenantId' })).toThrow(
        'Tenant tenantId not found',
      )
    })
  })

  describe('no connected services', () => {
    it('tells a non-admin to contact the tenant owner', () => {
      const currentUser = makeUser({ roles: [makeRoleServiceUser()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]

      renderComponent({ tenantId: 'tenantId' })

      expect(
        screen.getByRole('heading', { name: 'No service roles available yet' }),
      ).toBeInTheDocument()
      expect(
        screen.getByText('Contact your tenant owner for assistance.'),
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Go to connected services' }),
      ).not.toBeInTheDocument()
    })

    it('shows the setup instructions to a tenant owner', () => {
      const currentUser = makeUser({ roles: [makeRoleTenantOwner()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]

      renderComponent({ tenantId: 'tenantId' })

      expect(
        screen.getByRole('heading', {
          name: 'No connected services added yet',
        }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Go to connected services' }),
      ).toBeInTheDocument()
      expect(
        screen.queryByText('Contact your tenant owner for assistance.'),
      ).not.toBeInTheDocument()
    })

    it('shows the setup instructions to a user admin', () => {
      const currentUser = makeUser({ roles: [makeRoleUserAdmin()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]

      renderComponent({ tenantId: 'tenantId' })

      expect(
        screen.getByRole('heading', {
          name: 'No connected services added yet',
        }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Go to connected services' }),
      ).toBeInTheDocument()
      expect(
        screen.queryByText('Contact your tenant owner for assistance.'),
      ).not.toBeInTheDocument()
    })

    it('navigates to the services page when the button is clicked', async () => {
      const user = userEvent.setup()
      const currentUser = makeUser({ roles: [makeRoleUserAdmin()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]

      const { router } = renderComponent({ tenantId: 'tenantId' })

      await user.click(
        screen.getByRole('button', { name: 'Go to connected services' }),
      )

      expect(router.currentRoute.value.fullPath).toBe(
        '/tenants/tenantId/services',
      )
    })

    it('does not show the role editor', () => {
      renderComponent()

      expect(
        screen.queryByRole('heading', { name: 'Connected service roles' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Edit' }),
      ).not.toBeInTheDocument()
    })
  })

  describe('with connected services', () => {
    it('renders the heading and each service', () => {
      groupStore.groupServices = [
        makeGroupService({ displayName: 'groupServiceDisplayName1' }),
        makeGroupService({ displayName: 'groupServiceDisplayName2' }),
      ]
      renderComponent()

      expect(
        screen.getByRole('heading', { name: 'Connected service roles' }),
      ).toBeInTheDocument()
      expect(screen.getByText('groupServiceDisplayName1')).toBeInTheDocument()
      expect(screen.getByText('groupServiceDisplayName2')).toBeInTheDocument()
    })

    it('does not show the setup instructions', () => {
      groupStore.groupServices = [makeGroupService()]

      renderComponent()

      expect(
        screen.queryByRole('heading', {
          name: 'No connected services added yet',
        }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('heading', {
          name: 'No service roles available yet',
        }),
      ).not.toBeInTheDocument()
    })

    it('renders a checkbox per role reflecting isEnabled', () => {
      groupStore.groupServices = [
        makeGroupService({
          roles: [
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRole1'),
              isEnabled: true,
              name: 'Admin',
            }),
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRole2'),
              isEnabled: false,
              name: 'Viewer',
            }),
          ],
        }),
        makeGroupService({
          roles: [
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRole3'),
              isEnabled: false,
              name: 'Editor',
            }),
          ],
        }),
      ]

      renderComponent()

      expect(screen.getByRole('checkbox', { name: 'Admin' })).toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Viewer' })).not.toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Editor' })).not.toBeChecked()
    })

    it('disables the checkboxes when not editing', () => {
      groupStore.groupServices = [
        makeGroupService({
          roles: [
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRole1'),
              isEnabled: true,
              name: 'Admin',
            }),
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRole2'),
              isEnabled: false,
              name: 'Viewer',
            }),
          ],
        }),
      ]

      renderComponent()

      expect(screen.getByRole('checkbox', { name: 'Admin' })).toBeDisabled()
      expect(screen.getByRole('checkbox', { name: 'Viewer' })).toBeDisabled()
    })

    it('disables the action buttons when not editing', () => {
      const currentUser = makeUser({ roles: [makeRoleUserAdmin()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      groupStore.groupServices = [makeGroupService()]
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]

      renderComponent({ tenantId: 'tenantId' })

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Clear all' })).toBeDisabled()
      expect(
        screen.getByRole('button', { name: 'Undo changes' }),
      ).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    })

    it('does not show a dialog initially', () => {
      const currentUser = makeUser({ roles: [makeRoleUserAdmin()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      groupStore.groupServices = [makeGroupService()]
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]

      renderComponent({ tenantId: 'tenantId' })

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('permissions', () => {
    it('shows Edit and the action buttons for a tenant owner', () => {
      const currentUser = makeUser({ roles: [makeRoleTenantOwner()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      groupStore.groupServices = [makeGroupService()]
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]

      renderComponent({ tenantId: 'tenantId' })

      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Clear all' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Undo changes' }),
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    })

    it('shows Edit and the action buttons for a user admin', () => {
      const currentUser = makeUser({ roles: [makeRoleUserAdmin()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      groupStore.groupServices = [makeGroupService()]
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]

      renderComponent({ tenantId: 'tenantId' })

      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Clear all' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Undo changes' }),
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    })

    it('hides Edit and the action buttons for a non-admin', () => {
      const currentUser = makeUser({ roles: [makeRoleServiceUser()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      groupStore.groupServices = [makeGroupService()]
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]

      renderComponent({ tenantId: 'tenantId' })

      expect(
        screen.queryByRole('button', { name: 'Edit' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Cancel' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Clear all' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Undo changes' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Save' }),
      ).not.toBeInTheDocument()
    })

    it('still lets a non-admin see the roles', () => {
      const currentUser = makeUser({ roles: [makeRoleServiceUser()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      groupStore.groupServices = [
        makeGroupService({
          roles: [
            makeGroupServiceRole({
              isEnabled: true,
              name: 'Admin',
            }),
          ],
        }),
      ]
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]

      renderComponent({ tenantId: 'tenantId' })

      expect(screen.getByRole('checkbox', { name: 'Admin' })).toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Admin' })).toBeDisabled()
    })
  })

  describe('editing', () => {
    it('enables the checkboxes and buttons and hides Edit', async () => {
      const user = userEvent.setup()
      const currentUser = makeUser({ roles: [makeRoleTenantOwner()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      groupStore.groupServices = [
        makeGroupService({
          roles: [
            makeGroupServiceRole({
              isEnabled: true,
              name: 'Admin',
            }),
          ],
        }),
      ]
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]

      renderComponent({ tenantId: 'tenantId' })
      await user.click(screen.getByRole('button', { name: 'Edit' }))

      expect(
        screen.queryByRole('button', { name: 'Edit' }),
      ).not.toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: 'Admin' })).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Clear all' })).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Undo changes' })).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
    })

    it('starts the draft from the current role state', async () => {
      const user = userEvent.setup()
      const currentUser = makeUser({ roles: [makeRoleTenantOwner()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      groupStore.groupServices = [
        makeGroupService({
          roles: [
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRole1'),
              isEnabled: true,
              name: 'Admin',
            }),
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRole2'),
              isEnabled: false,
              name: 'Viewer',
            }),
          ],
        }),
      ]
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]

      renderComponent({ tenantId: 'tenantId' })
      await user.click(screen.getByRole('button', { name: 'Edit' }))

      expect(screen.getByRole('checkbox', { name: 'Admin' })).toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Viewer' })).not.toBeChecked()
    })

    it('toggles a role in the draft', async () => {
      const user = userEvent.setup()
      const currentUser = makeUser({ roles: [makeRoleTenantOwner()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      groupStore.groupServices = [
        makeGroupService({
          roles: [
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRole1'),
              isEnabled: true,
              name: 'Admin',
            }),
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRole2'),
              isEnabled: false,
              name: 'Viewer',
            }),
          ],
        }),
      ]
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]

      renderComponent({ tenantId: 'tenantId' })
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      await user.click(screen.getByRole('checkbox', { name: 'Viewer' }))
      await user.click(screen.getByRole('checkbox', { name: 'Admin' }))

      expect(screen.getByRole('checkbox', { name: 'Viewer' })).toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Admin' })).not.toBeChecked()
    })

    it('does not change the store until the draft is saved', async () => {
      const user = userEvent.setup()
      const currentUser = makeUser({ roles: [makeRoleTenantOwner()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      groupStore.groupServices = [
        makeGroupService({
          roles: [
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRole1'),
              isEnabled: true,
              name: 'Admin',
            }),
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRole2'),
              isEnabled: false,
              name: 'Viewer',
            }),
          ],
        }),
      ]
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]

      renderComponent({ tenantId: 'tenantId' })
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      await user.click(screen.getByRole('checkbox', { name: 'Viewer' }))
      await user.click(screen.getByRole('checkbox', { name: 'Admin' }))

      expect(groupStore.groupServices[0]?.roles[0]?.isEnabled).toBe(true)
      expect(groupStore.groupServices[0]?.roles[1]?.isEnabled).toBe(false)
      expect(groupStore.updateGroupServiceRoles).not.toHaveBeenCalled()
    })

    it('discards changes and exits edit mode on Cancel', async () => {
      const user = userEvent.setup()
      const currentUser = makeUser({ roles: [makeRoleTenantOwner()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      groupStore.groupServices = [
        makeGroupService({
          roles: [
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRole2'),
              isEnabled: false,
              name: 'Viewer',
            }),
          ],
        }),
      ]
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]

      renderComponent({ tenantId: 'tenantId' })
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      await user.click(screen.getByRole('checkbox', { name: 'Viewer' }))
      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: 'Viewer' })).not.toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Viewer' })).toBeDisabled()
      expect(groupStore.updateGroupServiceRoles).not.toHaveBeenCalled()
    })

    it('starts from the stored roles when editing again after Cancel', async () => {
      const user = userEvent.setup()
      const currentUser = makeUser({ roles: [makeRoleTenantOwner()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      groupStore.groupServices = [
        makeGroupService({
          roles: [
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRole1'),
              isEnabled: true,
              name: 'Admin',
            }),
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRole2'),
              isEnabled: false,
              name: 'Viewer',
            }),
          ],
        }),
      ]
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]

      renderComponent({ tenantId: 'tenantId' })
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      await user.click(screen.getByRole('checkbox', { name: 'Viewer' }))
      await user.click(screen.getByRole('button', { name: 'Cancel' }))
      await user.click(screen.getByRole('button', { name: 'Edit' }))

      expect(screen.getByRole('checkbox', { name: 'Viewer' })).not.toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Admin' })).toBeChecked()
    })
  })

  describe('saving', () => {
    it('sends the draft selections to the store', async () => {
      const user = userEvent.setup()
      const currentUser = makeUser({ roles: [makeRoleTenantOwner()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      groupStore.groupServices = [
        makeGroupService({
          id: toGroupServiceId('groupServiceId'),
          roles: [
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRole1'),
              isEnabled: true,
              name: 'Admin',
            }),
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRole2'),
              isEnabled: false,
              name: 'Viewer',
            }),
          ],
        }),
      ]
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]

      renderComponent({ groupId: 'groupId', tenantId: 'tenantId' })
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      await user.click(screen.getByRole('checkbox', { name: 'Viewer' }))
      await user.click(screen.getByRole('checkbox', { name: 'Admin' }))
      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() =>
        expect(groupStore.updateGroupServiceRoles).toHaveBeenCalledTimes(1),
      )
      expect(groupStore.updateGroupServiceRoles).toHaveBeenCalledWith(
        'tenantId',
        'groupId',
        [
          expect.objectContaining({
            id: 'groupServiceId',
            roles: [
              expect.objectContaining({
                id: 'groupServiceRole1',
                isEnabled: false,
              }),
              expect.objectContaining({
                id: 'groupServiceRole2',
                isEnabled: true,
              }),
            ],
          }),
        ],
      )
    })

    it('sends the existing selections when nothing was changed', async () => {
      const user = userEvent.setup()
      const currentUser = makeUser({ roles: [makeRoleTenantOwner()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      groupStore.groupServices = [
        makeGroupService({
          roles: [
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRole1'),
              isEnabled: true,
              name: 'Admin',
            }),
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRole2'),
              isEnabled: false,
              name: 'Viewer',
            }),
          ],
        }),
      ]
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]

      renderComponent({ groupId: 'groupId', tenantId: 'tenantId' })
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() =>
        expect(groupStore.updateGroupServiceRoles).toHaveBeenCalledWith(
          'tenantId',
          'groupId',
          [
            expect.objectContaining({
              roles: [
                expect.objectContaining({
                  id: 'groupServiceRole1',
                  isEnabled: true,
                }),
                expect.objectContaining({
                  id: 'groupServiceRole2',
                  isEnabled: false,
                }),
              ],
            }),
          ],
        ),
      )
    })

    it('exits edit mode without showing an error', async () => {
      const user = userEvent.setup()
      const currentUser = makeUser({ roles: [makeRoleTenantOwner()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      groupStore.groupServices = [
        makeGroupService({
          roles: [
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRole1'),
              isEnabled: true,
              name: 'Admin',
            }),
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRole2'),
              isEnabled: false,
              name: 'Viewer',
            }),
          ],
        }),
      ]
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]

      renderComponent({ groupId: 'groupId', tenantId: 'tenantId' })
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(
        await screen.findByRole('button', { name: 'Edit' }),
      ).toBeInTheDocument()
      expect(notificationMock.error).not.toHaveBeenCalled()
    })

    it('shows an error notification and stays in edit mode on failure', async () => {
      const user = userEvent.setup()
      const currentUser = makeUser({ roles: [makeRoleTenantOwner()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      groupStore.groupServices = [
        makeGroupService({
          roles: [
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRole1'),
              isEnabled: true,
              name: 'Admin',
            }),
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRole2'),
              isEnabled: false,
              name: 'Viewer',
            }),
          ],
        }),
      ]
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]
      vi.mocked(groupStore.updateGroupServiceRoles).mockRejectedValue(
        new Error(),
      )

      renderComponent({ groupId: 'groupId', tenantId: 'tenantId' })
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      await user.click(screen.getByRole('checkbox', { name: 'Viewer' }))
      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() =>
        expect(notificationMock.error).toHaveBeenCalledWith(
          'Error saving roles',
        ),
      )
      expect(notificationMock.success).not.toHaveBeenCalled()
      expect(
        screen.queryByRole('button', { name: 'Edit' }),
      ).not.toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: 'Viewer' })).toBeChecked()
    })

    it('can be retried after a failure', async () => {
      const user = userEvent.setup()
      const currentUser = makeUser({ roles: [makeRoleTenantOwner()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      groupStore.groupServices = [
        makeGroupService({
          roles: [
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRole1'),
              isEnabled: true,
              name: 'Admin',
            }),
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRole2'),
              isEnabled: false,
              name: 'Viewer',
            }),
          ],
        }),
      ]
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]
      vi.mocked(groupStore.updateGroupServiceRoles).mockRejectedValueOnce(
        new Error(),
      )

      renderComponent({ groupId: 'groupId', tenantId: 'tenantId' })

      await user.click(screen.getByRole('button', { name: 'Edit' }))
      await user.click(screen.getByRole('checkbox', { name: 'Viewer' }))
      await user.click(screen.getByRole('button', { name: 'Save' }))
      await waitFor(() => expect(notificationMock.error).toHaveBeenCalled())

      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(
        await screen.findByRole('button', { name: 'Edit' }),
      ).toBeInTheDocument()
      expect(groupStore.updateGroupServiceRoles).toHaveBeenCalledTimes(2)
    })
  })

  describe('clear all', () => {
    it('opens a confirmation dialog', async () => {
      const user = userEvent.setup()
      const currentUser = makeUser({ roles: [makeRoleTenantOwner()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      groupStore.groupServices = [makeGroupService()]
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]

      renderComponent({ tenantId: 'tenantId' })
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      await user.click(screen.getByRole('button', { name: 'Clear all' }))
      const dialog = await screen.findByRole('dialog')

      expect(
        within(dialog).getByRole('heading', { name: 'Delete all selections?' }),
      ).toBeInTheDocument()
      expect(
        within(dialog).getByText(/delete all of your current role selections/i),
      ).toBeInTheDocument()
    })

    it('unchecks every role when confirmed', async () => {
      const user = userEvent.setup()
      const currentUser = makeUser({ roles: [makeRoleTenantOwner()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      groupStore.groupServices = [
        makeGroupService({
          roles: [
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRole1'),
              isEnabled: true,
              name: 'Admin',
            }),
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRole2'),
              isEnabled: false,
              name: 'Viewer',
            }),
          ],
        }),
        makeGroupService({
          roles: [
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRole3'),
              isEnabled: false,
              name: 'Editor',
            }),
          ],
        }),
      ]
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]

      renderComponent({ tenantId: 'tenantId' })
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      await user.click(screen.getByRole('button', { name: 'Clear all' }))
      await user.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'Clear all',
        }),
      )

      await waitFor(() =>
        expect(
          screen.getByRole('checkbox', { name: 'Admin' }),
        ).not.toBeChecked(),
      )
      expect(screen.getByRole('checkbox', { name: 'Viewer' })).not.toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Editor' })).not.toBeChecked()
      await waitFor(() =>
        expect(screen.getByTestId('button-confirm')).not.toBeVisible(),
      )
    })

    it('stays in edit mode and does not save when confirmed', async () => {
      const user = userEvent.setup()
      const currentUser = makeUser({ roles: [makeRoleTenantOwner()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      groupStore.groupServices = [
        makeGroupService({
          roles: [makeGroupServiceRole({ isEnabled: true, name: 'Admin' })],
        }),
      ]
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]

      renderComponent({ tenantId: 'tenantId' })
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      await user.click(screen.getByRole('button', { name: 'Clear all' }))
      await user.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'Clear all',
        }),
      )

      await waitFor(() =>
        expect(
          screen.getByRole('checkbox', { name: 'Admin' }),
        ).not.toBeChecked(),
      )
      expect(
        screen.queryByRole('button', { name: 'Edit' }),
      ).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
      expect(groupStore.updateGroupServiceRoles).not.toHaveBeenCalled()
    })

    it('saves every role as disabled after being cleared', async () => {
      const user = userEvent.setup()
      const currentUser = makeUser({ roles: [makeRoleTenantOwner()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      groupStore.groupServices = [
        makeGroupService({
          roles: [
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupRoleId'),
              isEnabled: true,
              name: 'Admin',
            }),
          ],
        }),
      ]
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]

      renderComponent({ groupId: 'groupId', tenantId: 'tenantId' })
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      await user.click(screen.getByRole('button', { name: 'Clear all' }))
      await user.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'Clear all',
        }),
      )
      await waitFor(() =>
        expect(
          screen.getByRole('checkbox', { name: 'Admin' }),
        ).not.toBeChecked(),
      )
      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() =>
        expect(groupStore.updateGroupServiceRoles).toHaveBeenCalledWith(
          'tenantId',
          'groupId',
          [
            expect.objectContaining({
              roles: [
                expect.objectContaining({
                  id: 'groupRoleId',
                  isEnabled: false,
                }),
              ],
            }),
          ],
        ),
      )
    })

    it('keeps the selections when the dialog is cancelled', async () => {
      const user = userEvent.setup()
      const currentUser = makeUser({ roles: [makeRoleTenantOwner()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      groupStore.groupServices = [
        makeGroupService({
          roles: [makeGroupServiceRole({ isEnabled: true, name: 'Admin' })],
        }),
      ]
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]

      renderComponent({ tenantId: 'tenantId' })
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      await user.click(screen.getByRole('button', { name: 'Clear all' }))
      await user.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'Cancel',
        }),
      )

      await waitFor(() =>
        expect(screen.getByTestId('button-confirm')).not.toBeVisible(),
      )
      expect(screen.getByRole('checkbox', { name: 'Admin' })).toBeChecked()
    })

    it('keeps the selections when the dialog is dismissed with Escape', async () => {
      const user = userEvent.setup()
      const currentUser = makeUser({ roles: [makeRoleTenantOwner()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      groupStore.groupServices = [
        makeGroupService({
          roles: [makeGroupServiceRole({ isEnabled: true, name: 'Admin' })],
        }),
      ]
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]

      renderComponent({ tenantId: 'tenantId' })
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      await user.click(screen.getByRole('button', { name: 'Clear all' }))
      await screen.findByRole('dialog')
      await user.keyboard('{Escape}')

      await waitFor(() =>
        expect(screen.getByTestId('button-confirm')).not.toBeVisible(),
      )
      expect(screen.getByRole('checkbox', { name: 'Admin' })).toBeChecked()
    })
  })

  describe('undo changes', () => {
    it('opens a confirmation dialog', async () => {
      const user = userEvent.setup()
      const currentUser = makeUser({ roles: [makeRoleTenantOwner()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      groupStore.groupServices = [
        makeGroupService({
          roles: [makeGroupServiceRole({ isEnabled: true, name: 'Admin' })],
        }),
      ]
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]

      renderComponent({ tenantId: 'tenantId' })
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      await user.click(screen.getByRole('button', { name: 'Undo changes' }))

      const dialog = await screen.findByRole('dialog')
      expect(
        within(dialog).getByRole('heading', {
          name: 'Revert to previous roles?',
        }),
      ).toBeInTheDocument()
      expect(
        within(dialog).getByText(/restore the previously assigned roles/i),
      ).toBeInTheDocument()
      expect(
        within(dialog).getByRole('button', { name: 'Revert' }),
      ).toBeInTheDocument()
    })

    it('restores the original selections when confirmed', async () => {
      const user = userEvent.setup()
      const currentUser = makeUser({ roles: [makeRoleTenantOwner()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      groupStore.groupServices = [
        makeGroupService({
          roles: [
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRole1'),
              isEnabled: true,
              name: 'Admin',
            }),
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRole2'),
              isEnabled: false,
              name: 'Viewer',
            }),
          ],
        }),
      ]
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]

      renderComponent({ tenantId: 'tenantId' })
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      await user.click(screen.getByRole('checkbox', { name: 'Viewer' }))
      await user.click(screen.getByRole('checkbox', { name: 'Admin' }))
      await user.click(screen.getByRole('button', { name: 'Undo changes' }))
      await user.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'Revert',
        }),
      )

      await waitFor(() =>
        expect(
          screen.getByRole('checkbox', { name: 'Viewer' }),
        ).not.toBeChecked(),
      )
      expect(screen.getByRole('checkbox', { name: 'Admin' })).toBeChecked()
    })

    it('stays in edit mode after reverting', async () => {
      const user = userEvent.setup()
      const currentUser = makeUser({ roles: [makeRoleTenantOwner()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      groupStore.groupServices = [
        makeGroupService({
          roles: [makeGroupServiceRole({ isEnabled: false, name: 'Viewer' })],
        }),
      ]
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]

      renderComponent({ tenantId: 'tenantId' })
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      await user.click(screen.getByRole('checkbox', { name: 'Viewer' }))
      await user.click(screen.getByRole('button', { name: 'Undo changes' }))
      await user.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'Revert',
        }),
      )

      await waitFor(() =>
        expect(
          screen.getByRole('checkbox', { name: 'Viewer' }),
        ).not.toBeChecked(),
      )
      expect(
        screen.queryByRole('button', { name: 'Edit' }),
      ).not.toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: 'Viewer' })).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
      expect(groupStore.updateGroupServiceRoles).not.toHaveBeenCalled()
    })

    it('keeps the current selections when the dialog is cancelled', async () => {
      const user = userEvent.setup()
      const currentUser = makeUser({ roles: [makeRoleTenantOwner()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      groupStore.groupServices = [
        makeGroupService({
          roles: [makeGroupServiceRole({ isEnabled: false, name: 'Viewer' })],
        }),
      ]
      const tenant = makeTenant({
        id: toTenantId('tenantId'),
        users: [currentUser],
      })
      tenantStore.tenants = [tenant]

      renderComponent({ tenantId: 'tenantId' })
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      await user.click(screen.getByRole('checkbox', { name: 'Viewer' }))
      await user.click(screen.getByRole('button', { name: 'Undo changes' }))
      await user.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'Cancel',
        }),
      )

      await waitFor(() =>
        expect(screen.getByTestId('button-confirm')).not.toBeVisible(),
      )
      expect(screen.getByRole('checkbox', { name: 'Viewer' })).toBeChecked()
    })
  })
})
