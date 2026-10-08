import { ref } from 'vue'

import { NotificationType } from '@/types/NotificationType'

/**
 * Reactive state container for managing notification items.
 */
interface SnackbarMessage {
  id: string
  text: string
  color: NotificationType
}

const messages = ref<SnackbarMessage[]>([])

/**
 * Adds a new notification to the system.
 *
 * @param text - The text content of the notification.
 * @param type - The notification type (SUCCESS, ERROR, WARNING, INFO). Defaults
 *   to SUCCESS.
 */
const addNotification = (
  text: string,
  color: NotificationType = NotificationType.SUCCESS,
) => {
  messages.value.push({ id: crypto.randomUUID(), text, color })
}

/**
 * Removes the current notification from the system.
 */
const dismiss = () => {
  messages.value.shift()
}

/**
 * Notification system API providing methods for displaying various types of
 * notifications.
 *
 * Features:
 * - Multiple notification types (success, error, warning, info)
 * - Manual removal capability
 */
export const notification = {
  /**
   * All current notification messages.
   *
   * @returns Array of active notification messages.
   */
  messages,

  /**
   * Manually remove a notification.
   */
  dismiss,

  /**
   * Display an error notification.
   *
   * @param message - The error message to display.
   */
  error: (message: string) => addNotification(message, NotificationType.ERROR),

  /**
   * Display an info notification.
   *
   * @param message - The informational message to display.
   */
  info: (message: string) => addNotification(message, NotificationType.INFO),

  /**
   * Display a success notification.
   *
   * @param message - The success message to display.
   */
  success: (message: string) =>
    addNotification(message, NotificationType.SUCCESS),

  /**
   * Display a warning notification.
   *
   * @param message - The warning message to display.
   */
  warning: (message: string) =>
    addNotification(message, NotificationType.WARNING),
}

/**
 * Composable hook for accessing the notification system.
 *
 * This function provides access to the notification API within Vue components,
 * following the composition API pattern.
 *
 * @returns The notification object with all available methods.
 */
export const useNotification = () => {
  return notification
}
