import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'

import ServiceForm from '@/components/service/ServiceForm.vue'

const vuetify = createVuetify()

type User = ReturnType<typeof userEvent.setup>

const nth = <T>(items: T[], index: number): T => {
  const item = items[index]
  if (item === undefined) {
    throw new Error(`Expected an element at index ${index}`)
  }
  return item
}

const renderComponent = (props = {}) =>
  render(ServiceForm, {
    global: {
      plugins: [vuetify],
    },
    props: {
      isDuplicateName: false,
      ...props,
    },
  })

const fillServiceFields = async (
  user: User,
  values: Partial<
    Record<
      | 'clientIdentifier'
      | 'description'
      | 'displayName'
      | 'landingPageUrl'
      | 'name',
      string
    >
  > = {},
) => {
  const v = {
    clientIdentifier: 'client-id',
    description: 'Service description',
    displayName: 'Service Display Name',
    landingPageUrl: 'https://example.com',
    name: 'service-name',
    ...values,
  }

  await user.type(screen.getByLabelText(/^name/i), v.name)
  await user.type(screen.getByLabelText(/^display name/i), v.displayName)
  await user.type(screen.getByLabelText(/^description/i), v.description)
  await user.type(
    screen.getByLabelText(/^client identifier/i),
    v.clientIdentifier,
  )
  await user.type(screen.getByLabelText(/^landing page url/i), v.landingPageUrl)
}

const addRole = async (user: User) => {
  await user.click(screen.getByRole('button', { name: /add role/i }))
}

const fillRole = async (
  user: User,
  index: number,
  values: { description: string; name: string },
) => {
  await user.type(
    nth(screen.getAllByLabelText(/role name/i), index),
    values.name,
  )
  await user.type(
    nth(screen.getAllByLabelText(/^description/i), index + 1),
    values.description,
  )
  await user.click(
    nth(screen.getAllByRole('checkbox', { name: 'IDIR' }), index),
  )
}

const submit = async (user: User) => {
  await user.click(
    screen.getByRole('button', { name: /create connected service/i }),
  )
}

