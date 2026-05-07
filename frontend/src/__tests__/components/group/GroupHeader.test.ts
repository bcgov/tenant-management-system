import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'
import { useRoute } from 'vue-router'

import { makeGroup, makeGroupUser, makeTenant } from '@/__tests__/__factories__'

import GroupHeader from '@/components/group/GroupHeader.vue'
import vuetify from '@/plugins/vuetify'

const mockGroup = makeGroup({
  groupUsers: [makeGroupUser(), makeGroupUser(), makeGroupUser()],
})

const mockTenant = makeTenant()

vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
}))
const mockedUseRoute = vi.mocked(useRoute)

const defaultProps = {
  enabledRolesCount: 4,
  enabledServiceCount: 7,
  group: mockGroup,
  tenant: mockTenant,
}

function createRoute(path = '/current-path'): ReturnType<typeof useRoute> {
  return reactive({ path }) as ReturnType<typeof useRoute>
}

function mountComponent(props = defaultProps) {
  return mount(GroupHeader, {
    props,
    global: {
      plugins: [vuetify],
    },
  })
}

describe('GroupHeader', () => {
  beforeEach(() => {
    mockedUseRoute.mockReturnValue(createRoute())
  })

  describe('header', () => {
    it('renders the group name', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('test-group-name')
    })

    it('renders the tenant name', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('test-tenant-name')
    })

    it('shows the chevron down icon when collapsed', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).not.toContain('chevron-up')
    })
  })

  describe('toggle detail', () => {
    it('does not show detail by default', () => {
      const wrapper = mountComponent()

      expect(wrapper.find('pre.description').exists()).toBe(false)
    })

    it('shows detail when header is clicked', async () => {
      const wrapper = mountComponent()

      await wrapper.find('.v-sheet').trigger('click')

      expect(wrapper.find('pre.description').exists()).toBe(true)
    })

    it('hides detail when header is clicked again', async () => {
      const wrapper = mountComponent()

      await wrapper.find('.v-sheet').trigger('click')
      await wrapper.find('.v-sheet').trigger('click')

      expect(wrapper.find('pre.description').exists()).toBe(false)
    })
  })

  describe('detail panel', () => {
    it('renders group description', async () => {
      const wrapper = mountComponent()
      await wrapper.find('.v-sheet').trigger('click')

      expect(wrapper.find('pre.description').text()).toBe(mockGroup.description)
    })

    it('renders member count from groupUsers', async () => {
      const wrapper = mountComponent()
      await wrapper.find('.v-sheet').trigger('click')

      expect(wrapper.text()).toContain('3')
    })

    it('renders enabled roles count', async () => {
      const wrapper = mountComponent()
      await wrapper.find('.v-sheet').trigger('click')

      expect(wrapper.text()).toContain('4')
    })

    it('renders enabled service count', async () => {
      const wrapper = mountComponent()
      await wrapper.find('.v-sheet').trigger('click')

      expect(wrapper.text()).toContain('7')
    })
  })

  describe('route watcher', () => {
    it('collapses detail when route changes', async () => {
      const route = createRoute('/initial-path')
      mockedUseRoute.mockReturnValue(route)

      const wrapper = mountComponent()
      await wrapper.find('.v-sheet').trigger('click')
      expect(wrapper.find('pre.description').exists()).toBe(true)

      route.path = '/new-path'
      await nextTick()

      expect(wrapper.find('pre.description').exists()).toBe(false)
    })

    it('does not collapse detail when route does not change', async () => {
      const route = createRoute('/same-path')
      mockedUseRoute.mockReturnValue(route)

      const wrapper = mountComponent()
      await wrapper.find('.v-sheet').trigger('click')

      route.path = '/same-path'
      await nextTick()

      expect(wrapper.find('pre.description').exists()).toBe(true)
    })
  })
})
