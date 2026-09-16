import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'

import { makeGroup, makeTenant } from '@/__tests__/__factories__'

import GroupListCard from '@/components/group/GroupListCard.vue'
import { toGroupId } from '@/models/group.model'
import { toTenantId } from '@/models/tenant.model'

const vuetify = createVuetify()

const renderComponent = (group = makeGroup(), tenant = makeTenant()) =>
  render(GroupListCard, {
    props: { group, tenant },
    global: {
      plugins: [vuetify],
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a :href="to"><slot /></a>',
        },
      },
    },
  })

describe('GroupListCard.vue', () => {
  describe('group info', () => {
    it('renders the group name', () => {
      renderComponent(makeGroup({ name: 'My Group' }), makeTenant())

      expect(screen.getByText('My Group')).toBeInTheDocument()
    })

    it('links to the group members page', async () => {
      renderComponent(
        makeGroup({ id: toGroupId('groupId') }),
        makeTenant({ id: toTenantId('tenantId') }),
      )

      expect(screen.getByRole('link')).toHaveAttribute(
        'href',
        '/tenants/tenantId/groups/groupId/members',
      )
    })
  })
})
