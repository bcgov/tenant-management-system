import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import GroupCreateDialog from '@/components/group/GroupCreateDialog.vue'

function makeVuetify() {
  return createVuetify({ components, directives })
}

function mountDialog(
  props: { isDuplicateName?: boolean; modelValue?: boolean } = {},
) {
  return mount(GroupCreateDialog, {
    props: { isDuplicateName: false, modelValue: true, ...props },
    global: { plugins: [makeVuetify()] },
  })
}

function getNameInput() {
  return document.body.querySelector('input[type="text"]') as HTMLInputElement
}

function getTextarea() {
  return document.body.querySelector('textarea') as HTMLTextAreaElement
}

function getCheckbox() {
  return document.body.querySelector(
    'input[type="checkbox"]',
  ) as HTMLInputElement
}

async function setName(value: string) {
  const el = getNameInput()
  el.value = value
  el.dispatchEvent(new Event('input'))
  await nextTick()
}

async function setDescription(value: string) {
  const el = getTextarea()
  el.value = value
  el.dispatchEvent(new Event('input'))
  await nextTick()
}

async function fillValidForm(name = 'My Group', description = 'A description') {
  await setName(name)
  await setDescription(description)
  await flushPromises()
}

async function clickSubmit(wrapper: ReturnType<typeof mountDialog>) {
  await wrapper.findComponent({ name: 'ButtonPrimary' }).trigger('click')
  await flushPromises()
}

let wrapper: ReturnType<typeof mountDialog>

afterEach(() => {
  wrapper.unmount()
})

