import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'

import { makeService } from '@/__tests__/__factories__'

import ServiceListCard from '@/components/service/ServiceListCard.vue'
import { userEvent } from '@testing-library/user-event/dist/cjs/setup/index.js'

const vuetify = createVuetify()

export const stubButtonPrimary = {
  props: ['text'],
  emits: ['click'],
  template: `
    <button type="button" @click="$emit('click')">
      {{ text }}
    </button>
  `,
}

const renderComponent = (props = {}) =>
  render(ServiceListCard, {
    global: {
      plugins: [vuetify],
      stubs: {
        ButtonPrimary: stubButtonPrimary,
      },
    },
    props: {
      isTenantOwner: false,
      service: makeService(),
      ...props,
    },
  })

describe('ServiceListCard.vue', () => {
  it('renders the service display name', () => {
    const service = makeService({ displayName: 'serviceDisplayName' })

    renderComponent({ service })

    expect(screen.getByText('serviceDisplayName')).toBeInTheDocument()
  })

  it('renders the service description', () => {
    const service = makeService({ description: 'serviceDescription' })

    renderComponent({ service })

    expect(screen.getByText('serviceDescription')).toBeInTheDocument()
  })

  describe('add service button', () => {
    it('renders the button for a tenant owner', () => {
      renderComponent({ isTenantOwner: true })

      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument()
    })

    it('does not render the button for a non-tenant owner', () => {
      renderComponent({ isTenantOwner: false })

      expect(
        screen.queryByRole('button', { name: /add/i }),
      ).not.toBeInTheDocument()
    })

    it('emits click-add when clicked', async () => {
      const user = userEvent.setup()

      const { emitted } = renderComponent({ isTenantOwner: true })

      await user.click(screen.getByRole('button', { name: /add/i }))

      expect(emitted('click-add')).toEqual([[]])
    })
  })
})
