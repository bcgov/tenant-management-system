import type { App } from 'vue'

import { INJECTION_KEYS } from '@/utils/constants'

/**
 * Logs an error message to the console.
 * @param {string} error - The error message to log.
 */
const logError = (message: string, error?: unknown) => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    if (error instanceof Error) {
      console.error(message, error)
    } else if (error) {
      console.error(message + ': ' + error)
    } else {
      console.error(message)
    }
  }
}

/**
 * Logs a regular message to the console.
 * @param {string} message - The message to log.
 */
const logMessage = (message: string) => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log(message)
  }
}

/**
 * Logs a warning message to the console.
 * @param {string} message - The warning message to log.
 */
const logWarning = (message: string) => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn(message)
  }
}

export default {
  /**
   * Installs the plugin, adding global logging methods to the Vue instance.
   * @param {Object} app - The Vue app instance.
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
