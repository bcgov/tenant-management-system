import { describe, expect, it } from 'vitest'

import { SessionExpiredError } from '@/errors/SessionExpiredError'

describe('SessionExpiredError', () => {
  it('is an instance of Error', () => {
    expect(new SessionExpiredError()).toBeInstanceOf(Error)
  })

  it('has the correct message', () => {
    expect(new SessionExpiredError().message).toBe('Session Expired')
  })

  it('has the correct name', () => {
    expect(new SessionExpiredError().name).toBe('SessionExpiredError')
  })
})
