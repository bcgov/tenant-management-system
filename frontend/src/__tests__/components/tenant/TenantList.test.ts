import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'

import { makeTenant } from '@/__tests__/__factories__'

import TenantList from '@/components/tenant/TenantList.vue'
import { type Tenant, toTenantId } from '@/models/tenant.model'

const vuetify = createVuetify()

const tenants = [
  makeTenant({ id: toTenantId('1'), name: 'Z Is Last' }),
  makeTenant({ id: toTenantId('2'), name: 'A Is First' }),
  makeTenant({ id: toTenantId('3'), name: 'M Is Middle' }),
]

const renderComponent = (props: { tenants: Tenant[] }) =>
  render(TenantList, {
    props,
    global: {
      plugins: [vuetify],
      stubs: {
        TenantListCard: {
          props: ['tenant'],
          template:
            '<div data-testid="tenant-list-card">{{ tenant.name }}</div>',
        },
      },
    },
  })

describe('TenantList.vue', () => {
  it('renders no tenant cards when tenants is empty', () => {
    renderComponent({ tenants: [] })

    expect(screen.queryAllByTestId('tenant-list-card')).toHaveLength(0)
  })

  it('renders a card for each tenant', () => {
    renderComponent({ tenants })

    expect(screen.getAllByTestId('tenant-list-card')).toHaveLength(3)
  })

  it('renders tenants sorted alphabetically by name', () => {
    renderComponent({ tenants })

    const cards = screen.getAllByTestId('tenant-list-card')

    expect(cards[0]).toHaveTextContent('A Is First')
    expect(cards[1]).toHaveTextContent('M Is Middle')
    expect(cards[2]).toHaveTextContent('Z Is Last')
  })
})
