import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import { makeSsoUser, makeUser, makeUserIdir } from '@/__tests__/__factories__'
import { createMockAuthStore } from '@/__tests__/__helpers__/useAuthStore.mock'

import AppHeader from '@/components/layout/AppHeader.vue'
import { type User } from '@/models/user.model'

const display = vi.hoisted(() => ({
  mdAndUp: { value: true },
  smAndUp: { value: true },
}))

vi.mock('vuetify', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vuetify')>()),
  useDisplay: () => display,
}))

vi.mock('@/services/config.service', () => ({
  config: {
    link: {
      contactUs: 'https://contact-us.example.com',
    },
  },
}))

let currentAuthStore = createMockAuthStore()
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => currentAuthStore,
}))

const renderHeader = (user: User | null = null) =>
  render(AppHeader, {
    props: { user },
    global: {
      plugins: [createVuetify({ components, directives })],
      stubs: {
        RouterLink: { template: '<a><slot /></a>' },
        'v-app-bar': { template: '<header><slot /></header>' },
      },
    },
  })

describe('AppHeader.vue', () => {
  beforeEach(() => {
    display.mdAndUp.value = true
    display.smAndUp.value = true

    currentAuthStore = createMockAuthStore()
  })

  it('shows the full title on medium screens and up', () => {
    renderHeader()

    expect(
      screen.getByText('Connected Services, Team Access, and Roles (CSTAR)'),
    ).toBeInTheDocument()
  })

  it('shows the short title on small screens', () => {
    display.mdAndUp.value = false

    renderHeader()

    expect(screen.getByText('CSTAR')).toBeInTheDocument()
    expect(
      screen.queryByText('Connected Services, Team Access, and Roles (CSTAR)'),
    ).not.toBeInTheDocument()
  })

  it('shows no title on extra small screens', () => {
    display.mdAndUp.value = false
    display.smAndUp.value = false

    renderHeader()

    expect(screen.queryByText('CSTAR')).not.toBeInTheDocument()
    expect(
      screen.queryByText('Connected Services, Team Access, and Roles (CSTAR)'),
    ).not.toBeInTheDocument()
  })

  it('shows no help link or user menu when there is no user', () => {
    renderHeader(null)

    expect(
      screen.queryByRole('link', { name: 'Help - Contact Us' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'User menu' }),
    ).not.toBeInTheDocument()
  })

  it('shows a help link to the contact page when there is a user', () => {
    renderHeader(makeUser())

    const helpLink = screen.getByRole('link', { name: 'Help - Contact Us' })
    expect(helpLink).toHaveAttribute('href', 'https://contact-us.example.com')
    expect(helpLink).toHaveAttribute('target', '_blank')
  })

  it('keeps the user menu closed until the menu button is clicked', () => {
    renderHeader(makeUser())

    expect(screen.queryByText('Logout')).not.toBeInTheDocument()
  })

  it('shows the user name when the user menu is opened', async () => {
    const user = makeUserIdir({
      ssoUser: makeSsoUser({
        firstName: 'userSsoUserFirstName',
        lastName: 'userSsoUserLastName',
      }),
    })

    renderHeader(user)
    await userEvent.click(screen.getByRole('button', { name: 'User menu' }))

    expect(
      await screen.findByText('userSsoUserFirstName userSsoUserLastName'),
    ).toBeInTheDocument()
  })

  it('logs out when Logout is clicked in the user menu', async () => {
    renderHeader(makeUser())
    await userEvent.click(screen.getByRole('button', { name: 'User menu' }))
    await userEvent.click(await screen.findByText('Logout'))

    expect(currentAuthStore.logout).toHaveBeenCalledTimes(1)
  })
})
