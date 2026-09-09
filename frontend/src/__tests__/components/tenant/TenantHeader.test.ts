import { render, screen, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { useRoute } from 'vue-router'

import { makeGroup, makeTenant, makeUser } from '@/__tests__/__factories__'

import TenantHeader from '@/components/tenant/TenantHeader.vue'
import vuetify from '@/plugins/vuetify'

const mockGroups = [makeGroup(), makeGroup()]

const mockTenant = makeTenant({
  users: [makeUser(), makeUser(), makeUser(), makeUser(), makeUser()],
})

vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
}))
const mockedUseRoute = vi.mocked(useRoute)

const defaultProps = {
  groups: mockGroups,
  tenant: mockTenant,
}

const createRoute = (path = '/current-path'): ReturnType<typeof useRoute> => {
  return reactive({ path }) as ReturnType<typeof useRoute>
}

const renderComponent = (props = defaultProps) => {
  return render(TenantHeader, {
    props,
    global: {
      plugins: [vuetify],
    },
  })
}

describe('TenantHeader', () => {
  beforeEach(() => {
    mockedUseRoute.mockReturnValue(createRoute())
  })

  describe('header', () => {
    it('renders the tenant name', () => {
      renderComponent()

      expect(screen.getByText(mockTenant.name)).toBeInTheDocument()
    })

    it('renders the tenant ministry name', () => {
      renderComponent()

      expect(screen.getByText(mockTenant.ministryName)).toBeInTheDocument()
    })

    it('starts collapsed', () => {
      renderComponent()

      // "tenant details" matches the button's label in both its expanded
      // and collapsed state, so this same query works as a stable locator
      // throughout the test file — no re-querying by a name that changes.
      expect(
        screen.getByRole('button', { name: /tenant details/i }),
      ).toHaveAttribute('aria-expanded', 'false')
    })

    it('expands after the toggle button is clicked', async () => {
      const user = userEvent.setup()
      renderComponent()

      const toggle = screen.getByRole('button', { name: /tenant details/i })
      await user.click(toggle)

      // waitFor re-checks the same element reference until the attribute
      // updates, rather than re-querying by a name that's mid-change.
      await waitFor(() =>
        expect(toggle).toHaveAttribute('aria-expanded', 'true'),
      )
    })
  })

  describe('toggle detail', () => {
    it('does not show detail by default', () => {
      renderComponent()

      expect(screen.queryByText(mockTenant.description)).not.toBeInTheDocument()
    })

    it('shows detail when the toggle button is clicked', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(screen.getByRole('button', { name: /tenant details/i }))

      expect(
        await screen.findByText(mockTenant.description),
      ).toBeInTheDocument()
    })

    it('shows detail when the toggle button is activated via keyboard', async () => {
      const user = userEvent.setup()
      renderComponent()

      screen.getByRole('button', { name: /tenant details/i }).focus()
      await user.keyboard('{Enter}')

      expect(
        await screen.findByText(mockTenant.description),
      ).toBeInTheDocument()
    })

    it('hides detail when the toggle button is clicked again', async () => {
      const user = userEvent.setup()
      renderComponent()

      const toggle = screen.getByRole('button', { name: /tenant details/i })
      await user.click(toggle)
      await screen.findByText(mockTenant.description)

      await user.click(toggle)

      expect(screen.queryByText(mockTenant.description)).not.toBeInTheDocument()
    })

    // The header's larger surrounding area also toggles detail as a mouse
    // convenience — the button above is the real accessible affordance, so
    // this is the only test that exercises the extra hit area, by clicking
    // on visible header text rather than the toggle button itself.
    it('also shows detail when clicking the tenant name in the header', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(screen.getByText(mockTenant.name))

      expect(
        await screen.findByText(mockTenant.description),
      ).toBeInTheDocument()
    })
  })

  describe('detail panel', () => {
    it('renders the created date', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(screen.getByRole('button', { name: /tenant details/i }))
      await screen.findByText(mockTenant.description)

      expect(screen.getByText(mockTenant.createdDate)).toBeInTheDocument()
    })

    it('renders who created the tenant', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(screen.getByRole('button', { name: /tenant details/i }))
      await screen.findByText(mockTenant.description)

      expect(screen.getByText(mockTenant.createdBy)).toBeInTheDocument()
    })

    it('renders user count from tenant.users', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(screen.getByRole('button', { name: /tenant details/i }))
      await screen.findByText(mockTenant.description)

      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('renders group count from the groups prop', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(screen.getByRole('button', { name: /tenant details/i }))
      await screen.findByText(mockTenant.description)

      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  describe('route watcher', () => {
    it('collapses detail when route changes', async () => {
      const route = createRoute('/initial-path')
      mockedUseRoute.mockReturnValue(route)
      const user = userEvent.setup()

      renderComponent()
      const toggle = screen.getByRole('button', { name: /tenant details/i })
      await user.click(toggle)
      await screen.findByText(mockTenant.description)

      route.path = '/new-path'

      await waitFor(() =>
        expect(toggle).toHaveAttribute('aria-expanded', 'false'),
      )
      expect(screen.queryByText(mockTenant.description)).not.toBeInTheDocument()
    })
  })
})