describe('GroupCreateDialog', () => {
  describe('dialog visibility', () => {
    it('renders card content when modelValue is true', () => {
      wrapper = mountDialog({ modelValue: true })

      expect(
        document.body.querySelector('.v-card-title')?.textContent,
      ).toContain('Create a Group')
    })

    it('does not render card content when modelValue is false', () => {
      wrapper = mountDialog({ modelValue: false })

      expect(document.body.querySelector('.v-card-title')).toBeNull()
    })
  })

  describe('closing the dialog', () => {
    it('emits update:modelValue=false when the x icon button is clicked', async () => {
      wrapper = mountDialog()
      const btn = document.body.querySelector(
        '.v-card-title .v-btn',
      ) as HTMLElement

      btn.click()
      await nextTick()

      const emissions = wrapper.emitted('update:modelValue') as boolean[][]
      expect(emissions.at(-1)?.[0]).toBe(false)
    })

    it('does NOT close the dialog on a successful submit', async () => {
      wrapper = mountDialog()
      await fillValidForm()

      await clickSubmit(wrapper)

      expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })
  })

  describe('state reset on reopen', () => {
    it('clears name and description when dialog is reopened', async () => {
      wrapper = mountDialog()
      await fillValidForm('Old Name', 'Old description')
      await wrapper.setProps({ modelValue: false })
      await nextTick()

      await wrapper.setProps({ modelValue: true })
      await nextTick()

      expect(getNameInput().value).toBe('')
      expect(getTextarea().value).toBe('')
    })

    it('unchecks "Add me as a user" when dialog is reopened', async () => {
      wrapper = mountDialog()
      getCheckbox().click()
      await nextTick()
      await wrapper.setProps({ modelValue: false })
      await nextTick()

      await wrapper.setProps({ modelValue: true })
      await nextTick()

      expect(getCheckbox().checked).toBe(false)
    })

    it('resets form validity so empty form cannot be submitted after reopen', async () => {
      wrapper = mountDialog()
      await fillValidForm()
      await clickSubmit(wrapper)
      await wrapper.setProps({ modelValue: false })
      await nextTick()
      await wrapper.setProps({ modelValue: true })
      await nextTick()

      await clickSubmit(wrapper)

      expect((wrapper.emitted('submit') as unknown[][]).length).toBe(1)
    })
  })

  describe('required rule', () => {
    it('blocks submit when name is empty', async () => {
      wrapper = mountDialog()
      await fillValidForm('', 'Some description')

      await clickSubmit(wrapper)

      expect(wrapper.emitted('submit')).toBeFalsy()
    })

    it('blocks submit when name is only whitespace', async () => {
      wrapper = mountDialog()
      await fillValidForm('   ', 'Some description')

      await clickSubmit(wrapper)

      expect(wrapper.emitted('submit')).toBeFalsy()
    })

    it('blocks submit when description is empty', async () => {
      wrapper = mountDialog()
      await fillValidForm('My Group', '')

      await clickSubmit(wrapper)

      expect(wrapper.emitted('submit')).toBeFalsy()
    })

    it('blocks submit when description is only whitespace', async () => {
      wrapper = mountDialog()
      await fillValidForm('My Group', '   ')

      await clickSubmit(wrapper)

      expect(wrapper.emitted('submit')).toBeFalsy()
    })
  })

  describe('maxLength rule', () => {
    it('allows name of exactly 30 characters', async () => {
      wrapper = mountDialog()
      await fillValidForm('A'.repeat(30), 'Some description')

      await clickSubmit(wrapper)

      expect(wrapper.emitted('submit')).toBeTruthy()
    })

    it('blocks submit when name is 31 characters', async () => {
      wrapper = mountDialog()
      await fillValidForm('A'.repeat(31), 'Some description')

      await clickSubmit(wrapper)

      expect(wrapper.emitted('submit')).toBeFalsy()
    })

    it('allows description of exactly 500 characters', async () => {
      wrapper = mountDialog()
      await fillValidForm('My Group', 'B'.repeat(500))

      await clickSubmit(wrapper)

      expect(wrapper.emitted('submit')).toBeTruthy()
    })

    it('blocks submit when description is 501 characters', async () => {
      wrapper = mountDialog()
      await fillValidForm('My Group', 'B'.repeat(501))

      await clickSubmit(wrapper)

      expect(wrapper.emitted('submit')).toBeFalsy()
    })
  })

  describe('notDuplicated rule', () => {
    it('blocks submit when isDuplicateName is true', async () => {
      wrapper = mountDialog({ isDuplicateName: true })
      await fillValidForm()

      await clickSubmit(wrapper)

      expect(wrapper.emitted('submit')).toBeFalsy()
    })

    it('allows submit when isDuplicateName is false', async () => {
      wrapper = mountDialog({ isDuplicateName: false })
      await fillValidForm()

      await clickSubmit(wrapper)

      expect(wrapper.emitted('submit')).toBeTruthy()
    })
  })

  describe('submit payload', () => {
    it('emits submit with group fields and addUser=false by default', async () => {
      wrapper = mountDialog()
      await fillValidForm('My Group', 'A description')

      await clickSubmit(wrapper)

      const [[group, addUser]] = wrapper.emitted('submit') as [
        object,
        boolean,
      ][]
      expect(group).toEqual({ name: 'My Group', description: 'A description' })
      expect(addUser).toBe(false)
    })

    it('emits submit with addUser=true when checkbox is checked', async () => {
      wrapper = mountDialog()
      await fillValidForm()
      getCheckbox().click()
      await nextTick()

      await clickSubmit(wrapper)

      const [[, addUser]] = wrapper.emitted('submit') as [object, boolean][]
      expect(addUser).toBe(true)
    })

    it('trims whitespace from name before emitting', async () => {
      wrapper = mountDialog()
      await fillValidForm('  Trimmed  ', 'A description')

      await clickSubmit(wrapper)

      const [[group]] = wrapper.emitted('submit') as [
        { name: string; description: string },
        boolean,
      ][]
      expect(group.name).toBe('Trimmed')
    })

    it('trims whitespace from description before emitting', async () => {
      wrapper = mountDialog()
      await fillValidForm('My Group', '  Trimmed description  ')

      await clickSubmit(wrapper)

      const [[group]] = wrapper.emitted('submit') as [
        { name: string; description: string },
        boolean,
      ][]
      expect(group.description).toBe('Trimmed description')
    })
  })

  describe('watcher: isDuplicateName triggers revalidation', () => {
    it('calls form.validate() when isDuplicateName changes to true', async () => {
      wrapper = mountDialog({ isDuplicateName: false })
      const vm = wrapper.vm as unknown as {
        form: { validate: () => Promise<void> }
      }
      const validateSpy = vi.spyOn(vm.form, 'validate')

      await wrapper.setProps({ isDuplicateName: true })
      await flushPromises()

      expect(validateSpy).toHaveBeenCalledOnce()
    })

    it('calls form.validate() when isDuplicateName changes back to false', async () => {
      wrapper = mountDialog({ isDuplicateName: true })
      const vm = wrapper.vm as unknown as {
        form: { validate: () => Promise<void> }
      }
      const validateSpy = vi.spyOn(vm.form, 'validate')

      await wrapper.setProps({ isDuplicateName: false })
      await flushPromises()

      expect(validateSpy).toHaveBeenCalledOnce()
    })
  })

  describe('watcher: name change clears duplicate error', () => {
    it('emits clear-duplicate-error when name field changes', async () => {
      wrapper = mountDialog()

      await setName('New Name')
      await nextTick()

      expect(wrapper.emitted('clear-duplicate-error')).toBeTruthy()
    })

    it('emits clear-duplicate-error even when name is cleared', async () => {
      wrapper = mountDialog()
      await setName('Something')

      await setName('')
      await nextTick()

      const emissions = wrapper.emitted('clear-duplicate-error') as unknown[][]
      expect(emissions.length).toBeGreaterThanOrEqual(2)
    })

    it('does NOT emit clear-duplicate-error when only description changes', async () => {
      wrapper = mountDialog()
      const before = (wrapper.emitted('clear-duplicate-error') ?? []).length

      await setDescription('Changed description')
      await nextTick()

      expect((wrapper.emitted('clear-duplicate-error') ?? []).length).toBe(
        before,
      )
    })
  })
})
