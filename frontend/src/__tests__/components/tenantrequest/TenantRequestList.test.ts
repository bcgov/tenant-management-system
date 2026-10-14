import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'

import { makeTenantRequest } from '@/__tests__/__factories__'

import TenantRequestList from '@/components/tenantrequest/TenantRequestList.vue'
import {
  type TenantRequest,
  toTenantRequestId,
} from '@/models/tenantrequest.model'

const vuetify = createVuetify()

const tenantRequests = [
  makeTenantRequest({ id: toTenantRequestId('1'), name: 'Z Is Last' }),
  makeTenantRequest({ id: toTenantRequestId('2'), name: 'A Is First' }),
  makeTenantRequest({ id: toTenantRequestId('3'), name: 'M Is Middle' }),
]

const renderComponent = (props: { tenantRequests: TenantRequest[] }) =>
  render(TenantRequestList, {
    props,
    global: {
      plugins: [vuetify],
      stubs: {
        TenantRequestListCard: {
          props: ['tenantRequest'],
          template:
            '<div data-testid="tenant-request-list-card">{{ tenantRequest.name }}</div>',
        },
      },
    },
  })

describe('TenantRequestList.vue', () => {
  it('renders no tenant request cards when tenant requests is empty', () => {
    renderComponent({ tenantRequests: [] })

    expect(screen.queryAllByTestId('tenant-request-list-card')).toHaveLength(0)
  })

  it('renders a card for each tenant request', () => {
    renderComponent({ tenantRequests })

    expect(screen.getAllByTestId('tenant-request-list-card')).toHaveLength(3)
  })

  it('renders tenant requests sorted alphabetically by name', () => {
    renderComponent({ tenantRequests })

    const cards = screen.getAllByTestId('tenant-request-list-card')

    expect(cards[0]).toHaveTextContent('A Is First')
    expect(cards[1]).toHaveTextContent('M Is Middle')
    expect(cards[2]).toHaveTextContent('Z Is Last')
  })
})
