import userEvent from '@testing-library/user-event'
import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import GroupCreateDialog from '@/components/group/GroupCreateDialog.vue'

const vuetify = createVuetify({ components, directives })

const defaultProps = {
  isDuplicateName: false,
  modelValue: true,
}

const renderComponent = (props = defaultProps) => {
  return render(GroupCreateDialog, {
    global: { plugins: [vuetify] },
    props,
  })
}

describe('GroupCreateDialog', () => {
  describe('dialog visibility', () => {
    it('renders card content when modelValue is true', () => {
      renderComponent()

      expect(screen.getByText('Create a Group')).toBeInTheDocument()
    })

    it('does not render card content when modelValue is false', () => {
      renderComponent({ ...defaultProps, modelValue: false })

      expect(screen.queryByText('Create a Group')).not.toBeInTheDocument()
    })
  })

  describe('closing the dialog', () => {
    // The dialog never closes itself — it emits update:modelValue and lets
    // the parent decide, so these assert on the emit rather than the DOM.
    it('does not emit update:modelValue on a successful submit', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      await fireEvent.update(screen.getByLabelText(/group name/i), 'My Group')
      await fireEvent.update(
        screen.getByLabelText(/group description/i),
        'A description',
      )

      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(emitted('update:modelValue')).toBeFalsy()
    })

    it('emits update:modelValue(false) when Cancel is clicked', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(emitted('update:modelValue')).toEqual([[false]])
    })

    it('does not emit submit when Cancel is clicked, even with a valid form', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      await fireEvent.update(screen.getByLabelText(/group name/i), 'My Group')
      await fireEvent.update(
        screen.getByLabelText(/group description/i),
        'A description',
      )

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(emitted('submit')).toBeFalsy()
    })

    it('closes via Cancel without the form needing to be valid', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()
      // form is left empty on purpose

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(emitted('update:modelValue')).toEqual([[false]])
    })

    it('emits update:modelValue when the dialog is closed with Escape', async () => {
      const { emitted } = renderComponent()

      await fireEvent.keyDown(document, { key: 'Escape' })

      await waitFor(() => {
        expect(emitted('update:modelValue')).toEqual([[false]])
      })
    })
  })

  describe('state reset on reopen', () => {
    it('clears name and description when the dialog is reopened', async () => {
      const { rerender } = renderComponent()

      await fireEvent.update(screen.getByLabelText(/group name/i), 'Old Name')
      await fireEvent.update(
        screen.getByLabelText(/group description/i),
        'Old description',
      )

      await rerender({ ...defaultProps, modelValue: false })
      await rerender({ ...defaultProps, modelValue: true })

      expect(screen.getByLabelText(/group name/i)).toHaveValue('')
      expect(screen.getByLabelText(/group description/i)).toHaveValue('')
    })

    it('unchecks "Add me as a user" when the dialog is reopened', async () => {
      const user = userEvent.setup()
      const { rerender } = renderComponent()

      await user.click(screen.getByLabelText(/add me as a user to this group/i))
      expect(
        screen.getByLabelText(/add me as a user to this group/i),
      ).toBeChecked()

      await rerender({ ...defaultProps, modelValue: false })
      await rerender({ ...defaultProps, modelValue: true })

      expect(
        screen.getByLabelText(/add me as a user to this group/i),
      ).not.toBeChecked()
    })

    it('resets form validity so an empty form cannot be submitted after reopen', async () => {
      const user = userEvent.setup()
      const { rerender, emitted } = renderComponent()

      await fireEvent.update(screen.getByLabelText(/group name/i), 'My Group')
      await fireEvent.update(
        screen.getByLabelText(/group description/i),
        'A description',
      )
      await user.click(screen.getByRole('button', { name: /submit/i }))
      await rerender({ ...defaultProps, modelValue: false })
      await rerender({ ...defaultProps, modelValue: true })

      // Reopened with a blank form, so this click should be blocked by
      // validation, leaving only the earlier successful submit.
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(emitted('submit')).toHaveLength(1)
    })
  })

  describe('required rule', () => {
    it.each([
      ['name is empty', '', 'Some description'],
      ['name is only whitespace', '   ', 'Some description'],
      ['description is empty', 'My Group', ''],
      ['description is only whitespace', 'My Group', '   '],
    ])('blocks submit when %s', async (_case, name, description) => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      await fireEvent.update(screen.getByLabelText(/group name/i), name)
      await fireEvent.update(
        screen.getByLabelText(/group description/i),
        description,
      )

      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(emitted('submit')).toBeFalsy()
    })
  })

  describe('maxLength rule', () => {
    it('allows a name of exactly 150 characters', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      await fireEvent.update(
        screen.getByLabelText(/group name/i),
        'A'.repeat(150),
      )
      await fireEvent.update(
        screen.getByLabelText(/group description/i),
        'Some description',
      )

      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(emitted('submit')).toBeTruthy()
    })

    it('blocks submit when name is 151 characters', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      await fireEvent.update(
        screen.getByLabelText(/group name/i),
        'A'.repeat(151),
      )
      await fireEvent.update(
        screen.getByLabelText(/group description/i),
        'Some description',
      )

      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(emitted('submit')).toBeFalsy()
    })

    it('allows a description of exactly 500 characters', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      await fireEvent.update(screen.getByLabelText(/group name/i), 'My Group')
      await fireEvent.update(
        screen.getByLabelText(/group description/i),
        'B'.repeat(500),
      )

      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(emitted('submit')).toBeTruthy()
    })

    it('blocks submit when description is 501 characters', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      await fireEvent.update(screen.getByLabelText(/group name/i), 'My Group')
      await fireEvent.update(
        screen.getByLabelText(/group description/i),
        'B'.repeat(501),
      )

      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(emitted('submit')).toBeFalsy()
    })
  })

  describe('notDuplicated rule', () => {
    it('blocks submit when isDuplicateName is true', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent({
        ...defaultProps,
        isDuplicateName: true,
      })

      await fireEvent.update(screen.getByLabelText(/group name/i), 'My Group')
      await fireEvent.update(
        screen.getByLabelText(/group description/i),
        'A description',
      )

      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(emitted('submit')).toBeFalsy()
    })

    it('allows submit when isDuplicateName is false', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      await fireEvent.update(screen.getByLabelText(/group name/i), 'My Group')
      await fireEvent.update(
        screen.getByLabelText(/group description/i),
        'A description',
      )

      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(emitted('submit')).toBeTruthy()
    })
  })

  describe('submit payload', () => {
    it('emits submit with the group fields and addUser=false by default', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      await fireEvent.update(screen.getByLabelText(/group name/i), 'My Group')
      await fireEvent.update(
        screen.getByLabelText(/group description/i),
        'A description',
      )

      await user.click(screen.getByRole('button', { name: /submit/i }))

      const [[group, addUser]] = emitted('submit') as [object, boolean][]
      expect(group).toEqual({ name: 'My Group', description: 'A description' })
      expect(addUser).toBe(false)
    })

    it('emits submit with addUser=true when the checkbox is checked', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      await fireEvent.update(screen.getByLabelText(/group name/i), 'My Group')
      await fireEvent.update(
        screen.getByLabelText(/group description/i),
        'A description',
      )
      await user.click(screen.getByLabelText(/add me as a user to this group/i))

      await user.click(screen.getByRole('button', { name: /submit/i }))

      const [[, addUser]] = emitted('submit') as [object, boolean][]
      expect(addUser).toBe(true)
    })

    it('trims whitespace from the name before emitting', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      await fireEvent.update(
        screen.getByLabelText(/group name/i),
        '  Trimmed  ',
      )
      await fireEvent.update(
        screen.getByLabelText(/group description/i),
        'A description',
      )

      await user.click(screen.getByRole('button', { name: /submit/i }))

      const [[group]] = emitted('submit') as [{ name: string }, boolean][]
      expect(group.name).toBe('Trimmed')
    })

    it('trims whitespace from the description before emitting', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      await fireEvent.update(screen.getByLabelText(/group name/i), 'My Group')
      await fireEvent.update(
        screen.getByLabelText(/group description/i),
        '  Trimmed description  ',
      )

      await user.click(screen.getByRole('button', { name: /submit/i }))

      const [[group]] = emitted('submit') as [
        { description: string },
        boolean,
      ][]
      expect(group.description).toBe('Trimmed description')
    })
  })

  describe('watcher: isDuplicateName triggers revalidation', () => {
    it('surfaces the duplicate-name error as soon as isDuplicateName becomes true', async () => {
      const { rerender } = renderComponent()

      await fireEvent.update(screen.getByLabelText(/group name/i), 'My Group')
      await fireEvent.update(
        screen.getByLabelText(/group description/i),
        'A description',
      )
      expect(
        screen.queryByText(/this name is already in use/i),
      ).not.toBeInTheDocument()

      await rerender({ ...defaultProps, isDuplicateName: true })

      expect(
        await screen.findByText(/this name is already in use/i),
      ).toBeInTheDocument()
    })

    it('allows submission again once isDuplicateName changes back to false', async () => {
      const user = userEvent.setup()
      const { rerender, emitted } = renderComponent({
        ...defaultProps,
        isDuplicateName: true,
      })

      await fireEvent.update(screen.getByLabelText(/group name/i), 'My Group')
      await fireEvent.update(
        screen.getByLabelText(/group description/i),
        'A description',
      )
      await user.click(screen.getByRole('button', { name: /submit/i }))
      expect(emitted('submit')).toBeFalsy()

      await rerender({ ...defaultProps, isDuplicateName: false })

      await fireEvent.update(
        screen.getByLabelText(/group name/i),
        'A Different Group',
      )

      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(emitted('submit')).toBeTruthy()
    })
  })

  describe('watcher: name change clears duplicate error', () => {
    it('emits clear-duplicate-error when the name field changes', async () => {
      const { emitted } = renderComponent()

      await fireEvent.update(screen.getByLabelText(/group name/i), 'New Name')

      expect(emitted('clear-duplicate-error')).toBeTruthy()
    })

    it('emits clear-duplicate-error even when the name is cleared', async () => {
      const { emitted } = renderComponent()

      await fireEvent.update(screen.getByLabelText(/group name/i), 'Something')

      await fireEvent.update(screen.getByLabelText(/group name/i), '')

      expect(emitted('clear-duplicate-error')).toHaveLength(2)
    })

    it('does not emit clear-duplicate-error when only the description changes', async () => {
      const { emitted } = renderComponent()
      const before = (emitted('clear-duplicate-error') ?? []).length

      await fireEvent.update(
        screen.getByLabelText(/group description/i),
        'Changed description',
      )

      expect(emitted('clear-duplicate-error') ?? []).toHaveLength(before)
    })
  })
})
