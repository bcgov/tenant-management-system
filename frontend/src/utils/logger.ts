/**
 * Development-only logger utility
 */
const isDev = process.env.NODE_ENV !== 'production'

/**
 * Logs an error message and optional error object to the console (in
 * non-production environments).
 *
 * @param message - A short description of what went wrong.
 * @param error - An optional error object for additional debugging context.
 */
const logError = (message: string, error?: unknown) => {
  if (isDev) {
    if (error === undefined) {
      console.error(message)
    } else {
      console.error(message, error)
    }
  }
}

/**
 * Logs a warning message to the console (in non-production environments).
 *
 * @param message - A short description of what went wrong.
 * @param error - An optional error object for additional debugging context.
 */
const logWarning = (message: string, error?: unknown) => {
  if (isDev) {
    if (error === undefined) {
      console.warn(message)
    } else {
      console.warn(message, error)
    }
  }
}

export const logger = { error: logError, warning: logWarning }
