import { render, screen, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { useRoute } from 'vue-router'

import {
  makeGroup,
  makeGroupUser,
  makeTenant,
  makeUser,
} from '@/__tests__/__factories__'

import TenantHeader from '@/components/tenant/TenantHeader.vue'
import vuetify from '@/plugins/vuetify'

vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
}))
const mockedUseRoute = vi.mocked(useRoute)

const createRoute = (path = '/current-path'): ReturnType<typeof useRoute> => {
  return reactive({ path }) as ReturnType<typeof useRoute>
}

const renderComponent = (props = {}) => {
  return render(TenantHeader, {
    global: {
      plugins: [vuetify],
    },
    props: {
      groups: [],
      tenant: makeTenant(),
      ...props,
    },
  })
}

describe('TenantHeader', () => {
  beforeEach(() => {
    mockedUseRoute.mockReturnValue(createRoute())
  })

  describe('header', () => {
    it('renders the tenant name', () => {
      const tenant = makeTenant({ name: 'tenantName' })

      renderComponent({ tenant })

      expect(screen.getByText('tenantName')).toBeInTheDocument()
    })

    it('renders the tenant ministry name', () => {
      const tenant = makeTenant({ ministryName: 'tenantMinistryName' })

      renderComponent({ tenant })

      expect(screen.getByText('tenantMinistryName')).toBeInTheDocument()
    })
  })

  describe('header details', () => {
    it('starts collapsed', () => {
      renderComponent()

      expect(
        screen.getByRole('button', { name: /expand tenant details/i }),
      ).toHaveAttribute('aria-expanded', 'false')
      expect(
        screen.queryByRole('button', { name: /collapse tenant details/i }),
      ).not.toBeInTheDocument()
    })

    it('expands after click', async () => {
      const user = userEvent.setup()

      renderComponent()
      const toggle = screen.getByRole('button', {
        name: /expand tenant details/i,
      })
      await user.click(toggle)

      await waitFor(() =>
        expect(toggle).toHaveAttribute('aria-expanded', 'true'),
      )
      expect(
        screen.queryByRole('button', { name: /expand tenant details/i }),
      ).not.toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /collapse tenant details/i }),
      ).toBeInTheDocument()
    })
  })

  describe('tenant description', () => {
    it('does not show by default', () => {
      const tenant = makeTenant({ description: 'tenantDescription' })

      renderComponent({ tenant })

      expect(screen.queryByText('tenantDescription')).not.toBeInTheDocument()
    })

    it('shows when the toggle button is clicked', async () => {
      const tenant = makeTenant({ description: 'tenantDescription' })
      const user = userEvent.setup()

      renderComponent({ tenant })
      await user.click(
        screen.getByRole('button', { name: /expand tenant details/i }),
      )

      expect(await screen.findByText('tenantDescription')).toBeInTheDocument()
    })

    it('shows when the toggle button is activated via keyboard', async () => {
      const tenant = makeTenant({ description: 'tenantDescription' })
      const user = userEvent.setup()

      renderComponent({ tenant })
      screen.getByRole('button', { name: /expand tenant details/i }).focus()
      await user.keyboard('{Enter}')

      expect(await screen.findByText('tenantDescription')).toBeInTheDocument()
    })

    it('hides when the toggle button is clicked again', async () => {
      const tenant = makeTenant({ description: 'tenantDescription' })
      const user = userEvent.setup()

      renderComponent({ tenant })
      const toggle = screen.getByRole('button', {
        name: /expand tenant details/i,
      })
      await user.click(toggle)
      await screen.findByText('tenantDescription')
      await user.click(toggle)

      expect(screen.queryByText('tenantDescription')).not.toBeInTheDocument()
    })

    it('also shows detail when clicking the tenant name in the header', async () => {
      const tenant = makeTenant({
        description: 'tenantDescription',
        name: 'tenantName',
      })
      const user = userEvent.setup()

      renderComponent({ tenant })
      await user.click(screen.getByText('tenantName'))

      expect(await screen.findByText('tenantDescription')).toBeInTheDocument()
    })
  })

  describe('detail fields', () => {
    it('renders the created date', async () => {
      const tenant = makeTenant({ createdDate: 'createdDate' })
      const user = userEvent.setup()

      renderComponent({ tenant })

      expect(screen.queryByText('createdDate')).not.toBeInTheDocument()

      await user.click(
        screen.getByRole('button', { name: /expand tenant details/i }),
      )

      expect(await screen.findByText('createdDate')).toBeInTheDocument()
    })

    it('renders who created the tenant', async () => {
      const tenant = makeTenant({ createdBy: 'createdBy' })
      const user = userEvent.setup()

      renderComponent({ tenant })

      expect(screen.queryByText('createdBy')).not.toBeInTheDocument()

      await user.click(
        screen.getByRole('button', { name: /expand tenant details/i }),
      )

      expect(await screen.findByText('createdBy')).toBeInTheDocument()
    })

    it('renders user count from users', async () => {
      const tenant = makeTenant({ users: [makeUser(), makeUser(), makeUser()] })
      const user = userEvent.setup()

      renderComponent({ tenant })

      expect(screen.queryByText('3')).not.toBeInTheDocument()

      await user.click(
        screen.getByRole('button', { name: /expand tenant details/i }),
      )

      expect(await screen.findByText('3')).toBeInTheDocument()
    })

    it('renders group count from groups prop', async () => {
      const groups = [makeGroup(), makeGroup(), makeGroup(), makeGroup()]
      const user = userEvent.setup()

      renderComponent({ groups })

      expect(screen.queryByText('4')).not.toBeInTheDocument()

      await user.click(
        screen.getByRole('button', { name: /expand tenant details/i }),
      )

      expect(await screen.findByText('4')).toBeInTheDocument()
    })
  })

  describe('route watcher', () => {
    it('collapses detail when route changes', async () => {
      const tenant = makeTenant({ description: 'tenantDescription' })
      const route = createRoute('/initial-path')
      mockedUseRoute.mockReturnValue(route)
      const user = userEvent.setup()

      renderComponent({ tenant })
      const toggle = screen.getByRole('button', {
        name: /expand tenant details/i,
      })
      await user.click(toggle)
      await screen.findByText('tenantDescription')

      route.path = '/new-path'

      await waitFor(() =>
        expect(toggle).toHaveAttribute('aria-expanded', 'false'),
      )
      expect(screen.queryByText('tenantDescription')).not.toBeInTheDocument()
    })
  })
})
