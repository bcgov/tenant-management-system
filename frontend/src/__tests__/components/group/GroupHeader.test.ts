import { render, screen, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { useRoute } from 'vue-router'

import { makeGroup, makeGroupUser, makeTenant } from '@/__tests__/__factories__'

import GroupHeader from '@/components/group/GroupHeader.vue'
import vuetify from '@/plugins/vuetify'
import { currentUserHasRole } from '@/utils/permissions'

vi.mock('@/utils/permissions', () => ({
  currentUserHasRole: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
}))
const mockedUseRoute = vi.mocked(useRoute)

const createRoute = (path = '/current-path'): ReturnType<typeof useRoute> => {
  return reactive({ path }) as ReturnType<typeof useRoute>
}

const renderComponent = (props = {}) => {
  return render(GroupHeader, {
    global: {
      plugins: [vuetify],
    },
    props: {
      enabledRolesCount: 0,
      enabledServiceCount: 0,
      group: makeGroup(),
      isDuplicateName: false,
      tenant: makeTenant(),
      ...props,
    },
  })
}

describe('GroupHeader', () => {
  beforeEach(() => {
    mockedUseRoute.mockReturnValue(createRoute())
  })

  describe('header', () => {
    it('renders the group name', () => {
      const group = makeGroup({ name: 'groupName' })

      renderComponent({ group })

      expect(screen.getByText('groupName')).toBeInTheDocument()
    })

    it('renders the tenant name', () => {
      const tenant = makeTenant({ name: 'tenantName' })

      renderComponent({ tenant })

      expect(screen.getByText('Tenant: tenantName')).toBeInTheDocument()
    })
  })

  describe('header details', () => {
    it('starts collapsed', () => {
      renderComponent()

      expect(
        screen.getByRole('button', { name: /expand group details/i }),
      ).toHaveAttribute('aria-expanded', 'false')
      expect(
        screen.queryByRole('button', { name: /collapse group details/i }),
      ).not.toBeInTheDocument()
    })

    it('expands after click', async () => {
      const user = userEvent.setup()

      renderComponent()
      await user.click(
        screen.getByRole('button', { name: /expand group details/i }),
      )

      expect(
        screen.queryByRole('button', { name: /expand group details/i }),
      ).not.toBeInTheDocument()
      expect(
        await screen.findByRole('button', { name: /collapse group details/i }),
      ).toBeInTheDocument()
    })
  })

  describe('group description', () => {
    it('does not show by default', () => {
      const group = makeGroup({ description: 'groupDescription' })

      renderComponent({ group })

      expect(screen.queryByText('groupDescription')).not.toBeInTheDocument()
    })

    it('shows when the toggle button is clicked', async () => {
      const group = makeGroup({ description: 'groupDescription' })
      const user = userEvent.setup()

      renderComponent({ group })
      await user.click(
        screen.getByRole('button', { name: /expand group details/i }),
      )

      expect(await screen.findByText('groupDescription')).toBeInTheDocument()
    })

    it('shows when the toggle button is activated via keyboard', async () => {
      const group = makeGroup({ description: 'groupDescription' })
      const user = userEvent.setup()

      renderComponent({ group })
      screen.getByRole('button', { name: /expand group details/i }).focus()
      await user.keyboard('{Enter}')

      expect(await screen.findByText('groupDescription')).toBeInTheDocument()
    })

    it('hides when the toggle button is clicked again', async () => {
      const group = makeGroup({ description: 'groupDescription' })
      const user = userEvent.setup()

      renderComponent({ group })
      const toggle = screen.getByRole('button', {
        name: /expand group details/i,
      })
      await user.click(toggle)
      await screen.findByText('groupDescription')
      await user.click(toggle)

      expect(screen.queryByText('groupDescription')).not.toBeInTheDocument()
    })

    it('also shows detail when clicking the group name in the header', async () => {
      const group = makeGroup({
        description: 'groupDescription',
        name: 'groupName',
      })
      const user = userEvent.setup()

      renderComponent({ group })
      await user.click(screen.getByText('groupName'))

      expect(await screen.findByText('groupDescription')).toBeInTheDocument()
    })
  })

  describe('detail fields', () => {
    it('renders the created date', async () => {
      const group = makeGroup({ createdDate: 'createdDate' })
      const user = userEvent.setup()

      renderComponent({ group })

      expect(screen.queryByText('createdDate')).not.toBeInTheDocument()

      await user.click(
        screen.getByRole('button', { name: /expand group details/i }),
      )

      expect(await screen.findByText('createdDate')).toBeInTheDocument()
    })

    it('renders who created the group', async () => {
      const group = makeGroup({ createdBy: 'createdBy' })
      const user = userEvent.setup()

      renderComponent({ group })

      expect(screen.queryByText('createdBy')).not.toBeInTheDocument()

      await user.click(
        screen.getByRole('button', { name: /expand group details/i }),
      )

      expect(await screen.findByText('createdBy')).toBeInTheDocument()
    })

    it('renders member count from groupUsers', async () => {
      const group = makeGroup({
        groupUsers: [makeGroupUser(), makeGroupUser(), makeGroupUser()],
      })
      const user = userEvent.setup()

      renderComponent({ group })

      expect(screen.queryByText('3')).not.toBeInTheDocument()

      await user.click(
        screen.getByRole('button', { name: /expand group details/i }),
      )

      expect(await screen.findByText('3')).toBeInTheDocument()
    })

    it('renders enabled roles count', async () => {
      const user = userEvent.setup()

      renderComponent({ enabledRolesCount: 4 })

      expect(screen.queryByText('4')).not.toBeInTheDocument()

      await user.click(
        screen.getByRole('button', { name: /expand group details/i }),
      )

      expect(await screen.findByText('4')).toBeInTheDocument()
    })

    it('renders enabled service count', async () => {
      const user = userEvent.setup()

      renderComponent({ enabledServiceCount: 5 })

      expect(screen.queryByText('5')).not.toBeInTheDocument()

      await user.click(
        screen.getByRole('button', { name: /expand group details/i }),
      )

      expect(await screen.findByText('5')).toBeInTheDocument()
    })
  })

  describe('route watcher', () => {
    it('collapses detail when route changes', async () => {
      const group = makeGroup({ description: 'groupDescription' })
      const route = createRoute('/initial-path')
      mockedUseRoute.mockReturnValue(route)
      const user = userEvent.setup()

      renderComponent({ group })
      const toggle = screen.getByRole('button', {
        name: /expand group details/i,
      })
      await user.click(toggle)
      await screen.findByText('groupDescription')

      route.path = '/new-path'

      await waitFor(() =>
        expect(toggle).toHaveAttribute('aria-expanded', 'false'),
      )
      expect(screen.queryByText('groupDescription')).not.toBeInTheDocument()
    })
  })

  describe('edit details button', () => {
    it('is shown for admins', () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      renderComponent()

      expect(
        screen.getByRole('button', { name: /edit group details/i }),
      ).toBeInTheDocument()
    })

    it('is hidden for non-admins', () => {
      vi.mocked(currentUserHasRole).mockReturnValue(false)

      renderComponent()

      expect(
        screen.queryByRole('button', { name: /edit group details/i }),
      ).not.toBeInTheDocument()
    })

    it('dialog is not opened before clicked', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)
      const user = userEvent.setup()

      renderComponent()

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('opens dialog when clicked', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)
      const user = userEvent.setup()

      renderComponent()
      await user.click(
        screen.getByRole('button', { name: /edit group details/i }),
      )

      expect(await screen.findByRole('dialog')).toBeInTheDocument()
    })

    it('closes dialog when the dialog emits update:modelValue', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)
      const user = userEvent.setup()

      render(GroupHeader, {
        props: {
          enabledRolesCount: 0,
          enabledServiceCount: 0,
          group: makeGroup(),
          isDuplicateName: false,
          tenant: makeTenant(),
        },
        global: {
          plugins: [vuetify],
          stubs: {
            GroupEditDialog: {
              props: ['modelValue'],
              emits: ['update:modelValue'],
              template: `
          <div v-if="modelValue" role="dialog">
            <button
              type="button"
              @click="$emit('update:modelValue', false)"
            >
              Close
            </button>
          </div>
        `,
            },
          },
        },
      })
      await user.click(
        screen.getByRole('button', { name: /edit group details/i }),
      )

      expect(await screen.findByRole('dialog')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /close/i }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('closes dialog when dialog emits update:modelValue', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)
      const user = userEvent.setup()

      render(GroupHeader, {
        props: {
          enabledRolesCount: 0,
          enabledServiceCount: 0,
          group: makeGroup(),
          isDuplicateName: false,
          tenant: makeTenant(),
        },
        global: {
          plugins: [vuetify],
          stubs: {
            GroupEditDialog: {
              props: ['modelValue'],
              emits: ['update:modelValue'],
              template: `
            <div v-if="modelValue" role="dialog">
              <button
                type="button"
                @click="$emit('update:modelValue', false)"
              >
                Close
              </button>
            </div>
          `,
            },
          },
        },
      })

      await user.click(
        screen.getByRole('button', { name: /edit group details/i }),
      )

      expect(await screen.findByRole('dialog')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /close/i }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('emits submit when dialog is submitted', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)
      const updatedGroup = makeGroup({ name: 'Updated group' })

      const { emitted } = render(GroupHeader, {
        props: {
          enabledRolesCount: 0,
          enabledServiceCount: 0,
          group: makeGroup(),
          isDuplicateName: false,
          tenant: makeTenant(),
        },
        global: {
          plugins: [vuetify],
          stubs: {
            GroupEditDialog: {
              props: ['modelValue'],
              emits: ['submit'],
              template: `
            <div v-if="modelValue" role="dialog">
              <button
                type="button"
                @click="$emit('submit', updatedGroup)"
              >
                Submit
              </button>
            </div>
          `,
              setup() {
                return { updatedGroup }
              },
            },
          },
        },
      })

      const user = userEvent.setup()

      await user.click(
        screen.getByRole('button', { name: /edit group details/i }),
      )
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(emitted().submit).toEqual([[updatedGroup]])
    })
  })
})
