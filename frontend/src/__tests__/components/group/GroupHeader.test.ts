import { render, screen, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
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

const createRoute = (path = '/current-path'): ReturnType<typeof useRoute> => {
  return reactive({ path }) as ReturnType<typeof useRoute>
}

const renderComponent = (props = defaultProps) => {
  return render(GroupHeader, {
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
      renderComponent()

      expect(screen.getByText(mockGroup.name)).toBeInTheDocument()
    })

    it('renders the tenant name', () => {
      renderComponent()

      expect(screen.getByText(new RegExp(mockTenant.name))).toBeInTheDocument()
    })

    it('starts collapsed', () => {
      renderComponent()

      // "group details" matches the button's label in both its expanded and
      // collapsed state, so this same query works as a stable locator
      // throughout the test file — no re-querying by a name that changes.
      expect(
        screen.getByRole('button', { name: /group details/i }),
      ).toHaveAttribute('aria-expanded', 'false')
    })

    it('expands after the toggle button is clicked', async () => {
      const user = userEvent.setup()
      renderComponent()

      const toggle = screen.getByRole('button', { name: /group details/i })
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

      expect(screen.queryByText(mockGroup.description)).not.toBeInTheDocument()
    })

    it('shows detail when the toggle button is clicked', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(screen.getByRole('button', { name: /group details/i }))

      expect(await screen.findByText(mockGroup.description)).toBeInTheDocument()
    })

    it('shows detail when the toggle button is activated via keyboard', async () => {
      const user = userEvent.setup()
      renderComponent()

      screen.getByRole('button', { name: /group details/i }).focus()
      await user.keyboard('{Enter}')

      expect(await screen.findByText(mockGroup.description)).toBeInTheDocument()
    })

    it('hides detail when the toggle button is clicked again', async () => {
      const user = userEvent.setup()
      renderComponent()

      const toggle = screen.getByRole('button', { name: /group details/i })
      await user.click(toggle)
      await screen.findByText(mockGroup.description)

      await user.click(toggle)

      expect(screen.queryByText(mockGroup.description)).not.toBeInTheDocument()
    })

    // The header's larger surrounding area also toggles detail as a mouse
    // convenience — the button above is the real accessible affordance, so
    // this is the only test that exercises the extra hit area, by clicking
    // on visible header text rather than the toggle button itself.
    it('also shows detail when clicking the group name in the header', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(screen.getByText(mockGroup.name))

      expect(await screen.findByText(mockGroup.description)).toBeInTheDocument()
    })
  })

  describe('detail panel', () => {
    it('renders the created date', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(screen.getByRole('button', { name: /group details/i }))
      await screen.findByText(mockGroup.description)

      expect(screen.getByText(mockGroup.createdDate)).toBeInTheDocument()
    })

    it('renders who created the group', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(screen.getByRole('button', { name: /group details/i }))
      await screen.findByText(mockGroup.description)

      expect(screen.getByText(mockGroup.createdBy)).toBeInTheDocument()
    })

    it('renders member count from groupUsers', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(screen.getByRole('button', { name: /group details/i }))
      await screen.findByText(mockGroup.description)

      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('renders enabled roles count', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(screen.getByRole('button', { name: /group details/i }))
      await screen.findByText(mockGroup.description)

      expect(screen.getByText('4')).toBeInTheDocument()
    })

    it('renders enabled service count', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(screen.getByRole('button', { name: /group details/i }))
      await screen.findByText(mockGroup.description)

      expect(screen.getByText('7')).toBeInTheDocument()
    })
  })

  describe('route watcher', () => {
    it('collapses detail when route changes', async () => {
      const route = createRoute('/initial-path')
      mockedUseRoute.mockReturnValue(route)
      const user = userEvent.setup()

      renderComponent()
      const toggle = screen.getByRole('button', { name: /group details/i })
      await user.click(toggle)
      await screen.findByText(mockGroup.description)

      route.path = '/new-path'

      await waitFor(() =>
        expect(toggle).toHaveAttribute('aria-expanded', 'false'),
      )
      expect(screen.queryByText(mockGroup.description)).not.toBeInTheDocument()
    })
  })
})
