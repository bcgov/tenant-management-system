import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import { createRouter, createWebHistory, useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AppNavigation from '@/components/layout/AppNavigation.vue'
import {
  currentUserIsIdir,
  currentUserIsOperationsAdmin,
} from '@/utils/permissions'
import vuetify from '@/plugins/vuetify'
import { VLayout } from 'vuetify/lib/components/VLayout/VLayout.mjs'

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()
  return {
    ...actual,
    useRoute: vi.fn(),
  }
})
const mockedUseRoute = vi.mocked(useRoute)

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
})

vi.mock('vuetify', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vuetify')>()
  return {
    ...actual,
    useDisplay: vi.fn(),
  }
})
const mockedUseDisplay = vi.mocked(useDisplay)

vi.mock('@/utils/permissions', () => ({
  currentUserIsIdir: vi.fn(),
  currentUserIsOperationsAdmin: vi.fn(),
}))
const mockedCurrentUserIsIdir = vi.mocked(currentUserIsIdir)
const mockedCurrentUserIsOperationsAdmin = vi.mocked(
  currentUserIsOperationsAdmin,
)

function createRoute(
  overrides: Partial<ReturnType<typeof useRoute>> = {},
): ReturnType<typeof useRoute> {
  return {
    path: '/tenants',
    params: {},
    ...overrides,
  } as ReturnType<typeof useRoute>
}

function createDisplay(mobile = false): ReturnType<typeof useDisplay> {
  return { mobile: ref(mobile) } as unknown as ReturnType<typeof useDisplay>
}

function mountComponent() {
  return mount(VLayout, {
    global: {
      plugins: [router, vuetify],
    },
    slots: {
      default: AppNavigation,
    },
  })
}

describe('AppNavigation', () => {
  beforeEach(() => {
    mockedUseRoute.mockReturnValue(createRoute())
    mockedUseDisplay.mockReturnValue(createDisplay())
    mockedCurrentUserIsIdir.mockReturnValue(false)
    mockedCurrentUserIsOperationsAdmin.mockReturnValue(false)
  })

  describe('drawer visibility', () => {
    it('does not render the drawer for non-IDIR users', () => {
      mockedCurrentUserIsIdir.mockReturnValue(false)
      const wrapper = mountComponent()

      expect(wrapper.find('.v-navigation-drawer').exists()).toBe(false)
    })

    it('renders the drawer for IDIR users', () => {
      mockedCurrentUserIsIdir.mockReturnValue(true)
      const wrapper = mountComponent()

      expect(wrapper.find('.v-navigation-drawer').exists()).toBe(true)
    })
  })

  describe('always visible nav items', () => {
    beforeEach(() => {
      mockedCurrentUserIsIdir.mockReturnValue(true)
    })

    it('renders the All Tenants nav item', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('All Tenants')
    })
  })

  describe('administrator nav items', () => {
    beforeEach(() => {
      mockedCurrentUserIsIdir.mockReturnValue(true)
    })

    it('does not render Settings for non-administrators', () => {
      mockedCurrentUserIsOperationsAdmin.mockReturnValue(false)
      const wrapper = mountComponent()

      expect(wrapper.text()).not.toContain('Settings')
    })

    it('renders Settings for administrators', () => {
      mockedCurrentUserIsOperationsAdmin.mockReturnValue(true)
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('Settings')
    })
  })

  describe('settings route', () => {
    beforeEach(() => {
      mockedCurrentUserIsIdir.mockReturnValue(true)
      mockedUseRoute.mockReturnValue(
        createRoute({ path: '/settings/requests' }),
      )
    })

    it('renders Tenant Requests nav item', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('Tenant Requests')
    })

    it('renders Services nav item', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('Services')
    })

    it('does not render settings sub-items on non-settings routes', () => {
      mockedUseRoute.mockReturnValue(createRoute({ path: '/tenants' }))
      const wrapper = mountComponent()

      expect(wrapper.text()).not.toContain('Tenant Requests')
      expect(wrapper.text()).not.toContain('Services')
    })
  })

  describe('tenant route', () => {
    beforeEach(() => {
      mockedCurrentUserIsIdir.mockReturnValue(true)
      mockedUseRoute.mockReturnValue(
        createRoute({
          params: { tenantId: 'tenant-123' },
        }),
      )
    })

    it('renders tenant nav items when on a tenant route', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('Tenant Users')
      expect(wrapper.text()).toContain('Groups')
      expect(wrapper.text()).toContain('Connected Services')
    })

    it('links to the correct tenant routes', () => {
      const wrapper = mountComponent()

      expect(wrapper.html()).toContain('/tenants/tenant-123/users')
      expect(wrapper.html()).toContain('/tenants/tenant-123/groups')
      expect(wrapper.html()).toContain('/tenants/tenant-123/services')
    })

    it('does not render tenant nav items when not on a tenant route', () => {
      mockedUseRoute.mockReturnValue(createRoute({ params: {} }))
      const wrapper = mountComponent()

      expect(wrapper.text()).not.toContain('Tenant Users')
      expect(wrapper.text()).not.toContain('Groups')
    })
  })

  describe('group route', () => {
    beforeEach(() => {
      mockedCurrentUserIsIdir.mockReturnValue(true)
      mockedUseRoute.mockReturnValue(
        createRoute({
          params: { tenantId: 'tenant-123', groupId: 'group-456' },
        }),
      )
    })

    it('renders group nav items when on a group route', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('Members')
      expect(wrapper.text()).toContain('Service Roles')
    })

    it('links to the correct group routes', () => {
      const wrapper = mountComponent()

      expect(wrapper.html()).toContain(
        '/tenants/tenant-123/groups/group-456/members',
      )
      expect(wrapper.html()).toContain(
        '/tenants/tenant-123/groups/group-456/roles',
      )
    })

    it('does not render group nav items without a group route', () => {
      mockedUseRoute.mockReturnValue(
        createRoute({
          params: { tenantId: 'tenant-123' },
        }),
      )
      const wrapper = mountComponent()

      expect(wrapper.text()).not.toContain('Members')
      expect(wrapper.text()).not.toContain('Service Roles')
    })
  })

  describe('rail mode', () => {
    beforeEach(() => {
      mockedCurrentUserIsIdir.mockReturnValue(true)
    })

    it('is in rail mode on mobile', () => {
      mockedUseDisplay.mockReturnValue(createDisplay(true))
      const wrapper = mountComponent()
      console.log(wrapper.html())

      expect(wrapper.find('.v-navigation-drawer').classes()).toContain(
        'v-navigation-drawer--rail',
      )
    })

    it('is not in rail mode on desktop', () => {
      mockedUseDisplay.mockReturnValue(createDisplay(false))
      const wrapper = mountComponent()

      expect(wrapper.find('.v-navigation-drawer').classes()).not.toContain(
        'v-navigation-drawer--rail',
      )
    })

    it('resets manual rail state when display changes', async () => {
      const mobile = ref(false)
      mockedUseDisplay.mockReturnValue({ mobile } as unknown as ReturnType<
        typeof useDisplay
      >)
      const wrapper = mountComponent()

      // Manually set rail
      await wrapper
        .find('.v-navigation-drawer__append .v-list-item')
        .trigger('click')

      // Simulate display change
      mobile.value = true
      await nextTick()

      expect(wrapper.find('.v-navigation-drawer').classes()).toContain(
        'v-navigation-drawer--rail',
      )
    })
  })
})
