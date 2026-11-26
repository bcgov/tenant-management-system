import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'

import { makeServiceRole } from '@/__tests__/__factories__'

import ServiceRoleListCard from '@/components/service/ServiceRoleListCard.vue'

const vuetify = createVuetify()

const renderComponent = ({
  isDuplicateName = false,
  modelValue = makeServiceRole(),
} = {}) =>
  render(ServiceRoleListCard, {
    global: { plugins: [vuetify] },
    props: { isDuplicateName, modelValue },
  })

describe('ServiceRoleListCard.vue', () => {
  describe('header', () => {
    it('renders the role name', () => {
      renderComponent({ modelValue: makeServiceRole({ name: 'Admin' }) })

      expect(screen.getByText('Admin')).toBeInTheDocument()
    })

    it('renders "New role" when the name is empty', () => {
      renderComponent({ modelValue: makeServiceRole({ name: '' }) })

      expect(screen.getByText('New role')).toBeInTheDocument()
    })

    it('shows Completed when all required fields are filled', () => {
      renderComponent()

      expect(screen.getByText('Completed')).toBeInTheDocument()
      expect(screen.queryByText('- Incomplete')).not.toBeInTheDocument()
    })

    it('shows Incomplete when the description is missing', () => {
      renderComponent({ modelValue: makeServiceRole({ description: '' }) })

      expect(screen.getByText('- Incomplete')).toBeInTheDocument()
      expect(screen.queryByText('Completed')).not.toBeInTheDocument()
    })

    it('shows Incomplete when no identity provider is selected', () => {
      renderComponent({
        modelValue: makeServiceRole({ identityProviders: [] }),
      })

      expect(screen.getByText('- Incomplete')).toBeInTheDocument()
    })

    it('shows Incomplete when the name is a duplicate', () => {
      renderComponent({ isDuplicateName: true })

      expect(screen.getByText('- Incomplete')).toBeInTheDocument()
    })
  })

  describe('form fields', () => {
    it('renders the current field values', () => {
      renderComponent({
        modelValue: makeServiceRole({
          description: 'Does admin things',
          name: 'Admin',
        }),
      })

      expect(screen.getByLabelText(/Role name/)).toHaveValue('Admin')
      expect(screen.getByLabelText(/Description/)).toHaveValue(
        'Does admin things',
      )
    })

    it('checks the checkboxes for the selected identity providers', () => {
      renderComponent({
        modelValue: makeServiceRole({ identityProviders: ['bceidbusiness'] }),
      })

      expect(screen.getByRole('checkbox', { name: 'IDIR' })).not.toBeChecked()
      expect(
        screen.getByRole('checkbox', { name: 'Business BCeID' }),
      ).toBeChecked()
    })
  })

  describe('events', () => {
    it('emits remove-role when Remove Role is clicked', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      await user.click(screen.getByRole('button', { name: 'Remove role' }))

      expect(emitted()['remove-role']).toHaveLength(1)
    })

    it('emits update:modelValue when the name changes', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent({
        modelValue: makeServiceRole({ name: '' }),
      })

      await user.type(screen.getByLabelText(/Role name/), 'A')

      const events = emitted()['update:modelValue'] as unknown[][]
      expect(events.at(-1)?.[0]).toMatchObject({ name: 'A' })
    })

    it('emits update:modelValue when the description changes', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent({
        modelValue: makeServiceRole({ description: '' }),
      })

      await user.type(screen.getByLabelText(/Description/), 'B')

      const events = emitted()['update:modelValue'] as unknown[][]
      expect(events.at(-1)?.[0]).toMatchObject({ description: 'B' })
    })

    it('emits update:modelValue when an identity provider is toggled', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent({
        modelValue: makeServiceRole({ identityProviders: [] }),
      })

      await user.click(screen.getByRole('checkbox', { name: 'IDIR' }))

      const events = emitted()['update:modelValue'] as unknown[][]
      expect(events.at(-1)?.[0]).toMatchObject({ identityProviders: ['idir'] })
    })
  })

  describe('duplicate name', () => {
    it('shows an error when isDuplicateName becomes true', async () => {
      const { rerender } = renderComponent()

      await rerender({ isDuplicateName: true })

      expect(await screen.findByText('Name must be unique')).toBeInTheDocument()
    })
  })

  describe('identity providers', () => {
    it('checks every provider when Select all is clicked', async () => {
      const user = userEvent.setup()

      renderComponent({
        modelValue: makeServiceRole({ identityProviders: [] }),
      })
      await user.click(screen.getByRole('link', { name: 'Select all' }))

      expect(screen.getByRole('checkbox', { name: 'IDIR' })).toBeChecked()
      expect(
        screen.getByRole('checkbox', { name: 'Business BCeID' }),
      ).toBeChecked()
    })

    it('unchecks every provider when Clear all is clicked', async () => {
      const user = userEvent.setup()
      renderComponent({
        modelValue: makeServiceRole({
          identityProviders: ['idir', 'bceidbusiness'],
        }),
      })

      await user.click(screen.getByRole('link', { name: 'Clear all' }))

      expect(screen.getByRole('checkbox', { name: 'IDIR' })).not.toBeChecked()
      expect(
        screen.getByRole('checkbox', { name: 'Business BCeID' }),
      ).not.toBeChecked()
    })
  })

  describe('collapsing', () => {
    it('hides and shows the form when the toggle is clicked', async () => {
      const user = userEvent.setup()
      renderComponent()

      // The icon-only toggle is the second button, after Remove role
      const toggle = screen.getAllByRole('button')[1]

      await user.click(toggle)

      await waitFor(() => {
        expect(screen.getByLabelText(/Role name/)).not.toBeVisible()
      })

      await user.click(toggle)

      await waitFor(() => {
        expect(screen.getByLabelText(/Role name/)).toBeVisible()
      })
    })
  })

  describe('validation messages', () => {
    it('shows an error when the description is over 500 characters', async () => {
      const user = userEvent.setup()
      renderComponent({ modelValue: makeServiceRole({ description: '' }) })

      await user.click(screen.getByLabelText(/Description/))
      await user.paste('a'.repeat(501))

      expect(
        await screen.findByText('Must be 500 characters or less'),
      ).toBeInTheDocument()
    })
  })
})
