import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'

import { makeTenant } from '@/__tests__/__factories__'

import TenantListCard from '@/components/tenant/TenantListCard.vue'
import { toTenantId } from '@/models/tenant.model'

const vuetify = createVuetify()

const renderComponent = (tenant = makeTenant()) =>
  render(TenantListCard, {
    props: { tenant },
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

describe('TenantListCard.vue', () => {
  it('renders the tenant name', () => {
    renderComponent(makeTenant({ name: 'My Tenant' }))

    expect(screen.getByText('My Tenant')).toBeInTheDocument()
  })

  it('renders the ministry name', () => {
    renderComponent(makeTenant({ ministryName: 'Test Ministry' }))

    expect(screen.getByText('Test Ministry')).toBeInTheDocument()
  })

  it('links to the tenant users page', () => {
    renderComponent(makeTenant({ id: toTenantId('tenantId1') }))

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/tenants/tenantId1/services',
    )
  })
})
