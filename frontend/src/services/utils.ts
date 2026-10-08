import { ApiError } from '@/services/api'
import { logger } from '@/utils/logger'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/**
 * Type guard to check if an error is a duplicate entity error (HTTP 409
 * Conflict).
 *
 * This function verifies that:
 * 1. The error is an ApiError
 * 2. The error has HTTP status 409 (Conflict)
 * 3. The error data contains a message field that is a string
 *
 * @param error - The error object to check (typically from a try/catch block)
 * @returns True if the error is a duplicate entity error with the expected
 *   structure
 */
export const isDuplicateEntityError = (
  error: unknown,
): error is ApiError & { data: { message: string } } => {
  return (
    error instanceof ApiError &&
    error.status === 409 &&
    typeof error.data?.message === 'string'
  )
}

/**
 * Type guard to check if an error is a validation error (HTTP 400 Bad Request).
 *
 * This function verifies that:
 * 1. The error is an ApiError
 * 2. The error has HTTP status 400 (Bad Request)
 * 3. The error data contains validation details with a body array
 *
 * @param error - The error object to check (typically from a try/catch block)
 * @returns True if the error is a validation error with the expected structure
 */
export const isValidationError = (
  error: unknown,
): error is ApiError & {
  data: { details: { body: Array<{ field: string; message: string }> } }
} => {
  return (
    error instanceof ApiError &&
    error.status === 400 &&
    isRecord(error.data?.details) &&
    Array.isArray(error.data.details.body)
  )
}

/**
 * Logs an API error with a custom message.
 *
 * API errors must always, always, always be logged for debugging. It might end
 * up being logged twice, but be defensive in case something swallows the Error.
 *
 * @param message - A descriptive message to include in the log.
 * @param cause - The error object caught from an API call or other source.
 */
export const logApiError = (message: string, cause: unknown) => {
  if (isDuplicateEntityError(cause)) {
    logger.warning(`${message}: ${cause.message}`, cause)
  } else if (cause instanceof ApiError) {
    logger.error(`${message}: ${cause.message}`, cause)
  } else {
    logger.error(message, cause)
  }
}
