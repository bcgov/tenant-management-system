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
    if (error !== undefined) {
      console.error(message, error)
    } else {
      console.error(message)
    }
  }
}

/**
 * Logs an info message to the console (in non-production environments).
 *
 * @param message - A short description of what happened.
 */
const logInfo = (message: string) => {
  if (isDev) {
    console.log(message)
  }
}

/**
 * Logs a warning message to the console (in non-production environments).
 *
 * @param message - A short description of what went wrong.
 */
const logWarning = (message: string) => {
  if (isDev) {
    console.warn(message)
  }
}

export const logger = { error: logError, info: logInfo, warning: logWarning }
