import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AdministratorContainer from '@/components/auth/AdministratorContainer.vue'
import vuetify from '@/plugins/vuetify'
import { currentUserIsOperationsAdmin } from '@/utils/permissions'

const mockPush = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

vi.mock('@/utils/permissions', () => ({
  currentUserIsOperationsAdmin: vi.fn(),
}))

const renderComponent = (slot = '') => {
  return render(AdministratorContainer, {
    slots: {
      default: slot,
    },
    global: {
      plugins: [vuetify],
      stubs: {
        SimpleDialog: {
          props: ['title', 'message'],
          template: `
            <div>
              <h2>{{ title }}</h2>
              <p>{{ message }}</p>
              <button @click="$emit('button-click', 'ok')">OK</button>
              <button @click="$emit('button-click', 'cancel')">Cancel</button>
            </div>
          `,
        },
      },
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AdministratorContainer', () => {
  it('shows the page content when the user is an operations admin', () => {
    vi.mocked(currentUserIsOperationsAdmin).mockReturnValue(true)

    renderComponent('<div>Protected content</div>')

    expect(screen.getByText('Protected content')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', {
        name: 'You are not authorized to view this page',
      }),
    ).not.toBeInTheDocument()
  })

  it('shows the unauthorized dialog when the user is not an operations admin', () => {
    vi.mocked(currentUserIsOperationsAdmin).mockReturnValue(false)

    renderComponent()

    expect(
      screen.getByRole('heading', {
        name: 'You are not authorized to view this page',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Click 'OK' to return to the CSTAR home page."),
    ).toBeInTheDocument()
  })

  it('returns to the tenants page when OK is clicked', async () => {
    vi.mocked(currentUserIsOperationsAdmin).mockReturnValue(false)

    const user = userEvent.setup()
    renderComponent()

    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(mockPush).toHaveBeenCalledWith('/tenants')
  })

  it('does not navigate for other dialog actions', async () => {
    vi.mocked(currentUserIsOperationsAdmin).mockReturnValue(false)

    const user = userEvent.setup()
    renderComponent()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(mockPush).not.toHaveBeenCalled()
  })
})
