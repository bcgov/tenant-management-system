import { describe, expect, it } from 'vitest'

import { DomainError } from '@/errors/domain/DomainError'
import { ValidationError } from '@/errors/domain/ValidationError'

describe('ValidationError', () => {
  it('is an instance of Error', () => {
    const error = new ValidationError(['Field is required'])

    expect(error).toBeInstanceOf(Error)
  })

  it('is an instance of DomainError', () => {
    const error = new ValidationError(['Field is required'])

    expect(error).toBeInstanceOf(DomainError)
  })

  it('has the correct name', () => {
    const error = new ValidationError(['Field is required'])

    expect(error.name).toBe('ValidationError')
  })

  it('has the correct developer message', () => {
    const error = new ValidationError(['Field is required'])

    expect(error.message).toBe('Validation error')
  })

  it('joins a single validation message correctly', () => {
    const error = new ValidationError(['Field is required'])

    expect(error.userMessage).toBe(
      'Unexpected server response: Field is required',
    )
  })

  it('joins multiple validation messages with a semicolon', () => {
    const error = new ValidationError(['Field is required', 'Must be a number'])

    expect(error.userMessage).toBe(
      'Unexpected server response: Field is required; Must be a number',
    )
  })

  it('handles an empty array', () => {
    const error = new ValidationError([])

    expect(error.userMessage).toBe('Unexpected server response: ')
  })
})
