import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { makeGroup } from '@/__tests__/__factories__'
import GroupListCard from '@/components/group/GroupListCard.vue'
import type { Group } from '@/models/group.model'

const mountComponent = (props: { group: Group; isAdmin: boolean }) =>
  mount(GroupListCard, {
    props,
    global: {
      stubs: {
        'v-card': {
          template: '<div @click="$emit(\'click\')"><slot /></div>',
          emits: ['click'],
        },
        'v-card-title': { template: '<div><slot /></div>' },
        'v-card-text': { template: '<div><slot /></div>' },
      },
    },
  })

describe('GroupListCard.vue', () => {
  describe('group info', () => {
    it('renders the group name', () => {
      const group = makeGroup({ name: 'Administrators' })
      const wrapper = mountComponent({ group, isAdmin: false })

      expect(wrapper.text()).toContain('Administrators')
    })

    it('renders the created date', () => {
      const group = makeGroup({ createdDate: '2026-03-15' })
      const wrapper = mountComponent({ group, isAdmin: false })

      expect(wrapper.text()).toContain('2026-03-15')
    })

    it('renders the created by', () => {
      const group = makeGroup({ createdBy: 'jsmith' })
      const wrapper = mountComponent({ group, isAdmin: false })

      expect(wrapper.text()).toContain('jsmith')
    })
  })

  describe('admin state', () => {
    it('renders Edit Group when isAdmin is true', () => {
      const wrapper = mountComponent({ group: makeGroup(), isAdmin: true })

      expect(wrapper.text()).toContain('Edit Group')
      expect(wrapper.text()).not.toContain('View Group')
    })

    it('renders View Group when isAdmin is false', () => {
      const wrapper = mountComponent({ group: makeGroup(), isAdmin: false })

      expect(wrapper.text()).toContain('View Group')
      expect(wrapper.text()).not.toContain('Edit Group')
    })
  })

  describe('click', () => {
    it('emits click when the card is clicked', async () => {
      const wrapper = mountComponent({ group: makeGroup(), isAdmin: false })

      await wrapper.find('div').trigger('click')

      expect(wrapper.emitted('click')).toHaveLength(1)
    })
  })
})
