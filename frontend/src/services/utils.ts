import axios, { AxiosError } from 'axios'

import { logger } from '@/utils/logger'

/**
 * Type guard to check if an error is a duplicate entity error (HTTP 409
 * Conflict).
 *
 * This function verifies that:
 * 1. The error is an Axios error with a response
 * 2. The response has HTTP status 409 (Conflict)
 * 3. The response data contains a message field that is a string
 *
 * @param error - The error object to check (typically from a try/catch block)
 * @returns True if the error is a duplicate entity error with the expected
 *   structure
 */
export const isDuplicateEntityError = (
  error: unknown,
): error is AxiosError & {
  response: { data: { message: string } }
} => {
  return (
    axios.isAxiosError(error) &&
    error.response?.status === 409 &&
    typeof error.response?.data?.message === 'string'
  )
}

/**
 * Type guard to check if an error is a validation error (HTTP 400 Bad Request).
 *
 * This function verifies that:
 * 1. The error is an Axios error with a response
 * 2. The response has HTTP status 400 (Bad Request)
 * 3. The response data contains validation details with a body array
 *
 * @param error - The error object to check (typically from a try/catch block)
 * @returns True if the error is a validation error with the expected structure
 */
export const isValidationError = (
  error: unknown,
): error is AxiosError & {
  response: {
    data: { details: { body: Array<{ field: string; message: string }> } }
  }
} => {
  return (
    axios.isAxiosError(error) &&
    error.response?.status === 400 &&
    Array.isArray(error.response?.data?.details?.body)
  )
}

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
