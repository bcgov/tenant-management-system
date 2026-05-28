import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { makeGroup } from '@/__tests__/__factories__'

import GroupListCard from '@/components/group/GroupListCard.vue'
import { type Group } from '@/models/group.model'

const mountComponent = (props: { group: Group }) =>
  mount(GroupListCard, {
    props,
    global: {
      stubs: {
        'v-card': {
          template: '<div @click="$emit(\'click\')"><slot /></div>',
          emits: ['click'],
        },
        'v-card-title': { template: '<div><slot /></div>' },
      },
    },
  })

describe('GroupListCard.vue', () => {
  describe('group info', () => {
    it('renders the group name', () => {
      const group = makeGroup({ name: 'Administrators' })
      const wrapper = mountComponent({ group })

      expect(wrapper.text()).toContain('Administrators')
    })
  })

  describe('click', () => {
    it('emits click when the card is clicked', async () => {
      const wrapper = mountComponent({ group: makeGroup() })

      await wrapper.find('div').trigger('click')

      expect(wrapper.emitted('click')).toHaveLength(1)
    })
  })
})
