import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import {
  makeRoleServiceUser,
  makeRoleTenantOwner,
  makeRoleUserAdmin,
  makeSsoUser,
  makeUser,
  makeUserBceidBusiness,
  makeUserIdir,
} from '@/__tests__/__factories__'

import RoleDialog from '@/components/tenant/RoleDialog.vue'
import { type Role, type RoleId, toRoleId } from '@/models/role.model'
import { type User } from '@/models/user.model'
import { ROLES } from '@/utils/constants'

const vuetify = createVuetify({ components, directives })

const serviceUser = makeRoleServiceUser({ id: toRoleId('service-id') })
const tenantOwner = makeRoleTenantOwner({ id: toRoleId('tenant-owner-id') })
const userAdmin = makeRoleUserAdmin({ id: toRoleId('user-admin-id') })

const allRoles = [serviceUser, tenantOwner, userAdmin]

function renderComponent(props: {
  modelValue?: boolean
  roles?: Role[]
  user: User
}) {
  return render(RoleDialog, {
    global: { plugins: [vuetify] },
    props: {
      modelValue: true,
      roles: allRoles,
      ...props,
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('RoleDialog', () => {
  describe('rendering', () => {
    it('shows the title', () => {
      renderComponent({ user: makeUserIdir() })

      expect(screen.getByText('Edit tenant roles')).toBeInTheDocument()
    })

    it('renders nothing when modelValue is false', () => {
      renderComponent({
        modelValue: false,
        user: makeUserIdir({ roles: [serviceUser] }),
      })

      expect(screen.queryByText('Edit tenant roles')).not.toBeInTheDocument()
    })

    it('shows the name of the user', () => {
      const user = makeUserIdir({
        ssoUser: makeSsoUser({
          firstName: 'user.ssoUser.firstName',
          lastName: 'user.ssoUser.lastName',
        }),
      })

      renderComponent({ user })

      expect(
        screen.getByText('user.ssoUser.firstName user.ssoUser.lastName (IDIR)'),
      ).toBeInTheDocument()
    })

    it('shows all three roles with descriptions for IDIR user', () => {
      renderComponent({ user: makeUserIdir() })

      expect(
        screen.getByRole('checkbox', {
          name: `${ROLES.SERVICE_USER.title} role`,
        }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('checkbox', {
          name: `${ROLES.TENANT_OWNER.title} role`,
        }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('checkbox', {
          name: `${ROLES.USER_ADMIN.title} role`,
        }),
      ).toBeInTheDocument()
    })

    it('shows only the service user role for BCeID Business users', () => {
      const user = makeUserBceidBusiness()

      renderComponent({ user })

      expect(
        screen.getByRole('checkbox', {
          name: `${ROLES.SERVICE_USER.title} role`,
        }),
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('checkbox', {
          name: `${ROLES.TENANT_OWNER.title} role`,
        }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('checkbox', {
          name: `${ROLES.USER_ADMIN.title} role`,
        }),
      ).not.toBeInTheDocument()
    })

    it('checks the roles the user already has', () => {
      renderComponent({
        user: makeUserIdir({ roles: [tenantOwner, serviceUser] }),
      })

      expect(
        screen.getByRole('checkbox', {
          name: `${ROLES.SERVICE_USER.title} role`,
        }),
      ).toBeChecked()
      expect(
        screen.getByRole('checkbox', {
          name: `${ROLES.TENANT_OWNER.title} role`,
        }),
      ).toBeChecked()
      expect(
        screen.getByRole('checkbox', {
          name: `${ROLES.USER_ADMIN.title} role`,
        }),
      ).not.toBeChecked()
    })
  })

  describe('select all', () => {
    const selectAll = () =>
      screen.getByRole('checkbox', { name: 'Select all roles' })

    it('checks every role when select all is checked', async () => {
      const user = userEvent.setup()

      renderComponent({ user: makeUserIdir() })
      await user.click(selectAll())

      expect(selectAll()).toBeChecked()
      for (const role of [
        ROLES.SERVICE_USER,
        ROLES.TENANT_OWNER,
        ROLES.USER_ADMIN,
      ]) {
        expect(
          screen.getByRole('checkbox', { name: `${role.title} role` }),
        ).toBeChecked()
      }
    })

    it('unchecks every role when select all is unchecked', async () => {
      const user = userEvent.setup()

      renderComponent({
        user: makeUserIdir({ roles: [serviceUser, tenantOwner, userAdmin] }),
      })
      expect(selectAll()).toBeChecked()

      await user.click(selectAll())

      for (const role of [
        ROLES.SERVICE_USER,
        ROLES.TENANT_OWNER,
        ROLES.USER_ADMIN,
      ]) {
        expect(
          screen.getByRole('checkbox', { name: `${role.title} role` }),
        ).not.toBeChecked()
      }
    })

    it('is indeterminate when only some roles are checked', () => {
      renderComponent({ user: makeUserIdir({ roles: [serviceUser] }) })

      expect(selectAll()).toBePartiallyChecked()
    })

    it('is neither checked nor indeterminate when no roles are checked', () => {
      renderComponent({ user: makeUserIdir() })

      expect(selectAll()).not.toBeChecked()
      expect(selectAll()).not.toBePartiallyChecked()
    })

    it('emits all roles to add after select all and save', async () => {
      const userIdir = makeUserIdir()
      const user = userEvent.setup()

      const { emitted } = renderComponent({ user: userIdir })
      await user.click(selectAll())
      await user.click(screen.getByRole('button', { name: 'Save roles' }))

      const [, toAdd, toRemove] = emitted()['roles-changed'][0] as [
        User,
        RoleId[],
        RoleId[],
      ]
      expect(toAdd).toEqual(
        expect.arrayContaining([serviceUser.id, tenantOwner.id, userAdmin.id]),
      )
      expect(toRemove).toEqual([])
    })
  })

  describe('save button state', () => {
    it('is disabled when nothing has changed', () => {
      renderComponent({ user: makeUserIdir() })

      expect(screen.getByRole('button', { name: 'Save roles' })).toBeDisabled()
    })

    it('is enabled after adding a role', async () => {
      const user = userEvent.setup()

      renderComponent({ user: makeUserIdir() })
      await user.click(
        screen.getByRole('checkbox', {
          name: `${ROLES.USER_ADMIN.title} role`,
        }),
      )

      expect(screen.getByRole('button', { name: 'Save roles' })).toBeEnabled()
    })

    it('is enabled after swapping one role for another', async () => {
      const user = userEvent.setup()

      renderComponent({ user: makeUserIdir({ roles: [serviceUser] }) })
      await user.click(
        screen.getByRole('checkbox', {
          name: `${ROLES.USER_ADMIN.title} role`,
        }),
      )
      await user.click(
        screen.getByRole('checkbox', {
          name: `${ROLES.SERVICE_USER.title} role`,
        }),
      )

      expect(screen.getByRole('button', { name: 'Save roles' })).toBeEnabled()
    })

    it('is disabled again when a change is reverted', async () => {
      const user = userEvent.setup()

      renderComponent({ user: makeUserIdir({ roles: [serviceUser] }) })
      await user.click(
        screen.getByRole('checkbox', {
          name: `${ROLES.USER_ADMIN.title} role`,
        }),
      )
      await user.click(
        screen.getByRole('checkbox', {
          name: `${ROLES.USER_ADMIN.title} role`,
        }),
      )

      expect(screen.getByRole('button', { name: 'Save roles' })).toBeDisabled()
    })

    it('is disabled when every role is unchecked', async () => {
      const user = userEvent.setup()

      renderComponent({ user: makeUserIdir({ roles: [serviceUser] }) })
      await user.click(
        screen.getByRole('checkbox', {
          name: `${ROLES.SERVICE_USER.title} role`,
        }),
      )

      expect(screen.getByRole('button', { name: 'Save roles' })).toBeDisabled()
    })

    it('stays disabled for a BCeID Business user who has the service role', async () => {
      const user = userEvent.setup()

      renderComponent({
        user: makeUserBceidBusiness({ roles: [serviceUser] }),
      })
      await user.click(
        screen.getByRole('checkbox', {
          name: `${ROLES.SERVICE_USER.title} role`,
        }),
      )

      expect(screen.getByRole('button', { name: 'Save roles' })).toBeDisabled()
    })
  })

  describe('save', () => {
    it('emits only rolesToAdd when roles are added', async () => {
      const userIdir = makeUserIdir({ roles: [serviceUser] })
      const user = userEvent.setup()

      const { emitted } = renderComponent({ user: userIdir })
      await user.click(
        screen.getByRole('checkbox', {
          name: `${ROLES.USER_ADMIN.title} role`,
        }),
      )
      await user.click(screen.getByRole('button', { name: 'Save roles' }))

      expect(emitted()['roles-changed']).toHaveLength(1)
      expect(emitted()['roles-changed'][0]).toEqual([
        userIdir,
        [userAdmin.id],
        [],
      ])
    })

    it('emits only rolesToRemove when roles are removed', async () => {
      const userIdir = makeUserIdir({ roles: [tenantOwner, serviceUser] })
      const user = userEvent.setup()

      const { emitted } = renderComponent({ user: userIdir })

      await user.click(
        screen.getByRole('checkbox', {
          name: `${ROLES.TENANT_OWNER.title} role`,
        }),
      )
      await user.click(screen.getByRole('button', { name: 'Save roles' }))

      expect(emitted()['roles-changed'][0]).toEqual([
        userIdir,
        [],
        [tenantOwner.id],
      ])
    })

    it('emits both lists when roles are added and removed', async () => {
      const userIdir = makeUserIdir({ roles: [serviceUser] })
      const user = userEvent.setup()

      const { emitted } = renderComponent({ user: userIdir })
      await user.click(
        screen.getByRole('checkbox', {
          name: `${ROLES.SERVICE_USER.title} role`,
        }),
      )
      await user.click(
        screen.getByRole('checkbox', {
          name: `${ROLES.TENANT_OWNER.title} role`,
        }),
      )
      await user.click(screen.getByRole('button', { name: 'Save roles' }))

      expect(emitted()['roles-changed'][0]).toEqual([
        userIdir,
        [tenantOwner.id],
        [serviceUser.id],
      ])
    })

    it('does not include unchanged roles in either list', async () => {
      const user = userEvent.setup()

      const { emitted } = renderComponent({
        user: makeUserIdir({ roles: [tenantOwner, serviceUser] }),
      })
      await user.click(
        screen.getByRole('checkbox', {
          name: `${ROLES.USER_ADMIN.title} role`,
        }),
      )
      await user.click(screen.getByRole('button', { name: 'Save roles' }))

      const [, toAdd, toRemove] = emitted()['roles-changed'][0] as [
        User,
        RoleId[],
        RoleId[],
      ]
      expect(toAdd).not.toContain(tenantOwner.id)
      expect(toAdd).not.toContain(serviceUser.id)
      expect(toRemove).toEqual([])
    })

    it('closes the dialog after saving', async () => {
      const user = userEvent.setup()

      const { emitted } = renderComponent({
        user: makeUserIdir({ roles: [serviceUser] }),
      })
      await user.click(
        screen.getByRole('checkbox', {
          name: `${ROLES.USER_ADMIN.title} role`,
        }),
      )
      await user.click(screen.getByRole('button', { name: 'Save roles' }))

      expect(emitted()['update:modelValue']).toHaveLength(1)
      expect(emitted()['update:modelValue'][0]).toEqual([false])
    })

    it('skips roles missing from the roles prop', async () => {
      const userIdir = makeUserIdir({ roles: [serviceUser] })
      const user = userEvent.setup()

      const { emitted } = renderComponent({
        roles: [tenantOwner, serviceUser], // no user admin role available
        user: userIdir,
      })
      await user.click(
        screen.getByRole('checkbox', {
          name: `${ROLES.USER_ADMIN.title} role`,
        }),
      )
      await user.click(screen.getByRole('button', { name: 'Save roles' }))

      expect(emitted()['roles-changed'][0]).toEqual([userIdir, [], []])
    })

    it('maps the BCeID Business service user checkbox to the service user role', async () => {
      const userIdir = makeUser({
        roles: [],
        ssoUser: makeSsoUser({ idpType: 'bceidbusiness' }),
      })
      const user = userEvent.setup()

      const { emitted } = renderComponent({ user: userIdir })
      await user.click(
        screen.getByRole('checkbox', {
          name: `${ROLES.SERVICE_USER.title} role`,
        }),
      )
      await user.click(screen.getByRole('button', { name: 'Save roles' }))

      expect(emitted()['roles-changed'][0]).toEqual([
        userIdir,
        [serviceUser.id],
        [],
      ])
    })
  })

  describe('Cancel and close', () => {
    it('Cancel requests close without emitting roles-changed', async () => {
      const user = userEvent.setup()

      const { emitted } = renderComponent({
        user: makeUserIdir({ roles: [serviceUser] }),
      })
      await user.click(
        screen.getByRole('checkbox', {
          name: `${ROLES.USER_ADMIN.title} role`,
        }),
      )
      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(emitted()['update:modelValue']).toHaveLength(1)
      expect(emitted()['update:modelValue'][0]).toEqual([false])
      expect(emitted()['roles-changed']).toBeUndefined()
    })

    it('emits update:modelValue false when Escape is pressed', async () => {
      const user = userEvent.setup()

      const { emitted } = renderComponent({ user: makeUserIdir() })
      await user.keyboard('{Escape}')

      expect(emitted()['update:modelValue']).toEqual([[false]])
      expect(emitted()['roles-changed']).toBeUndefined()
    })
  })
})
