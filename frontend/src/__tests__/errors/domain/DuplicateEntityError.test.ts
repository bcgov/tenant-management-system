import { describe, expect, it } from 'vitest'

import { DomainError } from '@/errors/domain/DomainError'
import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'

describe('DuplicateEntityError', () => {
  it('is an instance of Error', () => {
    const error = new DuplicateEntityError()

    expect(error).toBeInstanceOf(Error)
  })

  it('is an instance of DomainError', () => {
    const error = new DuplicateEntityError()

    expect(error).toBeInstanceOf(DomainError)
  })

  it('has the correct name', () => {
    const error = new DuplicateEntityError()

    expect(error.name).toBe('DuplicateEntityError')
  })

  it('has the correct developer message', () => {
    const error = new DuplicateEntityError()

    expect(error.message).toBe('Duplicate entity error')
  })

  it('has no userMessage when not provided', () => {
    const error = new DuplicateEntityError()

    expect(error.userMessage).toBeUndefined()
  })

  it('has the correct userMessage when provided', () => {
    const error = new DuplicateEntityError('That already exists')

    expect(error.userMessage).toBe('That already exists')
  })
})
