import { describe, expect, it } from 'vitest'

import { DomainError } from '@/errors/domain/DomainError'
import { NotFoundError } from '@/errors/domain/NotFoundError'

describe('NotFoundError', () => {
  it('is an instance of Error', () => {
    const error = new NotFoundError('message', 'userMessage')

    expect(error).toBeInstanceOf(Error)
  })

  it('is an instance of DomainError', () => {
    const error = new NotFoundError('message', 'userMessage')

    expect(error).toBeInstanceOf(DomainError)
  })

  it('has the correct name', () => {
    const error = new NotFoundError('message', 'userMessage')

    expect(error.name).toBe('NotFoundError')
  })

  it('has the correct messages', () => {
    const error = new NotFoundError('message', 'userMessage')

    expect(error.message).toBe('message')
    expect(error.userMessage).toBe('userMessage')
  })
})
