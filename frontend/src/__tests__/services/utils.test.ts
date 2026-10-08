import { beforeEach, describe, expect, it, vi } from 'vitest'

import { logger } from '@/utils/logger'

import { ApiError } from '@/services/api'
import {
  isDuplicateEntityError,
  isValidationError,
  logApiError,
} from '@/services/utils'

vi.mock('@/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

// Importing the real ApiError pulls in api.ts, so stub its dependencies.
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('@/services/config.service', () => ({
  config: { api: { baseUrl: 'https://api.example.com' } },
}))

describe('isDuplicateEntityError', () => {
  it('returns true for a well-formed 409 with a string message', () => {
    const error = new ApiError(409, { message: 'Entity already exists' })

    expect(isDuplicateEntityError(error)).toBe(true)
  })

  it('returns false when the error is not an ApiError', () => {
    expect(isDuplicateEntityError(new Error('generic'))).toBe(false)
  })

  it('returns false for a plain object that only looks like an ApiError', () => {
    const lookalike = { status: 409, data: { message: 'dup' } }

    expect(isDuplicateEntityError(lookalike)).toBe(false)
  })

  it('returns false for a non-409 status', () => {
    const error = new ApiError(500, { message: 'Server error' })

    expect(isDuplicateEntityError(error)).toBe(false)
  })

  it('returns false when message is missing from error data', () => {
    const error = new ApiError(409, {})

    expect(isDuplicateEntityError(error)).toBe(false)
  })

  it('returns false when message is not a string', () => {
    const error = new ApiError(409, { message: 42 })

    expect(isDuplicateEntityError(error)).toBe(false)
  })

  it('returns false when error data is null', () => {
    const error = new ApiError(409, null)

    expect(isDuplicateEntityError(error)).toBe(false)
  })
})

describe('isValidationError', () => {
  it('returns true for a well-formed 400 with a body array', () => {
    const error = new ApiError(400, {
      details: { body: [{ field: 'name', message: 'Required' }] },
    })

    expect(isValidationError(error)).toBe(true)
  })

  it('returns true for a 400 with an empty body array', () => {
    const error = new ApiError(400, { details: { body: [] } })

    expect(isValidationError(error)).toBe(true)
  })

  it('returns false when the error is not an ApiError', () => {
    expect(isValidationError(new Error('generic'))).toBe(false)
  })

  it('returns false for a plain object that only looks like an ApiError', () => {
    const lookalike = { status: 400, data: { details: { body: [] } } }

    expect(isValidationError(lookalike)).toBe(false)
  })

  it('returns false for a non-400 status', () => {
    const error = new ApiError(422, {
      details: { body: [{ field: 'name', message: 'Required' }] },
    })

    expect(isValidationError(error)).toBe(false)
  })

  it('returns false when details is missing from error data', () => {
    const error = new ApiError(400, {})

    expect(isValidationError(error)).toBe(false)
  })

  it('returns false when details is not an object', () => {
    const error = new ApiError(400, { details: 'not-an-object' })

    expect(isValidationError(error)).toBe(false)
  })

  it('returns false when details is null', () => {
    const error = new ApiError(400, { details: null })

    expect(isValidationError(error)).toBe(false)
  })

  it('returns false when body is not an array', () => {
    const error = new ApiError(400, { details: { body: 'not-an-array' } })

    expect(isValidationError(error)).toBe(false)
  })

  it('returns false when error data is null', () => {
    const error = new ApiError(400, null)

    expect(isValidationError(error)).toBe(false)
  })
})

describe('logApiError', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('logs a warning with the error message and object for a duplicate error', () => {
    const error = new ApiError(409, { message: 'dup' })

    logApiError('Failed to fetch', error)

    expect(logger.warning).toHaveBeenCalledExactlyOnceWith(
      'Failed to fetch: API error: 409',
      error,
    )
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('logs an error with the error message and object for other ApiErrors', () => {
    const error = new ApiError(500, { message: 'Server error' })

    logApiError('Failed to fetch', error)

    expect(logger.error).toHaveBeenCalledExactlyOnceWith(
      'Failed to fetch: API error: 500',
      error,
    )
    expect(logger.warning).not.toHaveBeenCalled()
  })

  it('logs an error for an ApiError with null data', () => {
    const error = new ApiError(502, null)

    logApiError('Failed to fetch', error)

    expect(logger.error).toHaveBeenCalledExactlyOnceWith(
      'Failed to fetch: API error: 502',
      error,
    )
  })

  it('logs only the message and error object for a non-ApiError', () => {
    const error = new Error('something broke')

    logApiError('Unexpected failure', error)

    expect(logger.error).toHaveBeenCalledExactlyOnceWith(
      'Unexpected failure',
      error,
    )
    expect(logger.warning).not.toHaveBeenCalled()
  })

  it('handles a non-Error value thrown as the error', () => {
    logApiError('Unknown error', 'just a string')

    expect(logger.error).toHaveBeenCalledExactlyOnceWith(
      'Unknown error',
      'just a string',
    )
  })
})
