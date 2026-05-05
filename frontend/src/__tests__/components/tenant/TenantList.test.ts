import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'

import { makeTenant } from '@/__tests__/__factories__'
import TenantList from '@/components/tenant/TenantList.vue'
import TenantListCard from '@/components/tenant/TenantListCard.vue'
import { type Tenant } from '@/models/tenant.model'

const vuetify = createVuetify()

const tenants = [
  makeTenant({ id: '1', name: 'Z Is Last' }),
  makeTenant({ id: '2', name: 'A Is First' }),
  makeTenant({ id: '3', name: 'M Is Middle' }),
]

const mountComponent = (props: { tenants: Tenant[] }) =>
  mount(TenantList, {
    props,
    global: {
      plugins: [vuetify],
      stubs: { TenantListCard: true },
    },
  })

describe('TenantList.vue', () => {
  it('renders no cards when tenants is empty', () => {
    const wrapper = mountComponent({ tenants: [] })

    expect(wrapper.findAllComponents(TenantListCard).length).toBe(0)
  })

  it('renders a card for each tenant', () => {
    const wrapper = mountComponent({ tenants })

    expect(wrapper.findAllComponents(TenantListCard).length).toBe(3)
  })

  it('renders tenants sorted alphabetically by name', () => {
    const wrapper = mountComponent({ tenants })

    const cards = wrapper.findAllComponents(TenantListCard)
    expect(cards[0].props('tenant').name).toBe('A Is First')
    expect(cards[1].props('tenant').name).toBe('M Is Middle')
    expect(cards[2].props('tenant').name).toBe('Z Is Last')
  })

  it('emits select with the tenant id when a card is clicked', async () => {
    const wrapper = mountComponent({ tenants })

    await wrapper.findAllComponents(TenantListCard)[0].trigger('click')

    expect(wrapper.emitted('select')?.[0]).toEqual(['2'])
  })
})
