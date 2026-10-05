import { flushPromises, mount } from '@vue/test-utils'
import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'

import { makeServiceRole } from '@/__tests__/__factories__'

import ServiceRoleListCard from '@/components/service/ServiceRoleListCard.vue'

const vuetify = createVuetify()

const defaultProps = () => ({
  isDuplicateName: false,
  modelValue: makeServiceRole(),
})

const renderComponent = (props = {}) =>
  render(ServiceRoleListCard, {
    global: {
      plugins: [vuetify],
    },
    props: {
      ...defaultProps(),
      ...props,
    },
  })

const mountComponent = (props = {}) =>
  mount(ServiceRoleListCard, {
    attachTo: document.body,
    global: {
      plugins: [vuetify],
    },
    props: {
      ...defaultProps(),
      ...props,
    },
  })

describe('ServiceRoleListCard.vue', () => {
  describe('header', () => {
    it('renders the role name', () => {
      renderComponent({ modelValue: makeServiceRole({ name: 'Admin' }) })

      expect(screen.getByText('Admin')).toBeInTheDocument()
    })

    it('renders "New Role" when the name is empty', () => {
      renderComponent({ modelValue: makeServiceRole({ name: '' }) })

      expect(screen.getByText('New Role')).toBeInTheDocument()
    })

    it('shows Completed when all required fields are filled', () => {
      renderComponent()

      expect(screen.getByText(/completed/i)).toBeInTheDocument()
      expect(screen.queryByText(/incomplete/i)).not.toBeInTheDocument()
    })

    it('shows Incomplete when the description is missing', () => {
      renderComponent({ modelValue: makeServiceRole({ description: '' }) })

      expect(screen.getByText(/incomplete/i)).toBeInTheDocument()
      expect(screen.queryByText(/completed/i)).not.toBeInTheDocument()
    })

    it('shows Incomplete when no identity provider is selected', () => {
      renderComponent({
        modelValue: makeServiceRole({ identityProviders: [] }),
      })

      expect(screen.getByText(/incomplete/i)).toBeInTheDocument()
    })

    it('shows Incomplete when the name is a duplicate', () => {
      renderComponent({ isDuplicateName: true })

      expect(screen.getByText(/incomplete/i)).toBeInTheDocument()
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

      expect(screen.getByLabelText(/role name/i)).toHaveValue('Admin')
      expect(screen.getByLabelText(/description/i)).toHaveValue(
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

      await user.click(screen.getByRole('button', { name: /remove role/i }))

      expect(emitted()['remove-role']).toHaveLength(1)
    })

    it('emits update:modelValue when the name changes', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent({
        modelValue: makeServiceRole({ name: '' }),
      })

      await user.type(screen.getByLabelText(/role name/i), 'A')

      const events = emitted()['update:modelValue'] as unknown[][]
      expect(events.at(-1)?.[0]).toMatchObject({ name: 'A' })
    })

    it('emits update:modelValue when the description changes', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent({
        modelValue: makeServiceRole({ description: '' }),
      })

      await user.type(screen.getByLabelText(/description/i), 'B')

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

  describe('validate()', () => {
    it('returns true when the role is valid', async () => {
      const wrapper = mountComponent()

      expect(await wrapper.vm.validate()).toBe(true)

      wrapper.unmount()
    })

    it('returns false when required fields are empty', async () => {
      const wrapper = mountComponent({
        modelValue: makeServiceRole({
          description: '',
          identityProviders: [],
          name: '',
        }),
      })

      expect(await wrapper.vm.validate()).toBe(false)

      wrapper.unmount()
    })

    it('returns false when the name is a duplicate', async () => {
      const wrapper = mountComponent({ isDuplicateName: true })

      expect(await wrapper.vm.validate()).toBe(false)

      wrapper.unmount()
    })

    it('returns false when the name is only spaces', async () => {
      const wrapper = mountComponent({
        modelValue: makeServiceRole({ name: '   ' }),
      })

      expect(await wrapper.vm.validate()).toBe(false)

      wrapper.unmount()
    })

    it('displays errors after a failed validation', async () => {
      const wrapper = mountComponent({
        modelValue: makeServiceRole({ identityProviders: [] }),
      })

      await wrapper.vm.validate()
      await flushPromises()

      expect(wrapper.text()).toContain(
        'At least one identity provider is required',
      )

      wrapper.unmount()
    })

    it('expands a collapsed card when validation fails', async () => {
      const wrapper = mountComponent({
        modelValue: makeServiceRole({ name: '' }),
      })

      await wrapper.findAll('button')?.[1].trigger('click')
      await flushPromises()
      expect(wrapper.find('form').isVisible()).toBe(false)

      await wrapper.vm.validate()
      await flushPromises()

      expect(wrapper.find('form').isVisible()).toBe(true)

      wrapper.unmount()
    })
  })
})
