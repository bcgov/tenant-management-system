import axios from 'axios'

import { logger } from '@/utils/logger'

/**
 * Logs an API error with a custom message.
 *
 * Differentiates between Axios errors and other error types for better logging
 *   detail.
 *
 * @param {string} message - A descriptive message to include in the log.
 * @param {unknown} error - The error object caught from an API call or other
 *   source.
 */
export const logApiError = (message: string, error: unknown) => {
  if (axios.isAxiosError(error)) {
    logger.error(`${message}: ${error.message}`, error)
  } else {
    logger.error(message, error)
  }
}
