import { reactive } from 'vue'
import type { Notification } from '@/types/Notification'
import type { NotificationType } from '@/types/NotificationType'

const state = reactive<{ notifications: Notification[] }>({
  notifications: [],
})

/**
 * Adds a new notification to the state.
 * @param {string} message - The message to display in the notification.
 * @param {string} [type='success'] - The type of notification ('success', 'error', 'info', etc.).
 */
const addNotification = (message: string, type: NotificationType = 'success') => {
  const id = Date.now()
  state.notifications.push({ id, message, type })
  setTimeout(() => {
    removeNotification(id)
  }, 3000)
}

/**
 * Removes a notification from the state by its ID.
 * @param {number} id - The ID of the notification to remove.
 */
const removeNotification = (id: number) => {
  const index = state.notifications.findIndex((notification) => notification.id === id)
  if (index !== -1) {
    state.notifications.splice(index, 1)
  }
}

export default {
  state,
  addNotification,
  removeNotification,
}
