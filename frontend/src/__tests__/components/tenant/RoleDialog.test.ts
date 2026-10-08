import { fireEvent, render, screen } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
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
} from '@/__tests__/__factories__'

import RoleDialog from '@/components/tenant/RoleDialog.vue'
import { type Role, type RoleId, toRoleId } from '@/models/role.model'
import { type User } from '@/models/user.model'
import { ROLES } from '@/utils/constants'
import { isIdpBceidBusiness } from '@/utils/identityProvider'

vi.mock('@/utils/identityProvider', () => ({
  isIdpBceidBusiness: vi.fn(),
}))

const vuetify = createVuetify({ components, directives })

const serviceUser = makeRoleServiceUser({ id: toRoleId('service-id') })
const tenantOwner = makeRoleTenantOwner({ id: toRoleId('tenant-owner-id') })
const userAdmin = makeRoleUserAdmin({ id: toRoleId('user-admin-id') })

const allRoles = [serviceUser, tenantOwner, userAdmin]

const makeIdirUser = (roles: Role[]) =>
  makeUser({
    roles,
    ssoUser: makeSsoUser({ displayName: 'Jane Doe', idpType: 'idir' }),
  })

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

const checkbox = (title: string) =>
  screen.getByRole('checkbox', { name: title })

const saveButton = () => screen.getByRole('button', { name: 'Save roles' })

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(isIdpBceidBusiness).mockReturnValue(false)
})

