import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import {
  makeGroupUser,
  makeRoleServiceUser,
  makeRoleTenantOwner,
  makeRoleUserAdmin,
  makeSsoUser,
  makeTenant,
  makeUser,
} from '@/__tests__/__factories__'
import { createMockAuthStore } from '@/__tests__/__helpers__/useAuthStore.mock'

import GroupMemberTable from '@/components/group/GroupMemberTable.vue'
import { type GroupUser } from '@/models/groupuser.model'
import { type Tenant } from '@/models/tenant.model'

let currentAuthStore = createMockAuthStore()
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => currentAuthStore,
}))

const vuetify = createVuetify({ components, directives })

function renderComponent(props: { groupMembers: GroupUser[]; tenant: Tenant }) {
  return render(GroupMemberTable, {
    global: {
      plugins: [vuetify],
    },
    props,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  currentAuthStore = createMockAuthStore()
})

describe('GroupMemberTable', () => {
  describe('Actions column', () => {
    it('is displayed for tenant owner', () => {
      const currentUser = makeUser({ roles: [makeRoleTenantOwner()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      const tenant = makeTenant({ users: [currentUser] })
      const groupUser = makeGroupUser({
        user: makeUser({
          ssoUser: makeSsoUser({
            firstName: 'firstName',
            lastName: 'lastName',
          }),
        }),
      })

      renderComponent({ groupMembers: [groupUser], tenant })

      expect(
        screen.getByRole('columnheader', { name: 'Actions' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', {
          name: 'Open menu for firstName lastName',
        }),
      ).toBeInTheDocument()
    })

    it('is displayed for user admin', () => {
      const currentUser = makeUser({ roles: [makeRoleUserAdmin()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      const tenant = makeTenant({ users: [currentUser] })
      const groupUser = makeGroupUser({
        user: makeUser({
          ssoUser: makeSsoUser({
            firstName: 'firstName',
            lastName: 'lastName',
          }),
        }),
      })

      renderComponent({ groupMembers: [groupUser], tenant })

      expect(
        screen.getByRole('columnheader', { name: 'Actions' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', {
          name: 'Open menu for firstName lastName',
        }),
      ).toBeInTheDocument()
    })

    it('is not displayed for service user', () => {
      const currentUser = makeUser({ roles: [makeRoleServiceUser()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      const tenant = makeTenant({ users: [currentUser] })
      const groupUser = makeGroupUser({
        user: makeUser({
          ssoUser: makeSsoUser({
            firstName: 'firstName',
            lastName: 'lastName',
          }),
        }),
      })

      renderComponent({ groupMembers: [groupUser], tenant })

      expect(
        screen.queryByRole('columnheader', { name: 'Actions' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', {
          name: 'Open menu for firstName lastName',
        }),
      ).not.toBeInTheDocument()
    })
  })

  describe('Empty state', () => {
    it('is displayed with button for tenant owner', () => {
      const currentUser = makeUser({ roles: [makeRoleTenantOwner()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      const tenant = makeTenant({ users: [currentUser] })

      renderComponent({ groupMembers: [], tenant })

      expect(
        screen.getByRole('button', { name: 'Add group member' }),
      ).toBeInTheDocument()
      expect(screen.getByText('No group members added yet')).toBeInTheDocument()
      expect(
        screen.getByText('Add your first group member to get started.'),
      ).toBeInTheDocument()
    })

    it('is displayed with button for user admin', () => {
      const currentUser = makeUser({ roles: [makeRoleUserAdmin()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      const tenant = makeTenant({ users: [currentUser] })

      renderComponent({ groupMembers: [], tenant })

      expect(
        screen.getByRole('button', { name: 'Add group member' }),
      ).toBeInTheDocument()
      expect(screen.getByText('No group members added yet')).toBeInTheDocument()
      expect(
        screen.getByText('Add your first group member to get started.'),
      ).toBeInTheDocument()
    })

    it('is displayed without button for service user', () => {
      const currentUser = makeUser({ roles: [makeRoleServiceUser()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      const tenant = makeTenant({ users: [currentUser] })

      renderComponent({ groupMembers: [], tenant })

      expect(
        screen.queryByRole('button', { name: 'Add group member' }),
      ).not.toBeInTheDocument()
      expect(screen.getByText('No group members added yet')).toBeInTheDocument()
      expect(
        screen.getByText('Add your first group member to get started.'),
      ).toBeInTheDocument()
    })
  })

  describe('Table data', () => {
    it("renders a row with each user's details", () => {
      const currentUser = makeUser({ roles: [makeRoleServiceUser()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      const tenant = makeTenant({ users: [currentUser] })
      const groupMembers = [
        makeGroupUser({
          user: makeUser({
            ssoUser: makeSsoUser({
              firstName: 'firstName1',
              lastName: 'lastName1',
              email: 'email1',
            }),
          }),
        }),
        makeGroupUser({
          user: makeUser({
            ssoUser: makeSsoUser({
              firstName: 'firstName2',
              lastName: 'lastName2',
              email: 'email2',
            }),
          }),
        }),
      ]

      renderComponent({ groupMembers, tenant })

      expect(screen.getByText('firstName1')).toBeInTheDocument()
      expect(screen.getByText('lastName1')).toBeInTheDocument()
      expect(screen.getByText('email1')).toBeInTheDocument()
      expect(screen.getByText('firstName2')).toBeInTheDocument()
      expect(screen.getByText('lastName2')).toBeInTheDocument()
      expect(screen.getByText('email2')).toBeInTheDocument()
      expect(
        screen.queryByText('No group members added yet'),
      ).not.toBeInTheDocument()
    })

    it('filters rows based on the search input', async () => {
      const user = userEvent.setup()
      const currentUser = makeUser({ roles: [makeRoleServiceUser()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      const tenant = makeTenant({ users: [currentUser] })
      const groupUsers = [
        makeGroupUser({
          user: makeUser({
            ssoUser: makeSsoUser({
              email: 'alice@example.com',
              firstName: 'Alice',
              lastName: 'Anderson',
            }),
          }),
        }),
        makeGroupUser({
          user: makeUser({
            ssoUser: makeSsoUser({
              email: 'bob@example.com',
              firstName: 'Bob',
              lastName: 'Barker',
            }),
          }),
        }),
      ]

      renderComponent({ groupMembers: groupUsers, tenant })

      expect(screen.getByText('Anderson')).toBeInTheDocument()
      expect(screen.getByText('Barker')).toBeInTheDocument()

      await user.type(screen.getByLabelText('Search'), 'Alice')

      expect(screen.getByText('Anderson')).toBeInTheDocument()
      expect(screen.queryByText('Barker')).not.toBeInTheDocument()
    })

    it('shows a no-data message when the search filter matches no users', async () => {
      const user = userEvent.setup()
      const currentUser = makeUser({ roles: [makeRoleServiceUser()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      const tenant = makeTenant({ users: [currentUser] })
      const groupMember = makeGroupUser({
        user: makeUser({
          ssoUser: makeSsoUser({
            email: 'firstName.lastName@gov.bc.ca',
            firstName: 'firstName',
            lastName: 'lastName',
          }),
        }),
      })

      renderComponent({ groupMembers: [groupMember], tenant })

      expect(screen.getByText('firstName')).toBeInTheDocument()

      await user.type(screen.getByLabelText('Search'), 'no-such-user')

      expect(
        screen.getByText('No members match your search criteria'),
      ).toBeInTheDocument()
      expect(screen.queryByText('firstName')).not.toBeInTheDocument()
    })

    it('clears the search when clear button is clicked', async () => {
      const user = userEvent.setup()
      const currentUser = makeUser({ roles: [makeRoleServiceUser()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      const tenant = makeTenant({ users: [currentUser] })
      const groupMember = makeGroupUser({
        user: makeUser({
          ssoUser: makeSsoUser({
            email: 'firstName.lastName@gov.bc.ca',
            firstName: 'firstName',
            lastName: 'lastName',
          }),
        }),
      })

      renderComponent({ groupMembers: [groupMember], tenant })
      const searchInput = screen.getByLabelText('Search')
      await user.type(searchInput, 'no-such-user')

      expect(
        screen.getByText('No members match your search criteria'),
      ).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Clear search' }))

      expect(
        screen.queryByText('No members match your search criteria'),
      ).not.toBeInTheDocument()
      expect(searchInput).toHaveValue('')
      expect(searchInput).toHaveFocus()
    })
  })

  describe('Add member event', () => {
    it('is emitted when the button is clicked by tenant owner', async () => {
      const user = userEvent.setup()
      const currentUser = makeUser({ roles: [makeRoleTenantOwner()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      const tenant = makeTenant({ users: [currentUser] })

      const { emitted } = renderComponent({ groupMembers: [], tenant })
      await user.click(screen.getByRole('button', { name: 'Add group member' }))

      expect(emitted()['add-member']).toHaveLength(1)
      expect(emitted()['add-member'][0]).toEqual([])
    })

    it('is emitted when the button is clicked by user admin', async () => {
      const user = userEvent.setup()
      const currentUser = makeUser({ roles: [makeRoleUserAdmin()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      const tenant = makeTenant({ users: [currentUser] })

      const { emitted } = renderComponent({ groupMembers: [], tenant })
      await user.click(screen.getByRole('button', { name: 'Add group member' }))

      expect(emitted()['add-member']).toHaveLength(1)
      expect(emitted()['add-member'][0]).toEqual([])
    })

    it('is not possible since no button for service user', async () => {
      const currentUser = makeUser({ roles: [makeRoleServiceUser()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      const tenant = makeTenant({ users: [currentUser] })

      renderComponent({ groupMembers: [], tenant })

      expect(
        screen.queryByRole('button', { name: 'Add group member' }),
      ).not.toBeInTheDocument()
    })
  })

  describe('Remove member event', () => {
    it('is emitted after confirming', async () => {
      const user = userEvent.setup()
      const currentUser = makeUser({ roles: [makeRoleTenantOwner()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      const tenant = makeTenant({ users: [currentUser] })
      const groupUser = makeGroupUser({
        user: makeUser({
          ssoUser: makeSsoUser({
            firstName: 'firstName',
            lastName: 'lastName',
          }),
        }),
      })

      const { emitted } = renderComponent({ groupMembers: [groupUser], tenant })
      await user.click(
        screen.getByLabelText('Open menu for firstName lastName'),
      )
      await user.click(await screen.findByText('Remove member'))
      await user.click(screen.getByRole('button', { name: 'Remove member' }))

      expect(emitted()['remove-member']).toHaveLength(1)
      expect(emitted()['remove-member'][0]).toEqual([groupUser])
    })

    it('is not emitted after cancelling', async () => {
      const user = userEvent.setup()
      const currentUser = makeUser({ roles: [makeRoleTenantOwner()] })
      currentAuthStore = createMockAuthStore({ user: currentUser })
      const tenant = makeTenant({ users: [currentUser] })
      const groupUser = makeGroupUser({
        user: makeUser({
          ssoUser: makeSsoUser({
            firstName: 'firstName',
            lastName: 'lastName',
          }),
        }),
      })

      const { emitted } = renderComponent({ groupMembers: [groupUser], tenant })
      await user.click(
        screen.getByLabelText('Open menu for firstName lastName'),
      )
      await user.click(await screen.findByText('Remove member'))
      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(emitted()['remove-member']).toBeUndefined()
    })
  })
})
