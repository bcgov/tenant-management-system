import { fireEvent, render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import {
  makeGroupUser,
  makeSsoUser,
  makeTenant,
  makeUser,
} from '@/__tests__/__factories__'

import GroupMemberTable from '@/components/group/GroupMemberTable.vue'
import { type GroupUser } from '@/models/groupuser.model'
import { type Tenant } from '@/models/tenant.model'
import { currentUserHasRole } from '@/utils/permissions'

vi.mock('@/utils/identityProvider', () => ({
  identityProviderToDisplay: vi.fn((idpType: string) => idpType),
}))

vi.mock('@/utils/permissions', () => ({
  currentUserHasRole: vi.fn(),
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
})

describe('GroupMemberTable', () => {
  describe('Actions column', () => {
    it('is displayed for admins', () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      const groupUser = makeGroupUser({
        user: makeUser({
          ssoUser: makeSsoUser({
            firstName: 'firstName',
            lastName: 'lastName',
          }),
        }),
      })
      renderComponent({ groupMembers: [groupUser], tenant: makeTenant() })

      expect(
        screen.getByRole('columnheader', { name: 'Actions' }),
      ).toBeInTheDocument()
      expect(
        screen.getByLabelText('Open Menu for firstName lastName'),
      ).toBeInTheDocument()
    })

    it('is not displayed for non-admins', () => {
      vi.mocked(currentUserHasRole).mockReturnValue(false)

      const groupUser = makeGroupUser({
        user: makeUser({
          ssoUser: makeSsoUser({
            firstName: 'firstName',
            lastName: 'lastName',
          }),
        }),
      })
      renderComponent({ groupMembers: [groupUser], tenant: makeTenant() })

      expect(
        screen.queryByRole('columnheader', { name: 'Actions' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByLabelText('Open Menu for firstName lastName'),
      ).not.toBeInTheDocument()
    })
  })

  describe('Empty state', () => {
    it('is displayed with button for admins', () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      renderComponent({ groupMembers: [], tenant: makeTenant() })

      expect(
        screen.getByRole('button', { name: 'Add group member' }),
      ).toBeInTheDocument()
      expect(screen.getByText('No group members added yet')).toBeInTheDocument()
      expect(
        screen.getByText('Add your first group member to get started.'),
      ).toBeInTheDocument()
    })

    it('is displayed without button for non-admins', () => {
      vi.mocked(currentUserHasRole).mockReturnValue(false)

      renderComponent({ groupMembers: [], tenant: makeTenant() })

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
      vi.mocked(currentUserHasRole).mockReturnValue(false)

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

      renderComponent({ groupMembers, tenant: makeTenant() })

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
  })

  describe('Add member event', () => {
    it('is emitted when the button is clicked', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)
      const { emitted } = renderComponent({
        groupMembers: [],
        tenant: makeTenant(),
      })

      await fireEvent.click(
        screen.getByRole('button', { name: 'Add group member' }),
      )

      expect(emitted()['add-member']).toHaveLength(1)
      expect(emitted()['add-member'][0]).toEqual([])
    })
  })

  describe('Remove member event', () => {
    it('is emitted after confirming', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      const groupUser = makeGroupUser({
        user: makeUser({
          ssoUser: makeSsoUser({
            firstName: 'firstName',
            lastName: 'lastName',
          }),
        }),
      })
      const { emitted } = renderComponent({
        tenant: makeTenant(),
        groupMembers: [groupUser],
      })

      await fireEvent.click(
        screen.getByLabelText('Open Menu for firstName lastName'),
      )
      await fireEvent.click(await screen.findByText('Remove Member'))
      await fireEvent.click(
        screen.getByRole('button', { name: 'Remove Member' }),
      )

      expect(emitted()['remove-member']).toHaveLength(1)
      expect(emitted()['remove-member'][0]).toEqual([groupUser])
    })

    it('is not emitted after cancelling', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      const groupUser = makeGroupUser({
        user: makeUser({
          ssoUser: makeSsoUser({
            firstName: 'firstName',
            lastName: 'lastName',
          }),
        }),
      })
      const { emitted } = renderComponent({
        groupMembers: [groupUser],
        tenant: makeTenant(),
      })

      await fireEvent.click(
        screen.getByLabelText('Open Menu for firstName lastName'),
      )
      await fireEvent.click(await screen.findByText('Remove Member'))
      await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(emitted()['remove-member']).toBeUndefined()
    })
  })
})
