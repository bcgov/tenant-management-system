import axios, { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { logger } from '@/utils/logger'

import {
  isDuplicateEntityError,
  isValidationError,
  logApiError,
} from '@/services/utils'

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>()
  return {
    ...actual,
    default: {
      ...actual.default,
      isAxiosError: vi.fn(),
    },
  }
})

vi.mock('@/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

const mockIsAxiosError = vi.mocked(axios.isAxiosError)

const makeAxiosError = (status: number, data: unknown): AxiosError =>
  ({
    response: { status, data },
  }) as unknown as AxiosError

describe('isDuplicateEntityError', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true for a well-formed 409 with a string message', () => {
    const error = makeAxiosError(409, { message: 'Entity already exists' })
    mockIsAxiosError.mockReturnValue(true)

    expect(isDuplicateEntityError(error)).toBe(true)
  })

  it('returns false when the error is not an Axios error', () => {
    mockIsAxiosError.mockReturnValue(false)

    expect(isDuplicateEntityError(new Error('generic'))).toBe(false)
  })

  it('returns false for a non-409 status', () => {
    const error = makeAxiosError(500, { message: 'Server error' })
    mockIsAxiosError.mockReturnValue(true)

    expect(isDuplicateEntityError(error)).toBe(false)
  })

  it('returns false when message is missing from response data', () => {
    const error = makeAxiosError(409, {})
    mockIsAxiosError.mockReturnValue(true)

    expect(isDuplicateEntityError(error)).toBe(false)
  })

  it('returns false when message is not a string', () => {
    const error = makeAxiosError(409, { message: 42 })
    mockIsAxiosError.mockReturnValue(true)

    expect(isDuplicateEntityError(error)).toBe(false)
  })

  it('returns false when response is undefined', () => {
    const error = { response: undefined } as unknown as AxiosError
    mockIsAxiosError.mockReturnValue(true)

    expect(isDuplicateEntityError(error)).toBe(false)
  })
})

describe('isValidationError', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true for a well-formed 400 with a body array', () => {
    const error = makeAxiosError(400, {
      details: { body: [{ field: 'name', message: 'Required' }] },
    })
    mockIsAxiosError.mockReturnValue(true)

    expect(isValidationError(error)).toBe(true)
  })

  it('returns true for a 400 with an empty body array', () => {
    const error = makeAxiosError(400, { details: { body: [] } })
    mockIsAxiosError.mockReturnValue(true)

    expect(isValidationError(error)).toBe(true)
  })

  it('returns false when the error is not an Axios error', () => {
    mockIsAxiosError.mockReturnValue(false)

    expect(isValidationError(new Error('generic'))).toBe(false)
  })

  it('returns false for a non-400 status', () => {
    const error = makeAxiosError(422, {
      details: { body: [{ field: 'name', message: 'Required' }] },
    })
    mockIsAxiosError.mockReturnValue(true)

    expect(isValidationError(error)).toBe(false)
  })

  it('returns false when details is missing from response data', () => {
    const error = makeAxiosError(400, {})
    mockIsAxiosError.mockReturnValue(true)

    expect(isValidationError(error)).toBe(false)
  })

  it('returns false when body is not an array', () => {
    const error = makeAxiosError(400, { details: { body: 'not-an-array' } })
    mockIsAxiosError.mockReturnValue(true)

    expect(isValidationError(error)).toBe(false)
  })

  it('returns false when response is undefined', () => {
    const error = { response: undefined } as unknown as AxiosError
    mockIsAxiosError.mockReturnValue(true)

    expect(isValidationError(error)).toBe(false)
  })
})

describe('logApiError', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('logs the axios warning message and object for a duplicate error', () => {
    const error = {
      ...makeAxiosError(409, { message: 'dup' }),
      message: 'dup',
    } as AxiosError
    mockIsAxiosError.mockReturnValue(true)

    logApiError('Failed to fetch', error)

    expect(logger.warning).toHaveBeenCalledExactlyOnceWith(
      'Failed to fetch: dup',
      error,
    )
  })

  it('logs the axios error message and error object for an Axios error', () => {
    const error = { message: 'Network Error' } as AxiosError
    mockIsAxiosError.mockReturnValue(true)

    logApiError('Failed to fetch', error)

    expect(logger.error).toHaveBeenCalledExactlyOnceWith(
      'Failed to fetch: Network Error',
      error,
    )
  })

  it('logs only the message and error object for a non-Axios error', () => {
    const error = new Error('something broke')
    mockIsAxiosError.mockReturnValue(false)

    logApiError('Unexpected failure', error)

    expect(logger.error).toHaveBeenCalledExactlyOnceWith(
      'Unexpected failure',
      error,
    )
  })

  it('handles a non-Error object thrown as the error', () => {
    mockIsAxiosError.mockReturnValue(false)

    logApiError('Unknown error', 'just a string')

    expect(logger.error).toHaveBeenCalledExactlyOnceWith(
      'Unknown error',
      'just a string',
    )
  })
})
