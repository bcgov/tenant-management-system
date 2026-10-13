import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'

import { makeService } from '@/__tests__/__factories__'

import TenantServiceListCard from '@/components/service/TenantServiceListCard.vue'

const vuetify = createVuetify()

const renderComponent = (props = {}) =>
  render(TenantServiceListCard, {
    global: {
      plugins: [vuetify],
    },
    props: {
      service: makeService(),
      ...props,
    },
  })

describe('TenantServiceListCard.vue', () => {
  it('renders the tenant service display name', () => {
    const service = makeService({ displayName: 'serviceDisplayName' })

    renderComponent({ service })

    expect(screen.getByText('serviceDisplayName')).toBeInTheDocument()
  })

  it('renders the tenant service description', () => {
    const service = makeService({ description: 'serviceDescription' })

    renderComponent({ service })

    expect(screen.getByText('serviceDescription')).toBeInTheDocument()
  })
})
