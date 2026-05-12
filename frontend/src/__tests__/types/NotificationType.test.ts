// These tests are intentionally minimal. NotificationType is a plain enum with
// no logic to unit test. They exist solely to maintain coverage and signal that
// the omission is deliberate.
import { describe, expect, it } from 'vitest'

import { NotificationType } from '@/types/NotificationType'

describe('NotificationType', () => {
  it('has the correct values', () => {
    expect(NotificationType.ERROR).toBe('error')
    expect(NotificationType.INFO).toBe('info')
    expect(NotificationType.SUCCESS).toBe('success')
    expect(NotificationType.WARNING).toBe('warning')
  })
})
