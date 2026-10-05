import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'

import { makeService } from '@/__tests__/__factories__'

import TenantServiceList from '@/components/service/TenantServiceList.vue'
import { toServiceId } from '@/models/service.model'

const vuetify = createVuetify()

const renderComponent = (props = {}) =>
  render(TenantServiceList, {
    global: {
      plugins: [vuetify],
      stubs: {
        TenantServiceListCard: {
          props: ['service'],
          template: `
            <div data-testid="tenant-service-list-card">
              <span>{{ service.name }}</span>
            </div>
          `,
        },
      },
    },
    props: {
      tenantServices: [],
      ...props,
    },
  })

describe('TenantServiceList.vue', () => {
  it('renders no service cards when services is empty', () => {
    renderComponent()

    expect(screen.queryAllByTestId('tenant-service-list-card')).toHaveLength(0)
  })

  it('renders a card for each service', () => {
    const tenantServices = [makeService(), makeService(), makeService()]

    renderComponent({ tenantServices })

    expect(screen.getAllByTestId('tenant-service-list-card')).toHaveLength(3)
  })

  it('renders services sorted alphabetically by name', () => {
    const tenantServices = [
      makeService({ id: toServiceId('1'), name: 'Z Is Last' }),
      makeService({ id: toServiceId('2'), name: 'A Is First' }),
      makeService({ id: toServiceId('3'), name: 'M Is Middle' }),
    ]

    renderComponent({ tenantServices })

    const cards = screen.getAllByTestId('tenant-service-list-card')
    expect(cards[0]).toHaveTextContent('A Is First')
    expect(cards[1]).toHaveTextContent('M Is Middle')
    expect(cards[2]).toHaveTextContent('Z Is Last')
  })
})
