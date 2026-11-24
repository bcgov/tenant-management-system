import { render, screen, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import {
  makeGroup,
  makeGroupService,
  makeGroupServiceRole,
  makeRole,
  makeSsoUser,
  makeTenant,
  makeUserIdir,
} from '@/__tests__/__factories__'

import TenantUserDetails from '@/components/tenant/TenantUserDetails.vue'
import { Tenant } from '@/models/tenant.model'
import { User } from '@/models/user.model'

const vuetify = createVuetify({ components, directives })

function renderComponent(props: { tenant?: Tenant; user: User }) {
  return render(TenantUserDetails, {
    global: {
      plugins: [vuetify],
    },
    props: {
      tenant: makeTenant(),
      ...props,
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TenantUserDetails', () => {
  describe('Heading', () => {
    it("shows the user's name in the page heading", () => {
      const user = makeUserIdir({
        ssoUser: makeSsoUser({ firstName: 'firstName', lastName: 'lastName' }),
      })

      renderComponent({ user })

      expect(
        screen.getByRole('heading', {
          name: 'User details: firstName lastName',
        }),
      ).toBeInTheDocument()
    })
  })

  describe('User details', () => {
    it('renders the display name, email and identity provider', () => {
      const user = makeUserIdir({
        ssoUser: makeSsoUser({
          displayName: 'userSsoUserDisplayName',
          email: 'userSsoUserEmail',
        }),
      })

      renderComponent({ user })

      expect(screen.getByText('userSsoUserDisplayName')).toBeInTheDocument()
      expect(screen.getByText('userSsoUserEmail')).toBeInTheDocument()
      expect(screen.getByText(user.getIdentityProvider())).toBeInTheDocument()
    })

    it('renders the tenant name', () => {
      const user = makeUserIdir()

      renderComponent({ tenant: makeTenant({ name: 'Tenant Name' }), user })

      expect(screen.getByText('Tenant Name')).toBeInTheDocument()
    })

    it('renders tenant roles sorted by description and comma-separated', () => {
      const user = makeUserIdir({
        roles: [
          makeRole({ description: 'User Role' }),
          makeRole({ description: 'Admin Role' }),
        ],
      })

      renderComponent({ user })

      expect(screen.getByText('Admin Role, User Role')).toBeInTheDocument()
    })
  })

  describe('Group memberships', () => {
    it('shows the empty state when the user has no groups', () => {
      const user = makeUserIdir({
        ssoUser: makeSsoUser({ firstName: 'firstName', lastName: 'lastName' }),
      })

      renderComponent({ user })

      expect(
        screen.getByRole('heading', { name: 'No group memberships' }),
      ).toBeInTheDocument()
      expect(
        screen.getByText(
          "firstName lastName isn't currently a member of any groups in this tenant.",
        ),
      ).toBeInTheDocument()
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })

    it('does not show the empty state when the user has groups', () => {
      const user = makeUserIdir({ groups: [makeGroup({ name: 'Group A' })] })
      const tenant = makeTenant({ users: [user] })
      renderComponent({
        tenant,
        user,
      })

      expect(
        screen.queryByRole('heading', { name: 'No group memberships' }),
      ).not.toBeInTheDocument()
    })

    it('shows a count chip with "0 groups" when there are none', () => {
      renderComponent({ user: makeUserIdir() })

      expect(screen.getByText('0 groups')).toBeInTheDocument()
    })

    it('shows a count chip with singular "group" for one group', () => {
      renderComponent({
        user: makeUserIdir({ groups: [makeGroup({ name: 'Group A' })] }),
      })

      expect(screen.getByText('1 group')).toBeInTheDocument()
    })

    it('shows a count chip with plural "groups" for several groups', () => {
      renderComponent({
        user: makeUserIdir({
          groups: [
            makeGroup({ name: 'Group A' }),
            makeGroup({ name: 'Group B' }),
          ],
        }),
      })

      expect(screen.getByText('2 groups')).toBeInTheDocument()
    })

    it('renders a section per group, sorted by name', () => {
      renderComponent({
        user: makeUserIdir({
          groups: [
            makeGroup({ name: 'Zulu Group' }),
            makeGroup({ name: 'Alpha Group' }),
            makeGroup({ name: 'Mike Group' }),
          ],
        }),
      })

      const groupHeadings = screen
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent)

      expect(groupHeadings).toEqual(['Alpha Group', 'Mike Group', 'Zulu Group'])
    })

    it('does not reorder the groups prop', () => {
      const groups = [
        makeGroup({ name: 'Zulu Group' }),
        makeGroup({ name: 'Alpha Group' }),
      ]

      renderComponent({ user: makeUserIdir({ groups }) })

      expect(groups.map((group) => group.name)).toEqual([
        'Zulu Group',
        'Alpha Group',
      ])
    })

    it('renders a services table for each group', () => {
      renderComponent({
        user: makeUserIdir({
          groups: [
            makeGroup({ name: 'Group A' }),
            makeGroup({ name: 'Group B' }),
          ],
        }),
      })

      expect(screen.getAllByRole('table')).toHaveLength(2)
      expect(
        screen.getAllByRole('columnheader', { name: 'Connected Service' }),
      ).toHaveLength(2)
      expect(
        screen.getAllByRole('columnheader', { name: 'Associated Roles' }),
      ).toHaveLength(2)
    })

    it('sorts services by display name and roles by description', () => {
      renderComponent({
        user: makeUserIdir({
          groups: [
            makeGroup({
              groupServices: [
                makeGroupService({
                  displayName: 'Service B',
                  roles: [
                    makeGroupServiceRole({ description: 'Description B' }),
                    makeGroupServiceRole({ description: 'Description A' }),
                  ],
                }),
                makeGroupService({ displayName: 'Service A' }),
              ],
              name: 'Group A',
            }),
          ],
        }),
      })

      const [, firstRow, secondRow] = within(
        screen.getByRole('table'),
      ).getAllByRole('row')
      const firstCells = within(firstRow).getAllByRole('cell')
      expect(firstCells[0]).toHaveTextContent('Service A')
      const secondCells = within(secondRow).getAllByRole('cell')
      expect(secondCells[0]).toHaveTextContent('Service B')
      expect(secondCells[1]).toHaveTextContent('Description ADescription B')
    })
  })
})
