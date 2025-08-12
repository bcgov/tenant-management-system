import { v4 as uuidv4 } from 'uuid'
import { reactive } from 'vue'

import { type Notification, NotificationType } from '@/types'

/**
 * Reactive state container for managing notification items
 */
const state = reactive<{ notifications: Notification[] }>({
  notifications: [],
})

/**
 * Adds a new notification to the system with auto-removal after 10 seconds
 *
 * @param title - The title/header text for the notification
 * @param message - The main message content of the notification
 * @param type - The notification type (SUCCESS, ERROR, WARNING, INFO). Defaults
 *   to SUCCESS
 */
function addNotification(
  title: string,
  message: string,
  type: NotificationType = NotificationType.SUCCESS,
) {
  const id = uuidv4()
  const notification: Notification = { id, title, message, type }
  state.notifications.push(notification)

  // Auto-remove notification after 10 seconds
  setTimeout(() => {
    removeNotification(id)
  }, 10000)
}

/**
 * Removes a notification from the system by its unique ID
 *
 * @param id - The unique identifier of the notification to remove
 */
function removeNotification(id: string) {
  const index = state.notifications.findIndex((n) => n.id === id)
  if (index !== -1) {
    state.notifications.splice(index, 1)
  }
}

/**
 * Notification system API providing methods for displaying various types of
 * notifications
 *
 * Features:
 * - Auto-removal after 10 seconds
 * - Multiple notification types (success, error, warning, info)
 * - Manual removal capability
 * - Reactive state management with Vue 3
 */
export const notification = {
  /**
   * Getter for accessing all current notifications
   *
   * @returns Array of active notification objects
   */
  get items() {
    return state.notifications
  },

  /**
   * Manually remove a notification by ID
   *
   * @param id - Unique identifier of the notification to remove
   */
  remove: removeNotification,

  /**
   * Display a success notification
   *
   * @param message - The success message to display
   * @param title - Optional title for the notification (defaults to 'Success')
   */
  success: (message: string, title: string = 'Success') =>
    addNotification(title, message, NotificationType.SUCCESS),

  /**
   * Display an error notification
   *
   * @param message - The error message to display
   * @param title - Optional title for the notification (defaults to 'Error')
   */
  error: (message: string, title: string = 'Error') =>
    addNotification(title, message, NotificationType.ERROR),

  /**
   * Display a warning notification
   *
   * @param message - The warning message to display
   * @param title - Optional title for the notification (defaults to 'Warning')
   */
  warning: (message: string, title: string = 'Warning') =>
    addNotification(title, message, NotificationType.WARNING),

  /**
   * Display an info notification
   *
   * @param message - The informational message to display
   * @param title - Optional title for the notification (defaults to 'Info')
   */
  info: (message: string, title: string = 'Info') =>
    addNotification(title, message, NotificationType.INFO),
}

/**
 * Vue 3 composable hook for accessing the notification system
 *
 * This function provides access to the notification API within Vue components,
 * following the composition API pattern.
 *
 * @returns The notification object with all available methods
 */
export function useNotification() {
  return notification
}
