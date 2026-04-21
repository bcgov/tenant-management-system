import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import FloatingActionButton from '@/components/ui/FloatingActionButton.vue'

const vuetify = createVuetify({ components, directives })

describe('FloatingActionButton', () => {
  const mountComponent = (props = {}) => {
    return mount(FloatingActionButton, {
      props: {
        text: 'Add Item',
        icon: 'mdi-plus',
        ...props,
      },
      global: { plugins: [vuetify] },
    })
  }

  it('renders the provided text', () => {
    const wrapper = mountComponent({ text: 'Create' })
    expect(wrapper.text()).toContain('Create')
  })

  it('passes the correct icon to the prepend-icon prop', () => {
    const wrapper = mountComponent({ icon: 'mdi-check' })
    const vBtn = wrapper.findComponent({ name: 'VBtn' })

    // Vuetify maps ':prepend-icon' to 'prependIcon' internally
    expect(vBtn.props('prependIcon')).toBe('mdi-check')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mountComponent()
    const btn = wrapper.find('button')

    await btn.trigger('click')

    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click when disabled', async () => {
    const wrapper = mountComponent({ disabled: true })
    const btn = wrapper.find('button')

    expect(btn.element.disabled).toBe(true)
    await btn.trigger('click')

    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('applies the correct styling props', () => {
    const wrapper = mountComponent()
    const vBtn = wrapper.findComponent({ name: 'VBtn' })

    expect(vBtn.props('color')).toBe('primary')
    expect(vBtn.props('size')).toBe('large')
    expect(vBtn.props('variant')).toBe('text')
    expect(vBtn.classes()).toContain('cstar-floating-action-button')
  })
})
