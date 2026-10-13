import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import { VApp } from 'vuetify/components'
import * as directives from 'vuetify/directives'

import AppNotifications from '@/components/layout/AppNotifications.vue'
import { useNotification } from '@/composables/useNotification'

const vuetify = createVuetify({ components, directives })

const notification = useNotification()

const renderComponent = () =>
  render(
    { render: () => h(VApp, () => h(AppNotifications)) },
    { global: { plugins: [vuetify] } },
  )

describe('AppNotifications.vue', () => {
  beforeEach(() => {
    notification.messages.value = []
  })

  describe('rendering', () => {
    it('renders nothing when there are no notifications', () => {
      renderComponent()

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('renders the notification message in an alert', async () => {
      notification.success('messageSuccess')
      renderComponent()

      expect(await screen.findByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('messageSuccess')).toBeInTheDocument()
    })

    it('renders a notification added after mount', async () => {
      renderComponent()

      notification.error('messageError')

      expect(await screen.findByText('messageError')).toBeInTheDocument()
    })

    it('shows only the first notification when several are queued', async () => {
      notification.success('messageSuccess')
      notification.error('messageError')
      renderComponent()

      expect(await screen.findByText('messageSuccess')).toBeInTheDocument()
      expect(screen.queryByText('messageError')).not.toBeInTheDocument()
    })
  })

  describe('dismissal', () => {
    it('removes the notification when clicked', async () => {
      const user = userEvent.setup()
      notification.success('messageSuccess')
      renderComponent()

      await user.click(await screen.findByText('messageSuccess'))

      expect(notification.messages.value).toHaveLength(0)
      await waitFor(() => {
        expect(screen.queryByText('messageSuccess')).not.toBeInTheDocument()
      })
    })

    it('shows the next notification after the current one is dismissed', async () => {
      const user = userEvent.setup()
      notification.success('messageSuccess')
      notification.error('messageError')
      renderComponent()

      await user.click(await screen.findByText('messageSuccess'))

      expect(await screen.findByText('messageError')).toBeInTheDocument()
      expect(screen.queryByText('messageSuccess')).not.toBeInTheDocument()
      expect(notification.messages.value).toHaveLength(1)
    })

    describe('timeout', () => {
      beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true })
      })

      afterEach(() => {
        vi.useRealTimers()
      })

      it('dismisses the notification automatically after 6 seconds', async () => {
        notification.success('messageSuccess')
        renderComponent()
        await screen.findByText('messageSuccess')

        vi.advanceTimersByTime(6000)

        await waitFor(() => {
          expect(notification.messages.value).toHaveLength(0)
        })
      })

      it('does not dismiss the notification before 6 seconds', async () => {
        notification.success('messageSuccess')
        renderComponent()
        await screen.findByText('messageSuccess')

        vi.advanceTimersByTime(5000)

        expect(notification.messages.value).toHaveLength(1)
        expect(screen.getByText('messageSuccess')).toBeInTheDocument()
      })
    })
  })
})
