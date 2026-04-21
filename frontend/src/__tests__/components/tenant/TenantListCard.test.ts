import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import {
  makeTenant,
  makeTenantOwnerRole,
  makeUser,
} from '@/__tests__/__factories__'
import TenantListCard from '@/components/tenant/TenantListCard.vue'
import type { Tenant } from '@/models/tenant.model'

const mountComponent = (props: { tenant: Tenant }) =>
  mount(TenantListCard, {
    props,
    global: {
      mocks: {
        $t: (key: string) => key,
      },
      stubs: {
        'v-card': {
          template: '<div @click="$emit(\'click\')"><slot /></div>',
          emits: ['click'],
        },
        'v-card-title': { template: '<div><slot /></div>' },
        'v-card-subtitle': { template: '<div><slot /></div>' },
        'v-card-text': { template: '<div><slot /></div>' },
      },
    },
  })

describe('TenantListCard.vue', () => {
  describe('tenant info', () => {
    it('renders the tenant name', () => {
      const tenant = makeTenant({
        name: 'My Tenant',
      })
      const wrapper = mountComponent({ tenant })

      expect(wrapper.text()).toContain('My Tenant')
    })

    it('renders the ministry name', () => {
      const tenant = makeTenant({
        ministry: 'Test Ministry',
        name: 'My Tenant',
      })
      const wrapper = mountComponent({ tenant })

      expect(wrapper.text()).toContain('Test Ministry')
    })
  })

  describe('owner info', () => {
    it('renders owner display name and email when tenant has an owner', () => {
      const owner = makeUser({
        roles: [makeTenantOwnerRole()],
        displayName: 'Tolstoy Twain',
        email: 'tolstoy.twain@example.com',
      })
      const tenant = makeTenant({ users: [owner] })
      const wrapper = mountComponent({ tenant })

      expect(wrapper.text()).toContain('Tolstoy Twain')
      expect(wrapper.text()).toContain('tolstoy.twain@example.com')
    })

    it('does not render owner info when tenant has no owner', () => {
      const tenant = makeTenant({ users: [] })
      const wrapper = mountComponent({ tenant })

      expect(wrapper.text()).not.toContain('roles.owner')
    })
  })

  describe('click', () => {
    it('emits click when the card is clicked', async () => {
      const tenant = makeTenant()
      const wrapper = mountComponent({ tenant })

      await wrapper.find('div').trigger('click')

      expect(wrapper.emitted('click')).toHaveLength(1)
    })
  })
})
