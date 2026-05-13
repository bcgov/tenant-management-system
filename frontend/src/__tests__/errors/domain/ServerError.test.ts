import { describe, expect, it } from 'vitest'

import { DomainError } from '@/errors/domain/DomainError'
import { ServerError } from '@/errors/domain/ServerError'

describe('ServerError', () => {
  it('is an instance of Error', () => {
    const error = new ServerError()

    expect(error).toBeInstanceOf(Error)
  })

  it('is an instance of DomainError', () => {
    const error = new ServerError()

    expect(error).toBeInstanceOf(DomainError)
  })

  it('has the correct name', () => {
    const error = new ServerError()

    expect(error.name).toBe('ServerError')
  })

  it('has the correct developer message', () => {
    const error = new ServerError()

    expect(error.message).toBe('Server error')
  })

  it('has no userMessage when not provided', () => {
    const error = new ServerError()

    expect(error.userMessage).toBeUndefined()
  })

  it('has the correct userMessage when provided', () => {
    const error = new ServerError('Something went wrong on our end')

    expect(error.userMessage).toBe('Something went wrong on our end')
  })
})
