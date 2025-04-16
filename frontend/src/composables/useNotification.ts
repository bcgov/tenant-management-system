import { computed, reactive } from 'vue'

type Notification = {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

const state = reactive({
  notifications: [] as Notification[],
})

function addNotification(notification: Notification) {
  state.notifications.push(notification)
}

function removeNotification(id: string) {
  const index = state.notifications.findIndex(n => n.id === id)
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