describe('ServiceForm.vue', () => {
  describe('rendering', () => {
    it('renders both section headings', () => {
      renderComponent()

      expect(screen.getByText('1. Add a Connected Service')).toBeInTheDocument()
      expect(
        screen.getByText('2. Add Connected Service Roles'),
      ).toBeInTheDocument()
    })

    it('renders the service fields', () => {
      renderComponent()

      expect(screen.getByLabelText(/^name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^display name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^client identifier/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^landing page url/i)).toBeInTheDocument()
    })

    it('renders no role cards initially', () => {
      renderComponent()

      expect(screen.queryByText('New Role')).not.toBeInTheDocument()
    })
  })

  describe('validation on submit', () => {
    it('shows required errors for every empty service field', async () => {
      const user = userEvent.setup()
      renderComponent()

      await submit(user)

      expect(await screen.findAllByText('Required')).toHaveLength(5)
    })

    it('shows an error when there are no roles', async () => {
      const user = userEvent.setup()
      renderComponent()

      await submit(user)

      expect(
        await screen.findByText('At least one role is required'),
      ).toBeInTheDocument()
    })

    it('shows an error for an invalid landing page URL', async () => {
      const user = userEvent.setup()
      renderComponent()

      await fillServiceFields(user, { landingPageUrl: 'not-a-url' })
      await submit(user)

      expect(await screen.findByText('Must be a valid URL')).toBeInTheDocument()
    })

    it('shows an error when a field is only spaces', async () => {
      const user = userEvent.setup()
      renderComponent()

      await fillServiceFields(user, { displayName: '   ' })
      await submit(user)

      expect(
        await screen.findByText('Cannot be only spaces'),
      ).toBeInTheDocument()
    })

    it('does not emit submit when the form is invalid', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      await submit(user)
      await screen.findAllByText('Required')

      expect(emitted().submit).toBeUndefined()
    })

    it('does not emit submit when a role is invalid', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      await fillServiceFields(user)
      await addRole(user)
      await submit(user)

      expect(await screen.findAllByText('Required')).toHaveLength(2)
      expect(emitted().submit).toBeUndefined()
    })
  })

  describe('submitting', () => {
    it('emits submit with the form data when everything is valid', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      await fillServiceFields(user)
      await addRole(user)
      await fillRole(user, 0, { description: 'Admins', name: 'Admin' })
      await submit(user)

      await waitFor(() => expect(emitted().submit).toHaveLength(1))
      expect(emitted().submit?.[0]).toEqual([
        {
          clientIdentifier: 'client-id',
          description: 'Service description',
          displayName: 'Service Display Name',
          landingPageUrl: 'https://example.com',
          name: 'service-name',
          roles: [
            {
              description: 'Admins',
              identityProviders: ['idir'],
              name: 'Admin',
            },
          ],
        },
      ])
    })

    it('trims whitespace from values before emitting', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      await fillServiceFields(user, {
        clientIdentifier: '  client-id  ',
        description: '  Service description  ',
        displayName: '  Service Display Name  ',
        landingPageUrl: 'https://example.com',
        name: '  service-name  ',
      })
      await addRole(user)
      await fillRole(user, 0, { description: '  Admins  ', name: '  Admin  ' })
      await submit(user)

      await waitFor(() => expect(emitted().submit).toHaveLength(1))
      expect(emitted().submit?.[0]).toEqual([
        expect.objectContaining({
          clientIdentifier: 'client-id',
          description: 'Service description',
          displayName: 'Service Display Name',
          name: 'service-name',
          roles: [
            expect.objectContaining({ description: 'Admins', name: 'Admin' }),
          ],
        }),
      ])
    })
  })

  describe('duplicate name', () => {
    it('shows an error when isDuplicateName becomes true', async () => {
      const user = userEvent.setup()
      const { rerender } = renderComponent()

      await user.type(screen.getByLabelText(/^name/i), 'taken')
      await rerender({ isDuplicateName: true })

      expect(await screen.findByText('Name must be unique')).toBeInTheDocument()
    })

    it('emits clearDuplicateError when the name changes', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      await user.type(screen.getByLabelText(/^name/i), 'a')

      await waitFor(() => expect(emitted().clearDuplicateError).toBeDefined())
    })
  })

  describe('roles', () => {
    it('adds a role card when Add Role is clicked', async () => {
      const user = userEvent.setup()
      renderComponent()

      await addRole(user)

      expect(screen.getByText('New Role')).toBeInTheDocument()
    })

    it('clears the "at least one role" error when a role is added', async () => {
      const user = userEvent.setup()
      renderComponent()

      await submit(user)
      await screen.findByText('At least one role is required')

      await addRole(user)

      await waitFor(() =>
        expect(
          screen.queryByText('At least one role is required'),
        ).not.toBeInTheDocument(),
      )
    })

    it('removes a role card when Remove Role is clicked', async () => {
      const user = userEvent.setup()
      renderComponent()

      await addRole(user)
      await user.click(screen.getByRole('button', { name: /remove role/i }))

      expect(screen.queryByText('New Role')).not.toBeInTheDocument()
    })

    it('shows the "at least one role" error after removing the last role', async () => {
      const user = userEvent.setup()
      renderComponent()

      await addRole(user)
      await user.click(screen.getByRole('button', { name: /remove role/i }))

      expect(
        await screen.findByText('At least one role is required'),
      ).toBeInTheDocument()
    })

    it('keeps the correct role when the first of two is removed', async () => {
      const user = userEvent.setup()
      renderComponent()

      await addRole(user)
      await addRole(user)
      await user.type(nth(screen.getAllByLabelText(/role name/i), 0), 'First')
      await user.type(nth(screen.getAllByLabelText(/role name/i), 1), 'Second')

      await user.click(
        nth(screen.getAllByRole('button', { name: /remove role/i }), 0),
      )

      expect(screen.queryByText('First')).not.toBeInTheDocument()
      expect(screen.getByText('Second')).toBeInTheDocument()
      expect(screen.getByLabelText(/role name/i)).toHaveValue('Second')
    })
  })
})
