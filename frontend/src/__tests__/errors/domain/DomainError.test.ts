import { describe, expect, it } from 'vitest'

import { DomainError } from '@/errors/domain/DomainError'

describe('DomainError', () => {
  it('is an instance of Error', () => {
    const error = new DomainError('test')

    expect(error).toBeInstanceOf(Error)
  })

  it('has the correct message', () => {
    const error = new DomainError('dev message')

    expect(error.message).toBe('dev message')
  })

  it('has the correct name', () => {
    const error = new DomainError('test')

    expect(error.name).toBe('DomainError')
  })

  it('has no userMessage when not provided', () => {
    const error = new DomainError('test')

    expect(error.userMessage).toBeUndefined()
  })

  it('has the correct userMessage when provided', () => {
    const error = new DomainError('dev message', 'user message')

    expect(error.userMessage).toBe('user message')
  })

  it('instanceof works correctly for subclasses', () => {
    class SubError extends DomainError {}
    const error = new SubError('test')

    expect(error).toBeInstanceOf(SubError)
    expect(error).toBeInstanceOf(DomainError)
    expect(error).toBeInstanceOf(Error)
  })

  it('name reflects the subclass name', () => {
    class SubError extends DomainError {}
    const error = new SubError('test')

    expect(error.name).toBe('SubError')
  })
})
