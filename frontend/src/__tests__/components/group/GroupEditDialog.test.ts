import userEvent from '@testing-library/user-event'
import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import { makeGroup } from '@/__tests__/__factories__'
import GroupEditDialog from '@/components/group/GroupEditDialog.vue'
import { type Group } from '@/models/group.model'

const vuetify = createVuetify({ components, directives })

type RenderProps = {
  group?: Group
  isDuplicateName?: boolean
  modelValue?: boolean
}

// group defaults to dummy factory data when a test doesn't care what's in
// it. Any test that asserts on name/description values must pass its own
// group built with those exact values - never rely on the factory's dummy
// output in an expect.
const renderComponent = ({
  group = makeGroup(),
  isDuplicateName = false,
  modelValue = true,
}: RenderProps = {}) => {
  return render(GroupEditDialog, {
    global: { plugins: [vuetify] },
    props: { group, isDuplicateName, modelValue },
  })
}

describe('GroupEditDialog', () => {
  describe('dialog visibility', () => {
    it('renders card content when modelValue is true', () => {
      renderComponent()

      expect(screen.getByText('Edit group details')).toBeInTheDocument()
    })

    it('does not render card content when modelValue is false', () => {
      renderComponent({ modelValue: false })

      expect(screen.queryByText('Edit group details')).not.toBeInTheDocument()
    })

    it('prefills the form with the group name and description', async () => {
      const group = makeGroup({
        name: 'groupName',
        description: 'groupDescription',
      })

      const { rerender } = renderComponent({ group, modelValue: false })
      await rerender({ group, isDuplicateName: false, modelValue: true })

      expect(screen.getByLabelText(/group name/i)).toHaveValue('groupName')
      expect(screen.getByLabelText(/group description/i)).toHaveValue(
        'groupDescription',
      )
    })
  })

  describe('closing the dialog', () => {
    it('does not emit update:modelValue on a successful submit', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      await user.click(screen.getByRole('button', { name: /save changes/i }))

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

      await fireEvent.update(
        screen.getByLabelText(/group name/i),
        'Updated Name',
      )

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(emitted('submit')).toBeFalsy()
    })

    it('closes via Cancel even if the current field values are invalid', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      await fireEvent.update(screen.getByLabelText(/group name/i), '')

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
    it('discards abandoned edits and re-prefills from the group prop', async () => {
      const group = makeGroup({
        name: 'Kept Name',
        description: 'Kept description',
      })
      const { rerender } = renderComponent({ group })

      await fireEvent.update(
        screen.getByLabelText(/group name/i),
        'Abandoned edit',
      )
      await fireEvent.update(
        screen.getByLabelText(/group description/i),
        'Abandoned description',
      )

      await rerender({ group, isDuplicateName: false, modelValue: false })
      await rerender({ group, isDuplicateName: false, modelValue: true })

      expect(screen.getByLabelText(/group name/i)).toHaveValue('Kept Name')
      expect(screen.getByLabelText(/group description/i)).toHaveValue(
        'Kept description',
      )
    })

    it('re-prefills from an updated group prop on reopen', async () => {
      const initialGroup = makeGroup({
        name: 'Initial Name',
        description: 'Initial description',
      })
      const updatedGroup = makeGroup({
        name: 'Renamed Group',
        description: 'New description',
      })
      const { rerender } = renderComponent({ group: initialGroup })

      await rerender({
        group: initialGroup,
        isDuplicateName: false,
        modelValue: false,
      })
      await rerender({
        group: updatedGroup,
        isDuplicateName: false,
        modelValue: true,
      })

      expect(screen.getByLabelText(/group name/i)).toHaveValue('Renamed Group')
      expect(screen.getByLabelText(/group description/i)).toHaveValue(
        'New description',
      )
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

      await user.click(screen.getByRole('button', { name: /save changes/i }))

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

      await user.click(screen.getByRole('button', { name: /save changes/i }))

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

      await user.click(screen.getByRole('button', { name: /save changes/i }))

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

      await user.click(screen.getByRole('button', { name: /save changes/i }))

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

      await user.click(screen.getByRole('button', { name: /save changes/i }))

      expect(emitted('submit')).toBeFalsy()
    })
  })

  describe('notDuplicated rule', () => {
    it('blocks submit when isDuplicateName is true', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent({ isDuplicateName: true })

      await fireEvent.update(
        screen.getByLabelText(/group name/i),
        'Renamed Group',
      )
      await fireEvent.update(
        screen.getByLabelText(/group description/i),
        'A description',
      )

      await user.click(screen.getByRole('button', { name: /save changes/i }))

      expect(emitted('submit')).toBeFalsy()
    })

    it('allows submit when isDuplicateName is false', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent({ isDuplicateName: false })

      await fireEvent.update(
        screen.getByLabelText(/group name/i),
        'Renamed Group',
      )
      await fireEvent.update(
        screen.getByLabelText(/group description/i),
        'A description',
      )

      await user.click(screen.getByRole('button', { name: /save changes/i }))

      expect(emitted('submit')).toBeTruthy()
    })
  })

  describe('submit payload', () => {
    it('emits submit with just the group fields, no addUser flag', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      await fireEvent.update(
        screen.getByLabelText(/group name/i),
        'Renamed Group',
      )
      await fireEvent.update(
        screen.getByLabelText(/group description/i),
        'Updated description',
      )

      await user.click(screen.getByRole('button', { name: /save changes/i }))

      const [emission] = emitted('submit') as [unknown][]
      expect(emission).toHaveLength(1)
      expect(emission[0]).toEqual({
        name: 'Renamed Group',
        description: 'Updated description',
      })
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

      await user.click(screen.getByRole('button', { name: /save changes/i }))

      const [[group]] = emitted('submit') as [{ name: string }][]
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

      await user.click(screen.getByRole('button', { name: /save changes/i }))

      const [[group]] = emitted('submit') as [{ description: string }][]
      expect(group.description).toBe('Trimmed description')
    })
  })

  describe('watcher: isDuplicateName triggers revalidation', () => {
    it('surfaces the duplicate-name error as soon as isDuplicateName becomes true', async () => {
      const { rerender } = renderComponent()

      expect(
        screen.queryByText(/this name is already in use/i),
      ).not.toBeInTheDocument()

      await rerender({ isDuplicateName: true })

      expect(
        await screen.findByText(/this name is already in use/i),
      ).toBeInTheDocument()
    })

    it('allows submission again once isDuplicateName changes back to false', async () => {
      const user = userEvent.setup()
      const { rerender, emitted } = renderComponent({
        isDuplicateName: true,
      })

      await user.click(screen.getByRole('button', { name: /save changes/i }))
      expect(emitted('submit')).toBeFalsy()

      await rerender({ isDuplicateName: false })

      await fireEvent.update(screen.getByLabelText(/group name/i), 'groupName2')

      await user.click(screen.getByRole('button', { name: /save changes/i }))

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
