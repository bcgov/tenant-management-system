import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SimpleDialog from '@/components/ui/SimpleDialog.vue'

const mountComponent = (props: {
  modelValue: boolean
  title?: string
  message?: string
  buttons?: { text: string; action: string; type?: 'primary' | 'secondary' }[]
  hasClose?: boolean
  dialogType?: string | null
  maxWidth?: number
}) =>
  mount(SimpleDialog, {
    props,
    slots: {
      default: '<div class="slotted">Slot Content</div>',
    },
    global: {
      stubs: {
        'v-dialog': {
          template:
            '<div :data-max-width="maxWidth"><button class="dialog-close" @click="$emit(\'update:modelValue\', false)" />  <slot /></div>',
          props: ['modelValue', 'maxWidth'],
          emits: ['update:modelValue'],
        },
        'v-card': { template: '<div><slot /></div>' },
        'v-card-title': { template: '<div><slot /></div>' },
        'v-card-text': { template: '<div><slot /></div>' },
        'v-card-actions': { template: '<div><slot /></div>' },
        'v-row': { template: '<div><slot /></div>' },
        'v-col': { template: '<div><slot /></div>' },
        'v-spacer': { template: '<div />' },
        'v-btn': {
          template: '<button @click="$emit(\'click\')"><slot /></button>',
        },
        'v-icon': {
          template: '<span class="icon" />',
          props: ['icon', 'color'],
        },
        ButtonPrimary: {
          template:
            '<button class="btn-primary" @click="$emit(\'click\')">{{ text }}</button>',
          props: ['text', 'disabled'],
          emits: ['click'],
        },
        ButtonSecondary: {
          template:
            '<button class="btn-secondary" @click="$emit(\'click\')">{{ text }}</button>',
          props: ['text', 'disabled'],
          emits: ['click'],
        },
      },
    },
  })

describe('DialogComponent.vue', () => {
  describe('title', () => {
    it('renders the title when provided', () => {
      const wrapper = mountComponent({ modelValue: true, title: 'My Title' })

      expect(wrapper.text()).toContain('My Title')
    })

    it('does not render the title section when not provided', () => {
      const wrapper = mountComponent({ modelValue: true })

      expect(wrapper.text()).not.toContain('My Title')
    })
  })

  describe('message', () => {
    it('renders the message when provided', () => {
      const wrapper = mountComponent({
        modelValue: true,
        message: 'My Message',
      })

      expect(wrapper.text()).toContain('My Message')
    })

    it('does not render the message div when not provided', () => {
      const wrapper = mountComponent({ modelValue: true })

      expect(wrapper.find('div[v-if]').exists()).toBe(false)
    })
  })

  describe('slot', () => {
    it('renders slot content', () => {
      const wrapper = mountComponent({ modelValue: true })

      expect(wrapper.find('.slotted').exists()).toBe(true)
    })
  })

  describe('maxWidth', () => {
    it('falls back to 500 when maxWidth is 0', () => {
      const wrapper = mountComponent({ modelValue: true, maxWidth: 0 })

      expect(
        wrapper.find('[data-max-width]').attributes('data-max-width'),
      ).toBe('500')
    })
  })

  describe('close button', () => {
    it('renders the close button when hasClose is true', () => {
      const wrapper = mountComponent({
        modelValue: true,
        title: 'Title',
        hasClose: true,
      })

      expect(wrapper.find('button').exists()).toBe(true)
    })

    it('emits update:modelValue with false when close button is clicked', async () => {
      const wrapper = mountComponent({
        modelValue: true,
        title: 'Title',
        hasClose: true,
      })

      await wrapper.find('button').trigger('click')

      expect(wrapper.emitted('update:modelValue')).toContainEqual([false])
    })

    it('emits update:modelValue when the dialog requests close', async () => {
      const wrapper = mountComponent({ modelValue: true })

      await wrapper.find('.dialog-close').trigger('click')

      expect(wrapper.emitted('update:modelValue')).toContainEqual([false])
    })
  })

  describe('dialogType icon', () => {
    it('renders an icon when dialogType is warning', () => {
      const wrapper = mountComponent({
        modelValue: true,
        title: 'Title',
        dialogType: 'warning',
      })

      expect(wrapper.find('.icon').exists()).toBe(true)
    })

    it('renders an icon when dialogType is error', () => {
      const wrapper = mountComponent({
        modelValue: true,
        title: 'Title',
        dialogType: 'error',
      })

      expect(wrapper.find('.icon').exists()).toBe(true)
    })

    it('renders an icon when dialogType is success', () => {
      const wrapper = mountComponent({
        modelValue: true,
        title: 'Title',
        dialogType: 'success',
      })

      expect(wrapper.find('.icon').exists()).toBe(true)
    })

    it('renders an icon when dialogType is an unknown value', () => {
      const wrapper = mountComponent({
        modelValue: true,
        title: 'Title',
        dialogType: 'info',
      })

      expect(wrapper.find('.icon').exists()).toBe(true)
    })

    it('does not render an icon when dialogType is null', () => {
      const wrapper = mountComponent({
        modelValue: true,
        title: 'Title',
        dialogType: null,
      })

      expect(wrapper.find('.icon').exists()).toBe(false)
    })
  })

  describe('buttons', () => {
    it('renders a primary button', () => {
      const wrapper = mountComponent({
        modelValue: true,
        buttons: [{ text: 'Confirm', action: 'confirm', type: 'primary' }],
      })

      expect(wrapper.find('.btn-primary').exists()).toBe(true)
      expect(wrapper.find('.btn-primary').text()).toContain('Confirm')
    })

    it('renders a secondary button', () => {
      const wrapper = mountComponent({
        modelValue: true,
        buttons: [{ text: 'Cancel', action: 'cancel', type: 'secondary' }],
      })

      expect(wrapper.find('.btn-secondary').exists()).toBe(true)
      expect(wrapper.find('.btn-secondary').text()).toContain('Cancel')
    })

    it('renders multiple buttons', () => {
      const wrapper = mountComponent({
        modelValue: true,
        buttons: [
          { text: 'Confirm', action: 'confirm', type: 'primary' },
          { text: 'Cancel', action: 'cancel', type: 'secondary' },
        ],
      })

      expect(wrapper.find('.btn-primary').exists()).toBe(true)
      expect(wrapper.find('.btn-secondary').exists()).toBe(true)
    })

    it('emits buttonClick with the action when a button is clicked', async () => {
      const wrapper = mountComponent({
        modelValue: true,
        buttons: [{ text: 'Confirm', action: 'confirm', type: 'primary' }],
      })

      await wrapper.find('.btn-primary').trigger('click')

      expect(wrapper.emitted('buttonClick')).toEqual([['confirm']])
    })

    it('emits update:modelValue with false when a button is clicked', async () => {
      const wrapper = mountComponent({
        modelValue: true,
        buttons: [{ text: 'Confirm', action: 'confirm', type: 'primary' }],
      })

      await wrapper.find('.btn-primary').trigger('click')

      expect(wrapper.emitted('update:modelValue')).toContainEqual([false])
    })

    it('renders no buttons when none are provided', () => {
      const wrapper = mountComponent({ modelValue: true })

      expect(wrapper.find('.btn-primary').exists()).toBe(false)
      expect(wrapper.find('.btn-secondary').exists()).toBe(false)
    })
  })
})
