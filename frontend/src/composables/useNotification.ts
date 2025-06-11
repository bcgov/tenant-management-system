import { computed, reactive } from 'vue'
import { v4 as uuidv4 } from 'uuid'

import type { Notification, NotificationType } from '@/types'

const state = reactive<{ notifications: Notification[] }>({
  notifications: [],
})

function addNotification(message: string, type: NotificationType = 'success') {
  const id = uuidv4()
  const notification: Notification = { id, message, type }
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

export function useNotification() {
  return {
    notifications: computed(() => state.notifications),
    addNotification,
    removeNotification,
  }
}
