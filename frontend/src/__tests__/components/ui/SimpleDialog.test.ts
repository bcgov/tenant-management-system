import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import SimpleDialog from '@/components/ui/SimpleDialog.vue'

const vuetify = createVuetify({
  components,
  directives,
  defaults: {
    VDialog: {
      // Render the dialog content in place instead of teleporting to body. This
      // makes it easier to test dialog content without needing to query the
      // document body.
      attach: true,
    },
  },
})

const mountComponent = (props: {
  buttons?: { action: string; text: string; type?: 'primary' | 'secondary' }[]
  maxWidth?: number
  message?: string
  modelValue?: boolean
  title?: string
}) =>
  mount(SimpleDialog, {
    props: {
      message: 'My Message',
      modelValue: true,
      title: 'My Title',
      ...props,
    },
    slots: {
      default: '<div class="slotted">Slot Content</div>',
    },
    global: {
      plugins: [vuetify],
      stubs: {
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
  it('passes maxWidth to the dialog', () => {
    const wrapper = mountComponent({ modelValue: true, maxWidth: 300 })

    expect(wrapper.findComponent(components.VDialog).props('maxWidth')).toBe(
      300,
    )
  })

  it('falls back to 500 when maxWidth is 0', () => {
    const wrapper = mountComponent({ modelValue: true, maxWidth: 0 })

    expect(wrapper.findComponent(components.VDialog).props('maxWidth')).toBe(
      500,
    )
  })

  it('renders the message and title', () => {
    const wrapper = mountComponent({})

    expect(wrapper.find('[data-testid="title"]').text()).toBe('My Title')
    expect(wrapper.find('[data-testid="message"]').text()).toBe('My Message')
  })

  it('emits update:modelValue when dialog requests close', async () => {
    const wrapper = mountComponent({ modelValue: true })

    wrapper
      .findComponent(components.VDialog)
      .vm.$emit('update:modelValue', false)

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('renders slot content', () => {
    const wrapper = mountComponent({})

    expect(wrapper.find('[data-testid="slot"]').text()).toContain(
      'Slot Content',
    )
  })

  describe('buttons', () => {
    it('renders a primary button', () => {
      const wrapper = mountComponent({
        buttons: [{ text: 'Confirm', action: 'confirm', type: 'primary' }],
      })

      expect(wrapper.findAll('[data-testid^="button-"]')).toHaveLength(1)
      expect(wrapper.find('[data-testid="button-confirm"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="button-confirm"]').text()).toContain(
        'Confirm',
      )
    })

    it('renders a secondary button', () => {
      const wrapper = mountComponent({
        modelValue: true,
        buttons: [{ text: 'Cancel', action: 'cancel', type: 'secondary' }],
      })

      expect(wrapper.findAll('[data-testid^="button-"]')).toHaveLength(1)
      expect(wrapper.find('[data-testid="button-cancel"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="button-cancel"]').text()).toContain(
        'Cancel',
      )
    })

    it('renders multiple buttons', () => {
      const wrapper = mountComponent({
        modelValue: true,
        buttons: [
          { text: 'Confirm', action: 'confirm', type: 'primary' },
          { text: 'Cancel', action: 'cancel', type: 'secondary' },
        ],
      })

      expect(wrapper.findAll('[data-testid^="button-"]')).toHaveLength(2)
      expect(wrapper.find('[data-testid="button-cancel"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="button-confirm"]').exists()).toBe(true)
    })

    it('emits buttonClick with the action when a button is clicked', async () => {
      const wrapper = mountComponent({
        modelValue: true,
        buttons: [{ text: 'Confirm', action: 'confirm', type: 'primary' }],
      })

      await wrapper.find('[data-testid="button-confirm"]').trigger('click')

      expect(wrapper.findAll('[data-testid^="button-"]')).toHaveLength(1)
      expect(wrapper.emitted('buttonClick')).toEqual([['confirm']])
    })

    it('emits update:modelValue with false when a button is clicked', async () => {
      const wrapper = mountComponent({
        modelValue: true,
        buttons: [{ text: 'Confirm', action: 'confirm', type: 'primary' }],
      })

      await wrapper.find('[data-testid="button-confirm"]').trigger('click')

      expect(wrapper.findAll('[data-testid^="button-"]')).toHaveLength(1)
      expect(wrapper.emitted('update:modelValue')).toContainEqual([false])
    })

    it('renders no buttons when none are provided', () => {
      const wrapper = mountComponent({ modelValue: true })

      expect(wrapper.findAll('[data-testid^="button-"]')).toHaveLength(0)
    })
  })
})
