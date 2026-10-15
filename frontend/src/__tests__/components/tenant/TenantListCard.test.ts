import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'

import { makeTenant } from '@/__tests__/__factories__'

import TenantListCard from '@/components/tenant/TenantListCard.vue'
import { toTenantId } from '@/models/tenant.model'

const vuetify = createVuetify()

const renderComponent = (props = {}) =>
  render(TenantListCard, {
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
      tenant: makeTenant(),
      ...props,
    },
  })

describe('TenantListCard.vue', () => {
  it('renders the tenant name', () => {
    const tenant = makeTenant({ name: 'tenantName' })

    renderComponent({ tenant })

    expect(screen.getByText('tenantName')).toBeInTheDocument()
  })

  it('renders the ministry name', () => {
    const tenant = makeTenant({ ministryName: 'tenantMinistryName' })

    renderComponent({ tenant })

    expect(screen.getByText('tenantMinistryName')).toBeInTheDocument()
  })

  it('links to the tenant services page', () => {
    const tenant = makeTenant({ id: toTenantId('tenantId') })

    renderComponent({ tenant })

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/tenants/tenantId/services',
    )
  })
})
