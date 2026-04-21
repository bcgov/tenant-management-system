import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'

const vuetify = createVuetify({ components, directives })

describe('ButtonPrimary', () => {
  const mountComponent = (props = {}) => {
    return mount(ButtonPrimary, {
      props: { text: 'Click Me', ...props },
      global: { plugins: [vuetify] },
    })
  }

  it('renders the provided text', () => {
    const wrapper = mountComponent({ text: 'Submit' })
    expect(wrapper.text()).toContain('Submit')
  })

  it('emits click event when clicked and not disabled', async () => {
    const wrapper = mountComponent()
    const btn = wrapper.find('button')

    await btn.trigger('click')

    expect(wrapper.emitted()).toHaveProperty('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click event when disabled', async () => {
    const wrapper = mountComponent({ disabled: true })
    const btn = wrapper.find('button')
    expect(btn.element.disabled).toBe(true)

    await btn.trigger('click')

    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('applies the correct vuetify props', () => {
    const wrapper = mountComponent()
    const vBtn = wrapper.findComponent({ name: 'VBtn' })

    expect(vBtn.props('color')).toBe('primary')
    expect(vBtn.props('variant')).toBe('flat')
    expect(vBtn.classes()).toContain('cstar-button-primary')
  })
})
