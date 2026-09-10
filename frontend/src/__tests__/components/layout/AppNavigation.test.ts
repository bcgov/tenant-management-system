import { fireEvent, render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { createRouter, createWebHistory, useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { VLayout } from 'vuetify/components'

import AppNavigation from '@/components/layout/AppNavigation.vue'
import vuetify from '@/plugins/vuetify'
import {
  currentUserIsIdir,
  currentUserIsOperationsAdmin,
} from '@/utils/permissions'

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

const renderComponent = () => {
  return render(VLayout, {
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
    mockedCurrentUserIsIdir.mockReturnValue(false)
    mockedCurrentUserIsOperationsAdmin.mockReturnValue(false)
    mockedUseDisplay.mockReturnValue(createDisplay())
    mockedUseRoute.mockReturnValue(createRoute())
  })

  describe('drawer visibility', () => {
    it('does not render the drawer for non-IDIR users', () => {
      mockedCurrentUserIsIdir.mockReturnValue(false)
      renderComponent()

      expect(screen.queryByText('All Tenants')).not.toBeInTheDocument()
    })

    it('renders the drawer for IDIR users', () => {
      mockedCurrentUserIsIdir.mockReturnValue(true)
      renderComponent()

      expect(screen.getByText('All Tenants')).toBeInTheDocument()
    })
  })

  describe('always visible nav items', () => {
    beforeEach(() => {
      mockedCurrentUserIsIdir.mockReturnValue(true)
    })

    it('renders the All Tenants nav item', () => {
      renderComponent()

      expect(screen.getByText('All Tenants')).toBeInTheDocument()
    })
  })

  describe('administrator nav items', () => {
    beforeEach(() => {
      mockedCurrentUserIsIdir.mockReturnValue(true)
    })

    it('does not render Settings for non-administrators', () => {
      mockedCurrentUserIsOperationsAdmin.mockReturnValue(false)
      renderComponent()

      expect(screen.queryByText('Settings')).not.toBeInTheDocument()
    })

    it('renders Settings for administrators', () => {
      mockedCurrentUserIsOperationsAdmin.mockReturnValue(true)
      renderComponent()

      expect(screen.getByText('Settings')).toBeInTheDocument()
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
      renderComponent()

      expect(screen.getByText('Tenant Requests')).toBeInTheDocument()
    })

    it('renders Services nav item', () => {
      renderComponent()

      expect(screen.getByText('Services')).toBeInTheDocument()
    })

    it('does not render settings sub-items on non-settings routes', () => {
      mockedUseRoute.mockReturnValue(createRoute({ path: '/tenants' }))
      renderComponent()

      expect(screen.queryByText('Tenant Requests')).not.toBeInTheDocument()
      expect(screen.queryByText('Services')).not.toBeInTheDocument()
    })
  })

  describe('tenant route', () => {
    beforeEach(() => {
      mockedCurrentUserIsIdir.mockReturnValue(true)
      mockedUseRoute.mockReturnValue(
        createRoute({
          params: { tenantId: 'tenantId' },
        }),
      )
    })

    it('renders tenant nav items when on a tenant route', () => {
      renderComponent()

      expect(screen.getByText('Tenant Users')).toBeInTheDocument()
      expect(screen.getByText('Groups')).toBeInTheDocument()
      expect(screen.getByText('Connected Services')).toBeInTheDocument()
    })

    it('links to the correct tenant routes', () => {
      renderComponent()

      expect(screen.getByText('Tenant Users').closest('a')).toHaveAttribute(
        'href',
        '/tenants/tenantId/users',
      )
      expect(screen.getByText('Groups').closest('a')).toHaveAttribute(
        'href',
        '/tenants/tenantId/groups',
      )
      expect(
        screen.getByText('Connected Services').closest('a'),
      ).toHaveAttribute('href', '/tenants/tenantId/services')
    })

    it('does not render tenant nav items when not on a tenant route', () => {
      mockedUseRoute.mockReturnValue(createRoute({ params: {} }))
      renderComponent()

      expect(screen.queryByText('Tenant Users')).not.toBeInTheDocument()
      expect(screen.queryByText('Groups')).not.toBeInTheDocument()
    })
  })

  describe('group route', () => {
    beforeEach(() => {
      mockedCurrentUserIsIdir.mockReturnValue(true)
      mockedUseRoute.mockReturnValue(
        createRoute({
          params: { tenantId: 'tenantId', groupId: 'groupId' },
        }),
      )
    })

    it('renders group nav items when on a group route', () => {
      renderComponent()

      expect(screen.getByText('Members')).toBeInTheDocument()
      expect(screen.getByText('Service Roles')).toBeInTheDocument()
    })

    it('links to the correct group routes', () => {
      renderComponent()

      expect(screen.getByText('Members').closest('a')).toHaveAttribute(
        'href',
        '/tenants/tenantId/groups/groupId/members',
      )
      expect(screen.getByText('Service Roles').closest('a')).toHaveAttribute(
        'href',
        '/tenants/tenantId/groups/groupId/roles',
      )
    })

    it('does not render group nav items without a group route', () => {
      mockedUseRoute.mockReturnValue(
        createRoute({
          params: { tenantId: 'tenantId' },
        }),
      )
      renderComponent()

      expect(screen.queryByText('Members')).not.toBeInTheDocument()
      expect(screen.queryByText('Service Roles')).not.toBeInTheDocument()
    })
  })

  describe('rail mode', () => {
    beforeEach(() => {
      mockedCurrentUserIsIdir.mockReturnValue(true)
    })

    it('is in rail mode on mobile', () => {
      mockedUseDisplay.mockReturnValue(createDisplay(true))
      renderComponent()

      expect(screen.getByRole('navigation')).toHaveClass(
        'v-navigation-drawer--rail',
      )
    })

    it('is not in rail mode on desktop', () => {
      mockedUseDisplay.mockReturnValue(createDisplay(false))
      renderComponent()

      expect(screen.getByRole('navigation')).not.toHaveClass(
        'v-navigation-drawer--rail',
      )
    })

    it('resets manual rail state when display changes', async () => {
      const mobile = ref(false)
      mockedUseDisplay.mockReturnValue({ mobile } as unknown as ReturnType<
        typeof useDisplay
      >)
      const { container } = renderComponent()

      const toggleButton = container.querySelector(
        '.v-navigation-drawer__append .v-list-item',
      ) as HTMLElement
      await fireEvent.click(toggleButton)

      mobile.value = true
      await nextTick()

      expect(screen.getByRole('navigation')).toHaveClass(
        'v-navigation-drawer--rail',
      )
    })
  })
})
