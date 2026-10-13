import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'

import { makeGroup, makeTenant } from '@/__tests__/__factories__'

import GroupListCard from '@/components/group/GroupListCard.vue'
import { toGroupId } from '@/models/group.model'
import { toTenantId } from '@/models/tenant.model'

const vuetify = createVuetify()

const renderComponent = (props = {}) =>
  render(GroupListCard, {
    global: {
      plugins: [vuetify],
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a :href="to"><slot /></a>',
        },
      },
    },
    props: {
      group: makeGroup(),
      tenant: makeTenant(),
      ...props,
    },
  })

describe('GroupListCard.vue', () => {
  it('renders the group name', () => {
    const group = makeGroup({ name: 'groupName' })

    renderComponent({ group })

    expect(screen.getByText('groupName')).toBeInTheDocument()
  })

  it('links to the group members page', async () => {
    const group = makeGroup({ id: toGroupId('groupId') })
    const tenant = makeTenant({ id: toTenantId('tenantId') })

    renderComponent({ group, tenant })

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/tenants/tenantId/groups/groupId/members',
    )
  })
})
