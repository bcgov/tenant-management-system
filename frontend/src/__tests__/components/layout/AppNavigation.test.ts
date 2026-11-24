import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick, ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { VLayout } from 'vuetify/components'

import AppNavigation from '@/components/layout/AppNavigation.vue'
import vuetify from '@/plugins/vuetify'

vi.mock('vuetify', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vuetify')>()

  return { ...actual, useDisplay: vi.fn() }
})
const mockedUseDisplay = vi.mocked(useDisplay)

const stub = { template: '<div />' }

// Mirror the shape of the app's real routes so that path and params
// are always derived from each other.
const routes = [
  { path: '/tenants', component: stub },
  { path: '/tenants/:tenantId/services', component: stub },
  { path: '/tenants/:tenantId/users', component: stub },
  { path: '/tenants/:tenantId/users/:userId', component: stub },
  { path: '/tenants/:tenantId/groups', component: stub },
  { path: '/tenants/:tenantId/groups/:groupId/members', component: stub },
  { path: '/tenants/:tenantId/groups/:groupId/roles', component: stub },
  { path: '/settings/:section?', component: stub },
]

const createDisplay = (mobile = false): ReturnType<typeof useDisplay> => {
  return { mobile: ref(mobile) } as unknown as ReturnType<typeof useDisplay>
}

const renderComponent = async ({
  path = '/tenants',
  ...props
}: {
  path?: string
  showDrawer?: boolean
  showSettings?: boolean
} = {}) => {
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(path)
  await router.isReady()

  const componentProps = { showDrawer: true, showSettings: false, ...props }

  return render(
    { render: () => h(VLayout, () => h(AppNavigation, componentProps)) },
    { global: { plugins: [router, vuetify] } },
  )
}

describe('AppNavigation', () => {
  beforeEach(() => {
    mockedUseDisplay.mockReturnValue(createDisplay())
  })

  describe('drawer visibility', () => {
    it('does not render the drawer for non-IDIR users', async () => {
      await renderComponent({ showDrawer: false })

      expect(screen.queryByText('All tenants')).not.toBeInTheDocument()
    })

    it('renders the drawer, including All tenants, for IDIR users', async () => {
      await renderComponent({ showDrawer: true })

      expect(screen.getByText('All tenants')).toBeInTheDocument()
    })
  })

  describe('administrator nav items', () => {
    it('does not render Settings for non-administrators', async () => {
      await renderComponent({ showSettings: false })

      expect(screen.queryByText('Settings')).not.toBeInTheDocument()
    })

    it('renders Settings for administrators', async () => {
      await renderComponent({ showSettings: true })

      expect(screen.getByText('Settings')).toBeInTheDocument()
    })
  })

  describe('settings route', () => {
    it('renders the settings sub-items', async () => {
      await renderComponent({ path: '/settings/requests' })

      expect(screen.getByText('Tenant requests')).toBeInTheDocument()
      expect(screen.getByText('Services')).toBeInTheDocument()
    })

    it('does not render settings sub-items on non-settings routes', async () => {
      await renderComponent({ path: '/tenants' })

      expect(screen.queryByText('Tenant requests')).not.toBeInTheDocument()
      expect(screen.queryByText('Services')).not.toBeInTheDocument()
    })
  })

  describe('tenant route', () => {
    it('renders tenant nav items', async () => {
      await renderComponent({ path: '/tenants/tenantId/users' })

      expect(screen.getByText('Connected services')).toBeInTheDocument()
      expect(screen.getByText('Groups')).toBeInTheDocument()
      expect(screen.getByText('Tenant users')).toBeInTheDocument()
    })

    it('links to the correct tenant routes', async () => {
      await renderComponent({ path: '/tenants/tenantId/users' })

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

    it('does not render tenant nav items when not on a tenant route', async () => {
      await renderComponent({ path: '/tenants' })

      expect(screen.queryByText('Connected services')).not.toBeInTheDocument()
      expect(screen.queryByText('Tenant users')).not.toBeInTheDocument()
      expect(screen.queryByText('Groups')).not.toBeInTheDocument()
    })
  })

  describe('tenant user details route', () => {
    it('renders tenant nav items and user details', async () => {
      await renderComponent({ path: '/tenants/tenantId/users/userId' })

      expect(screen.getByText('Connected services')).toBeInTheDocument()
      expect(screen.getByText('Groups')).toBeInTheDocument()
      expect(screen.getByText('Tenant users')).toBeInTheDocument()
      expect(screen.getByText('User details')).toBeInTheDocument()
    })

    it('links to the correct user details route', async () => {
      await renderComponent({ path: '/tenants/tenantId/users/userId' })

      expect(
        screen.getByRole('link', { name: /user details/i }),
      ).toHaveAttribute('href', '/tenants/tenantId/users/userId')
    })

    it('does not render user details on the users list route', async () => {
      await renderComponent({ path: '/tenants/tenantId/users' })

      expect(screen.queryByText('User details')).not.toBeInTheDocument()
    })
  })

  describe('group route', () => {
    it('renders group nav items', async () => {
      await renderComponent({
        path: '/tenants/tenantId/groups/groupId/members',
      })

      expect(screen.getByText('Members')).toBeInTheDocument()
      expect(screen.getByText('Service roles')).toBeInTheDocument()
    })

    it('links to the correct group routes', async () => {
      await renderComponent({
        path: '/tenants/tenantId/groups/groupId/members',
      })

      expect(screen.getByRole('link', { name: /members/i })).toHaveAttribute(
        'href',
        '/tenants/tenantId/groups/groupId/members',
      )
      expect(
        screen.getByRole('link', { name: /service roles/i }),
      ).toHaveAttribute('href', '/tenants/tenantId/groups/groupId/roles')
    })

    it('does not render group nav items without a group', async () => {
      await renderComponent({ path: '/tenants/tenantId/groups' })

      expect(screen.queryByText('Members')).not.toBeInTheDocument()
      expect(screen.queryByText('Service roles')).not.toBeInTheDocument()
    })
  })

  describe('rail mode', () => {
    it('is in rail mode on mobile', async () => {
      mockedUseDisplay.mockReturnValue(createDisplay(true))
      await renderComponent()

      expect(screen.getByRole('navigation')).toHaveClass(
        'v-navigation-drawer--rail',
      )
    })

    it('is not in rail mode on desktop', async () => {
      mockedUseDisplay.mockReturnValue(createDisplay(false))
      await renderComponent()

      expect(screen.getByRole('navigation')).not.toHaveClass(
        'v-navigation-drawer--rail',
      )
    })

    it('resets manual rail state when display changes', async () => {
      const user = userEvent.setup()
      const mobile = ref(false)
      mockedUseDisplay.mockReturnValue({ mobile } as unknown as ReturnType<
        typeof useDisplay
      >)

      await renderComponent()

      await user.click(screen.getByLabelText('Collapse navigation'))

      mobile.value = true
      await nextTick()

      expect(screen.getByRole('navigation')).toHaveClass(
        'v-navigation-drawer--rail',
      )
    })
  })
})
