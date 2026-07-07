import { fireEvent, render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import { makeGroup, makeGroupUser, makeTenant } from '@/__tests__/__factories__'

import GroupMemberManagement from '@/components/group/GroupMemberManagement.vue'
import { type Group } from '@/models/group.model'
import { type Tenant } from '@/models/tenant.model'
import { type User } from '@/models/user.model'
import { currentUserHasRole } from '@/utils/permissions'

vi.mock('@/utils/permissions', () => ({
  currentUserHasRole: vi.fn(),
}))

const vuetify = createVuetify({ components, directives })

const groupMemberTableStub = {
  emits: ['add-member', 'remove-member'],
  name: 'GroupMemberTable',
  props: ['groupMembers', 'tenant'],
  template: `
    <div>
      <button @click="$emit('add-member')">stub-add-member</button>
      <button @click="$emit('remove-member', groupMembers[0])">
        stub-remove-member
      </button>
    </div>
  `,
}

const userSearchStub = {
  emits: ['clear-search', 'search', 'select'],
  name: 'UserSearch',
  props: ['loading', 'searchResults', 'tenant'],
  template: `
    <div>
      <button @click="$emit('search', 'email', 'text')">stub-search</button>
      <button @click="$emit('clear-search')">stub-clear-search</button>
      <button @click="$emit('select', { id: 'user-1' })">stub-select</button>
    </div>
  `,
}

function renderComponent(props: {
  group: Group
  loadingSearch?: boolean
  searchResults?: User[] | null
  tenant: Tenant
}) {
  return render(GroupMemberManagement, {
    global: {
      plugins: [vuetify],
      stubs: {
        GroupMemberTable: groupMemberTableStub,
        UserSearch: userSearchStub,
      },
    },
    props: {
      loadingSearch: false,
      searchResults: null,
      ...props,
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GroupMemberManagement', () => {
  describe('Member table', () => {
    it('remove-member event is forwarded', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)
      const groupUser = makeGroupUser({ id: 'groupUserId' })
      const { emitted } = renderComponent({
        group: makeGroup({ groupUsers: [groupUser] }),
        tenant: makeTenant(),
      })

      await fireEvent.click(
        screen.getByRole('button', { name: 'stub-remove-member' }),
      )

      expect(emitted().delete).toHaveLength(1)
      expect(emitted().delete[0]).toEqual(['groupUserId'])
    })

    it('add-member event opens search', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      renderComponent({ group: makeGroup(), tenant: makeTenant() })

      expect(
        screen.queryByRole('button', { name: 'stub-search' }),
      ).not.toBeInTheDocument()

      await fireEvent.click(
        screen.getByRole('button', { name: 'stub-add-member' }),
      )

      expect(
        screen.getByRole('button', { name: 'stub-search' }),
      ).toBeInTheDocument()
    })
  })

  describe('Add member button', () => {
    it('is hidden for non-admins', () => {
      vi.mocked(currentUserHasRole).mockReturnValue(false)

      renderComponent({
        group: makeGroup({ groupUsers: [makeGroupUser()] }),
        tenant: makeTenant(),
      })

      expect(
        screen.queryByRole('button', { name: 'Add Member to Group' }),
      ).not.toBeInTheDocument()
    })

    it('is hidden for admins when the group has no members', () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      renderComponent({
        group: makeGroup({ groupUsers: [] }),
        tenant: makeTenant(),
      })

      expect(
        screen.queryByRole('button', { name: 'Add Member to Group' }),
      ).not.toBeInTheDocument()
    })

    it('is shown for admins when the group has members', () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      renderComponent({
        group: makeGroup({ groupUsers: [makeGroupUser()] }),
        tenant: makeTenant(),
      })

      expect(
        screen.getByRole('button', { name: 'Add Member to Group' }),
      ).toBeInTheDocument()
    })

    it('is hidden for admins once search is open', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      renderComponent({
        group: makeGroup({ groupUsers: [makeGroupUser()] }),
        tenant: makeTenant(),
      })

      await fireEvent.click(
        screen.getByRole('button', { name: 'Add Member to Group' }),
      )

      expect(
        screen.queryByRole('button', { name: 'Add Member to Group' }),
      ).not.toBeInTheDocument()
    })
  })

  describe('Add member flow', () => {
    it('disables Add Member until a user is selected', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      renderComponent({
        group: makeGroup({ groupUsers: [makeGroupUser()] }),
        tenant: makeTenant(),
      })

      await fireEvent.click(
        screen.getByRole('button', { name: 'Add Member to Group' }),
      )

      expect(screen.getByRole('button', { name: 'Add Member' })).toBeDisabled()

      await fireEvent.click(screen.getByRole('button', { name: 'stub-select' }))

      expect(
        screen.getByRole('button', { name: 'Add Member' }),
      ).not.toBeDisabled()
    })

    it('does not emit add or close the search flow when no user is selected', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      const { emitted } = renderComponent({
        group: makeGroup({ groupUsers: [makeGroupUser()] }),
        tenant: makeTenant(),
      })

      await fireEvent.click(
        screen.getByRole('button', { name: 'Add Member to Group' }),
      )
      await fireEvent.click(screen.getByRole('button', { name: 'Add Member' }))

      expect(emitted().add).toBeUndefined()
      expect(
        screen.getByRole('button', { name: 'stub-search' }),
      ).toBeInTheDocument()
    })

    it('emits add with the selected user and closes the search flow', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      const { emitted } = renderComponent({
        group: makeGroup({ groupUsers: [makeGroupUser()] }),
        tenant: makeTenant(),
      })

      await fireEvent.click(
        screen.getByRole('button', { name: 'Add Member to Group' }),
      )
      await fireEvent.click(screen.getByRole('button', { name: 'stub-select' }))
      await fireEvent.click(screen.getByRole('button', { name: 'Add Member' }))

      expect(emitted().add).toHaveLength(1)
      expect(emitted().add[0]).toEqual([{ id: 'user-1' }])

      expect(
        screen.queryByRole('button', { name: 'stub-search' }),
      ).not.toBeInTheDocument()
    })

    it('emits cancel and closes the search flow when cancelled', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      const { emitted } = renderComponent({
        group: makeGroup({ groupUsers: [makeGroupUser()] }),
        tenant: makeTenant(),
      })

      await fireEvent.click(
        screen.getByRole('button', { name: 'Add Member to Group' }),
      )
      await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(emitted().cancel).toHaveLength(1)
      expect(
        screen.queryByRole('button', { name: 'stub-search' }),
      ).not.toBeInTheDocument()
    })
  })

  describe('search forwarding', () => {
    it('forwards a search event', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      const { emitted } = renderComponent({
        group: makeGroup({ groupUsers: [makeGroupUser()] }),
        tenant: makeTenant(),
      })

      await fireEvent.click(
        screen.getByRole('button', { name: 'Add Member to Group' }),
      )
      await fireEvent.click(screen.getByRole('button', { name: 'stub-search' }))

      expect(emitted().search).toHaveLength(1)
      expect(emitted().search[0]).toEqual(['email', 'text'])
    })

    it('forwards a clear-search event', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      const { emitted } = renderComponent({
        group: makeGroup({ groupUsers: [makeGroupUser()] }),
        tenant: makeTenant(),
      })

      await fireEvent.click(
        screen.getByRole('button', { name: 'Add Member to Group' }),
      )
      await fireEvent.click(
        screen.getByRole('button', { name: 'stub-clear-search' }),
      )

      expect(emitted()['clear-search']).toHaveLength(1)
    })
  })
})
