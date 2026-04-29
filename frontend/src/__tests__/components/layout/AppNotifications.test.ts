import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import AppNotifications from '@/components/layout/AppNotifications.vue'
import { useNotification } from '@/composables/useNotification'

const vuetify = createVuetify({ components, directives })
const notification = useNotification()

const mountComponent = () =>
  mount(AppNotifications, {
    global: { plugins: [vuetify] },
  })

describe('AppNotifications.vue', () => {
  beforeEach(() => {
    while (notification.items.length > 0) {
      notification.remove(notification.items[0].id)
    }
  })

  describe('rendering', () => {
    it('renders nothing when there are no notifications', () => {
      const wrapper = mountComponent()

      expect(wrapper.findAll('[role="alert"]').length).toBe(0)
    })

    it('renders an alert for each notification', () => {
      notification.success('It worked')
      notification.error('It failed')
      const wrapper = mountComponent()

      expect(wrapper.findAll('[role="alert"]').length).toBe(2)
    })

    it('renders the notification message', () => {
      notification.success('Hello there')
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('Hello there')
    })
  })

  describe('dismissal', () => {
    it('calls remove with the notification id when clicked', async () => {
      notification.success('It worked')
      const wrapper = mountComponent()

      await wrapper.find('[role="alert"]').trigger('click')

      expect(notification.items.length).toBe(0)
    })
  })
})
