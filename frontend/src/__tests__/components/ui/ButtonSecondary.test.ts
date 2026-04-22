import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'

const vuetify = createVuetify({ components, directives })

describe('ButtonSecondary', () => {
  const mountComponent = (props = {}) => {
    return mount(ButtonSecondary, {
      props: { text: 'Click Me', ...props },
      global: { plugins: [vuetify] },
    })
  }

  it('renders the provided text', () => {
    const wrapper = mountComponent({ text: 'Submit' })

    expect(wrapper.text()).toContain('Submit')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mountComponent()
    const btn = wrapper.find('[data-test-id="button-secondary"]')

    await btn.trigger('click')

    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click event when disabled', async () => {
    const wrapper = mountComponent({ disabled: true })
    const btn = wrapper.find('[data-test-id="button-secondary"]')

    await btn.trigger('click')

    expect(wrapper.emitted('click')).toBeUndefined()
  })
})
