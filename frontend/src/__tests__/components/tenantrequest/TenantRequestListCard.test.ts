import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'

import { makeTenantRequest } from '@/__tests__/__factories__'

import TenantRequestListCard from '@/components/tenantrequest/TenantRequestListCard.vue'

const vuetify = createVuetify()

const renderComponent = (props = {}) =>
  render(TenantRequestListCard, {
    global: {
      plugins: [vuetify],
    },
    props: {
      tenantRequest: makeTenantRequest(),
      ...props,
    },
  })

describe('TenantRequestListCard.vue', () => {
  it('renders the tenant request name', () => {
    const tenantRequest = makeTenantRequest({ name: 'tenantRequestName' })

    renderComponent({ tenantRequest })

    expect(screen.getByText('tenantRequestName')).toBeInTheDocument()
  })

  it('renders the created date', () => {
    const tenantRequest = makeTenantRequest({
      createdDate: 'tenantRequestCreatedDate',
    })

    renderComponent({ tenantRequest })

    expect(
      screen.getByText('Requested: tenantRequestCreatedDate'),
    ).toBeInTheDocument()
  })
})
