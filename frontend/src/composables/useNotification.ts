import { v4 as uuidv4 } from 'uuid'
import { reactive } from 'vue'

import { type Notification, NotificationType } from '@/types'

const state = reactive<{ notifications: Notification[] }>({
  notifications: [],
})

function addNotification(
  title: string,
  message: string,
  type: NotificationType = NotificationType.SUCCESS,
) {
  const id = uuidv4()
  const notification: Notification = { id, title, message, type }
  state.notifications.push(notification)

  setTimeout(() => {
    removeNotification(id)
  }, 10000)
}

function removeNotification(id: string) {
  const index = state.notifications.findIndex((n) => n.id === id)
  if (index !== -1) {
    state.notifications.splice(index, 1)
  }
}

export const notification = {
  get items() {
    return state.notifications
  },

  remove: removeNotification,

  success: (message: string, title: string = 'Success') =>
    addNotification(title, message, NotificationType.SUCCESS),

  error: (message: string, title: string = 'Error') =>
    addNotification(title, message, NotificationType.ERROR),

  warning: (message: string, title: string = 'Warning') =>
    addNotification(title, message, NotificationType.WARNING),

  info: (message: string, title: string = 'Info') =>
    addNotification(title, message, NotificationType.INFO),
}

export function useNotification() {
  return {
    notification,
  }
}
