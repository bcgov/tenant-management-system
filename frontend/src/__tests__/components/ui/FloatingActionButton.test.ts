import { mdiArrowLeft } from '@mdi/js'
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
        icon: mdiArrowLeft,
        text: 'Add Item',
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
    const wrapper = mountComponent({ icon: mdiArrowLeft })

    const vBtn = wrapper.findComponent({ name: 'VBtn' })
    expect(vBtn.props('prependIcon')).toBe(mdiArrowLeft)
  })

  it('emits click event when clicked', async () => {
    const wrapper = mountComponent()
    const btn = wrapper.find('[data-test-id="floating-action-button"]')

    await btn.trigger('click')

    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click event when disabled', async () => {
    const wrapper = mountComponent({ disabled: true })
    const btn = wrapper.find('[data-test-id="floating-action-button"]')

    await btn.trigger('click')

    expect(wrapper.emitted('click')).toBeUndefined()
  })
})
