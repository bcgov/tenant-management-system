import type { App } from 'vue'

import { INJECTION_KEYS } from '@/utils/constants'

/**
 * Logs an error message and optional error object to the console (in
 * non-production environments).
 *
 * @param message - A short description of what went wrong.
 * @param error - An optional error object for additional debugging context.
 */
const logError = (message: string, error?: unknown) => {
  if (process.env.NODE_ENV !== 'production') {
    if (error !== undefined) {
      console.error(message, error)
    } else {
      console.error(message)
    }
  }
}

/**
 * Logs a regular message to the console (in non-production environments).
 *
 * @param message - A short description of what went wrong.
 */
const logMessage = (message: string) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(message)
  }
}

/**
 * Logs a warning message to the console (in non-production environments).
 *
 * @param message - A short description of what went wrong.
 */
const logWarning = (message: string) => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(message)
  }
}

export default {
  /**
   * Installs the plugin, adding global logging methods to the Vue instance.
   *
   * @param app - The Vue app instance.
   */
  install(app: App) {
    // TODO: this was Vue 2 code, remove if not needed
    // app.config.globalProperties.$error = logError
    // app.config.globalProperties.$log = logMessage
    // app.config.globalProperties.$warn = logWarning

    app.provide(INJECTION_KEYS.error, logError)
    app.provide(INJECTION_KEYS.log, logMessage)
    app.provide(INJECTION_KEYS.warn, logWarning)
  },
}

export { logError, logMessage, logWarning }
