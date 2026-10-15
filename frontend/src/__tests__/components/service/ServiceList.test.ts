import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'

import { makeService } from '@/__tests__/__factories__'

import ServiceList from '@/components/service/ServiceList.vue'
import { toServiceId } from '@/models/service.model'

const vuetify = createVuetify()

const renderComponent = (props = {}) =>
  render(ServiceList, {
    global: {
      plugins: [vuetify],
      stubs: {
        ServiceListCard: {
          props: ['isTenantOwner', 'service'],
          template: `
            <div data-testid="service-list-card">
              <span>{{ service.name }}</span>
              <button @click="$emit('click-add')">Add service</button>
            </div>
            `,
        },
      },
    },
    props: {
      isTenantOwner: false,
      services: [],
      ...props,
    },
  })

describe('ServiceList.vue', () => {
  it('renders no service cards when services is empty', () => {
    renderComponent()

    expect(screen.queryAllByTestId('service-list-card')).toHaveLength(0)
  })

  it('renders a card for each service', () => {
    const services = [makeService(), makeService(), makeService()]

    renderComponent({ services })

    expect(screen.getAllByTestId('service-list-card')).toHaveLength(3)
  })

  it('renders services sorted alphabetically by name', () => {
    const services = [
      makeService({ id: toServiceId('1'), name: 'Z Is Last' }),
      makeService({ id: toServiceId('2'), name: 'A Is First' }),
      makeService({ id: toServiceId('3'), name: 'M Is Middle' }),
    ]

    renderComponent({ services })

    const cards = screen.getAllByTestId('service-list-card')
    expect(cards[0]).toHaveTextContent('A Is First')
    expect(cards[1]).toHaveTextContent('M Is Middle')
    expect(cards[2]).toHaveTextContent('Z Is Last')
  })

  it('emits add-service when a service is added', async () => {
    const user = userEvent.setup()
    const service = makeService({ id: toServiceId('123') })

    const { emitted } = renderComponent({ services: [service] })
    await user.click(screen.getByRole('button', { name: 'Add service' }))

    expect(emitted('add-service')).toEqual([[service.id]])
  })
})
