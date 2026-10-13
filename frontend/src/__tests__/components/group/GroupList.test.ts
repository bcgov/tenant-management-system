import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'

import { makeGroup, makeTenant } from '@/__tests__/__factories__'

import GroupList from '@/components/group/GroupList.vue'
import { type Group, toGroupId } from '@/models/group.model'
import type { Tenant } from '@/models/tenant.model'

const vuetify = createVuetify()

const groups = [
  makeGroup({ id: toGroupId('1'), name: 'Z Is Last' }),
  makeGroup({ id: toGroupId('2'), name: 'A Is First' }),
  makeGroup({ id: toGroupId('3'), name: 'M Is Middle' }),
]

const renderComponent = (props: { groups: Group[]; tenant: Tenant }) =>
  render(GroupList, {
    global: {
      plugins: [vuetify],
      stubs: {
        GroupListCard: {
          props: ['group', 'tenant'],
          template: '<div data-testid="group-list-card">{{ group.name }}</div>',
        },
      },
    },
    props,
  })

describe('GroupList.vue', () => {
  it('renders no cards when groups is empty', () => {
    renderComponent({ groups: [], tenant: makeTenant() })

    expect(screen.queryAllByTestId('group-list-card')).toHaveLength(0)
  })

  it('renders a card for each group', () => {
    renderComponent({ groups, tenant: makeTenant() })

    expect(screen.getAllByTestId('group-list-card')).toHaveLength(3)
  })

  it('renders groups sorted alphabetically by name', () => {
    renderComponent({ groups, tenant: makeTenant() })

    const cards = screen.getAllByTestId('group-list-card')
    expect(cards[0]).toHaveTextContent('A Is First')
    expect(cards[1]).toHaveTextContent('M Is Middle')
    expect(cards[2]).toHaveTextContent('Z Is Last')
  })
})
