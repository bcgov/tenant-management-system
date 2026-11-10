import { fireEvent, render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick, ref } from 'vue'
import { createRouter, createWebHistory, useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { VLayout } from 'vuetify/components'

import AppNavigation from '@/components/layout/AppNavigation.vue'
import vuetify from '@/plugins/vuetify'

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
  routes: [{ component: { template: '<div />' }, path: '/:pathMatch(.*)*' }],
})

vi.mock('vuetify', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vuetify')>()

  return { ...actual, useDisplay: vi.fn() }
})
const mockedUseDisplay = vi.mocked(useDisplay)

const createRoute = (
  overrides: Partial<ReturnType<typeof useRoute>> = {},
): ReturnType<typeof useRoute> => {
  return {
    path: '/tenants',
    params: {},
    ...overrides,
  } as ReturnType<typeof useRoute>
}

const createDisplay = (mobile = false): ReturnType<typeof useDisplay> => {
  return { mobile: ref(mobile) } as unknown as ReturnType<typeof useDisplay>
}

const renderComponent = (props: {
  showDrawer?: boolean
  showSettings?: boolean
}) => {
  const componentProps = { showDrawer: false, showSettings: false, ...props }

  return render(
    { render: () => h(VLayout, () => h(AppNavigation, componentProps)) },
    { global: { plugins: [router, vuetify] } },
  )
}

describe('AppNavigation', () => {
  beforeEach(() => {
    mockedUseDisplay.mockReturnValue(createDisplay())
    mockedUseRoute.mockReturnValue(createRoute())
  })

  describe('drawer visibility', () => {
    it('does not render the drawer for non-IDIR users', () => {
      renderComponent({ showDrawer: false })

      expect(screen.queryByText('All tenants')).not.toBeInTheDocument()
    })

    it('renders the drawer for IDIR users', () => {
      renderComponent({ showDrawer: true })

      expect(screen.getByText('All tenants')).toBeInTheDocument()
    })
  })

  describe('always visible nav items', () => {
    it('renders the All Tenants nav item', () => {
      renderComponent({ showDrawer: true })

      expect(screen.getByText('All tenants')).toBeInTheDocument()
    })
  })

  describe('administrator nav items', () => {
    it('does not render Settings for non-administrators', () => {
      renderComponent({ showDrawer: true, showSettings: false })

      expect(screen.queryByText('Settings')).not.toBeInTheDocument()
    })

    it('renders Settings for administrators', () => {
      renderComponent({ showDrawer: true, showSettings: true })

      expect(screen.getByText('Settings')).toBeInTheDocument()
    })
  })

  describe('settings route', () => {
    beforeEach(() => {
      mockedUseRoute.mockReturnValue(
        createRoute({ path: '/settings/requests' }),
      )
    })

    it('renders Tenant Requests nav item', () => {
      renderComponent({ showDrawer: true })

      expect(screen.getByText('Tenant requests')).toBeInTheDocument()
    })

    it('renders Services nav item', () => {
      renderComponent({ showDrawer: true })

      expect(screen.getByText('Services')).toBeInTheDocument()
    })

    it('does not render settings sub-items on non-settings routes', () => {
      mockedUseRoute.mockReturnValue(createRoute({ path: '/tenants' }))
      renderComponent({ showDrawer: true })

      expect(screen.queryByText('Tenant requests')).not.toBeInTheDocument()
      expect(screen.queryByText('Services')).not.toBeInTheDocument()
    })
  })

  describe('tenant route', () => {
    beforeEach(() => {
      mockedUseRoute.mockReturnValue(
        createRoute({
          params: { tenantId: 'tenantId' },
        }),
      )
    })

    it('renders tenant nav items when on a tenant route', () => {
      renderComponent({ showDrawer: true })

      expect(screen.getByText('Tenant users')).toBeInTheDocument()
      expect(screen.getByText('Groups')).toBeInTheDocument()
      expect(screen.getByText('Connected services')).toBeInTheDocument()
    })

    it('links to the correct tenant routes', () => {
      renderComponent({ showDrawer: true })

      expect(
        screen.getByRole('link', { name: /tenant users/i }),
      ).toHaveAttribute('href', '/tenants/tenantId/users')
      expect(screen.getByRole('link', { name: /groups/i })).toHaveAttribute(
        'href',
        '/tenants/tenantId/groups',
      )
      expect(
        screen.getByRole('link', { name: /connected services/i }),
      ).toHaveAttribute('href', '/tenants/tenantId/services')
    })

    it('does not render tenant nav items when not on a tenant route', () => {
      mockedUseRoute.mockReturnValue(createRoute({ params: {} }))
      renderComponent({ showDrawer: true })

      expect(screen.queryByText('Tenant users')).not.toBeInTheDocument()
      expect(screen.queryByText('Groups')).not.toBeInTheDocument()
    })
  })

  describe('group route', () => {
    beforeEach(() => {
      mockedUseRoute.mockReturnValue(
        createRoute({
          params: { tenantId: 'tenantId', groupId: 'groupId' },
        }),
      )
    })

    it('renders group nav items when on a group route', () => {
      renderComponent({ showDrawer: true })

      expect(screen.getByText('Members')).toBeInTheDocument()
      expect(screen.getByText('Service roles')).toBeInTheDocument()
    })

    it('links to the correct group routes', () => {
      renderComponent({ showDrawer: true })

      expect(screen.getByRole('link', { name: /members/i })).toHaveAttribute(
        'href',
        '/tenants/tenantId/groups/groupId/members',
      )
      expect(
        screen.getByRole('link', { name: /service roles/i }),
      ).toHaveAttribute('href', '/tenants/tenantId/groups/groupId/roles')
    })

    it('does not render group nav items without a group route', () => {
      mockedUseRoute.mockReturnValue(
        createRoute({
          params: { tenantId: 'tenantId' },
        }),
      )
      renderComponent({ showDrawer: true })

      expect(screen.queryByText('Members')).not.toBeInTheDocument()
      expect(screen.queryByText('Service roles')).not.toBeInTheDocument()
    })
  })

  describe('rail mode', () => {
    it('is in rail mode on mobile', () => {
      mockedUseDisplay.mockReturnValue(createDisplay(true))
      renderComponent({ showDrawer: true })

      expect(screen.getByRole('navigation')).toHaveClass(
        'v-navigation-drawer--rail',
      )
    })

    it('is not in rail mode on desktop', () => {
      mockedUseDisplay.mockReturnValue(createDisplay(false))
      renderComponent({ showDrawer: true })

      expect(screen.getByRole('navigation')).not.toHaveClass(
        'v-navigation-drawer--rail',
      )
    })

    it('resets manual rail state when display changes', async () => {
      const mobile = ref(false)
      mockedUseDisplay.mockReturnValue({ mobile } as unknown as ReturnType<
        typeof useDisplay
      >)

      renderComponent({ showDrawer: true })

      const toggleButton = screen.getByLabelText('Collapse navigation')
      await fireEvent.click(toggleButton)

      mobile.value = true
      await nextTick()

      expect(screen.getByRole('navigation')).toHaveClass(
        'v-navigation-drawer--rail',
      )
    })
  })
})