describe('RoleDialog', () => {
  describe('Rendering', () => {
    it('shows the title and the user display name', () => {
      renderComponent({ user: makeIdirUser([serviceUser]) })

      expect(screen.getByText('Edit tenant roles')).toBeInTheDocument()
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    })

    it('renders nothing when modelValue is false', () => {
      renderComponent({ modelValue: false, user: makeIdirUser([serviceUser]) })

      expect(screen.queryByText('Edit tenant roles')).not.toBeInTheDocument()
    })

    it('shows all three roles with descriptions for non-BCeID Business users', () => {
      renderComponent({ user: makeIdirUser([serviceUser]) })

      expect(checkbox(ROLES.TENANT_OWNER.title)).toBeInTheDocument()
      expect(checkbox(ROLES.USER_ADMIN.title)).toBeInTheDocument()
      expect(checkbox(ROLES.SERVICE_USER.title)).toBeInTheDocument()
      expect(
        screen.getByText(ROLES.TENANT_OWNER.description),
      ).toBeInTheDocument()
      expect(screen.getByText(ROLES.USER_ADMIN.description)).toBeInTheDocument()
      expect(
        screen.getByText(ROLES.SERVICE_USER.description),
      ).toBeInTheDocument()
    })

    it('checks the roles the user already has', () => {
      renderComponent({ user: makeIdirUser([tenantOwner, serviceUser]) })

      expect(checkbox(ROLES.TENANT_OWNER.title)).toBeChecked()
      expect(checkbox(ROLES.USER_ADMIN.title)).not.toBeChecked()
      expect(checkbox(ROLES.SERVICE_USER.title)).toBeChecked()
    })

    it('shows only the service user role for BCeID Business users', () => {
      vi.mocked(isIdpBceidBusiness).mockReturnValue(true)
      const user = makeUser({
        roles: [serviceUser],
        ssoUser: makeSsoUser({ idpType: 'bceidbusiness' }),
      })

      renderComponent({ user })

      expect(isIdpBceidBusiness).toHaveBeenCalledWith('bceidbusiness')
      expect(checkbox(ROLES.SERVICE_USER.title)).toBeChecked()
      expect(
        screen.queryByRole('checkbox', { name: ROLES.TENANT_OWNER.title }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('checkbox', { name: ROLES.USER_ADMIN.title }),
      ).not.toBeInTheDocument()
    })
  })

  describe('Save button state', () => {
    it('is disabled when nothing has changed', () => {
      renderComponent({ user: makeIdirUser([serviceUser]) })

      expect(saveButton()).toBeDisabled()
    })

    it('is enabled after adding a role', async () => {
      renderComponent({ user: makeIdirUser([serviceUser]) })

      await fireEvent.click(checkbox(ROLES.USER_ADMIN.title))

      expect(saveButton()).toBeEnabled()
    })

    it('is enabled after swapping one role for another', async () => {
      renderComponent({ user: makeIdirUser([serviceUser]) })

      await fireEvent.click(checkbox(ROLES.USER_ADMIN.title))
      await fireEvent.click(checkbox(ROLES.SERVICE_USER.title))

      expect(saveButton()).toBeEnabled()
    })

    it('is disabled again when a change is reverted', async () => {
      renderComponent({ user: makeIdirUser([serviceUser]) })

      await fireEvent.click(checkbox(ROLES.USER_ADMIN.title))
      await fireEvent.click(checkbox(ROLES.USER_ADMIN.title))

      expect(saveButton()).toBeDisabled()
    })

    it('is disabled when every role is unchecked', async () => {
      renderComponent({ user: makeIdirUser([serviceUser]) })

      await fireEvent.click(checkbox(ROLES.SERVICE_USER.title))

      expect(checkbox(ROLES.SERVICE_USER.title)).not.toBeChecked()
      expect(saveButton()).toBeDisabled()
    })

    it('stays disabled for a BCeID Business user who has the service role', async () => {
      vi.mocked(isIdpBceidBusiness).mockReturnValue(true)
      const user = makeUser({
        roles: [serviceUser],
        ssoUser: makeSsoUser({ idpType: 'bceidbusiness' }),
      })

      renderComponent({ user })
      await fireEvent.click(checkbox(ROLES.SERVICE_USER.title))

      expect(saveButton()).toBeDisabled()
    })
  })

  describe('Save', () => {
    it('emits only rolesToAdd when roles are added', async () => {
      const user = makeIdirUser([serviceUser])
      const { emitted } = renderComponent({ user })

      await fireEvent.click(checkbox(ROLES.USER_ADMIN.title))
      await fireEvent.click(saveButton())

      expect(emitted()['roles-changed']).toHaveLength(1)
      expect(emitted()['roles-changed'][0]).toEqual([user, [userAdmin.id], []])
    })

    it('emits only rolesToRemove when roles are removed', async () => {
      const user = makeIdirUser([tenantOwner, serviceUser])
      const { emitted } = renderComponent({ user })

      await fireEvent.click(checkbox(ROLES.TENANT_OWNER.title))
      await fireEvent.click(saveButton())

      expect(emitted()['roles-changed'][0]).toEqual([
        user,
        [],
        [tenantOwner.id],
      ])
    })

    it('emits both lists when roles are added and removed', async () => {
      const user = makeIdirUser([serviceUser])
      const { emitted } = renderComponent({ user })

      await fireEvent.click(checkbox(ROLES.TENANT_OWNER.title))
      await fireEvent.click(checkbox(ROLES.SERVICE_USER.title))
      await fireEvent.click(saveButton())

      expect(emitted()['roles-changed'][0]).toEqual([
        user,
        [tenantOwner.id],
        [serviceUser.id],
      ])
    })

    it('does not include unchanged roles in either list', async () => {
      const { emitted } = renderComponent({
        user: makeIdirUser([tenantOwner, serviceUser]),
      })

      await fireEvent.click(checkbox(ROLES.USER_ADMIN.title))
      await fireEvent.click(saveButton())

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
      const { emitted } = renderComponent({ user: makeIdirUser([serviceUser]) })

      await fireEvent.click(checkbox(ROLES.USER_ADMIN.title))
      await fireEvent.click(saveButton())

      expect(emitted()['update:modelValue']).toHaveLength(1)
      expect(emitted()['update:modelValue'][0]).toEqual([false])
    })

    it('skips roles missing from the roles prop', async () => {
      const user = makeIdirUser([serviceUser])
      const { emitted } = renderComponent({
        roles: [tenantOwner, serviceUser], // no user admin role available
        user,
      })

      await fireEvent.click(checkbox(ROLES.USER_ADMIN.title))
      await fireEvent.click(saveButton())

      expect(emitted()['roles-changed'][0]).toEqual([user, [], []])
    })

    it('maps the BCeID Business service user checkbox to the service user role', async () => {
      vi.mocked(isIdpBceidBusiness).mockReturnValue(true)
      const user = makeUser({
        roles: [],
        ssoUser: makeSsoUser({ idpType: 'bceidbusiness' }),
      })

      const { emitted } = renderComponent({ user })

      await fireEvent.click(checkbox(ROLES.SERVICE_USER.title))
      await fireEvent.click(saveButton())

      expect(emitted()['roles-changed'][0]).toEqual([
        user,
        [serviceUser.id],
        [],
      ])
    })
  })

  describe('Cancel and close', () => {
    it('Cancel requests close without emitting roles-changed', async () => {
      const { emitted } = renderComponent({ user: makeIdirUser([serviceUser]) })

      await fireEvent.click(checkbox(ROLES.USER_ADMIN.title))
      await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(emitted()['update:modelValue']).toHaveLength(1)
      expect(emitted()['update:modelValue'][0]).toEqual([false])
      expect(emitted()['roles-changed']).toBeUndefined()
    })

    it('propagates the v-dialog update:modelValue to the v-model', async () => {
      const wrapper = mount(RoleDialog, {
        global: { plugins: [vuetify] },
        props: {
          modelValue: true,
          roles: allRoles,
          user: makeIdirUser([serviceUser]),
        },
      })

      await wrapper
        .findComponent({ name: 'VDialog' })
        .vm.$emit('update:modelValue', false)

      expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    })
  })
})
