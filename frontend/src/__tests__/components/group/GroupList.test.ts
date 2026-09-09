import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'

import { makeGroup } from '@/__tests__/__factories__'

import GroupList from '@/components/group/GroupList.vue'
import GroupListCard from '@/components/group/GroupListCard.vue'
import { type Group, toGroupId } from '@/models/group.model'

const vuetify = createVuetify()

const groups = [
  makeGroup({ id: toGroupId('1'), name: 'Z Is Last' }),
  makeGroup({ id: toGroupId('2'), name: 'A Is First' }),
  makeGroup({ id: toGroupId('3'), name: 'M Is Middle' }),
]

const mountComponent = (props: { groups: Group[] }) =>
  mount(GroupList, {
    props,
    global: {
      plugins: [vuetify],
      stubs: { GroupListCard: true },
    },
  })

describe('GroupList.vue', () => {
  it('renders no cards when groups is empty', () => {
    const wrapper = mountComponent({ groups: [] })

    expect(wrapper.findAllComponents(GroupListCard)).toHaveLength(0)
  })

  it('renders a card for each group', () => {
    const wrapper = mountComponent({ groups })

    expect(wrapper.findAllComponents(GroupListCard)).toHaveLength(3)
  })

  it('renders groups sorted alphabetically by name', () => {
    const wrapper = mountComponent({ groups })

    const cards = wrapper.findAllComponents(GroupListCard)
    expect(cards[0].props('group').name).toBe('A Is First')
    expect(cards[1].props('group').name).toBe('M Is Middle')
    expect(cards[2].props('group').name).toBe('Z Is Last')
  })

  it('emits select with the group id when a card is clicked', async () => {
    const wrapper = mountComponent({ groups })

    await wrapper.findAllComponents(GroupListCard)[0].trigger('click')

    expect(wrapper.emitted('select')?.[0]).toEqual(['2'])
  })
})
