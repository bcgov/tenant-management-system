import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useNotification } from '@/composables/useNotification'
import { NotificationType } from '@/types/NotificationType'

describe('useNotification', () => {
  let notification: ReturnType<typeof useNotification>

  beforeEach(() => {
    vi.useFakeTimers()

    // Directly mutate the notifications array to clear it before each test,
    // which isn't ideal but perhaps better than exporting a clear function that
    // is only used for testing.
    notification = useNotification()
    notification.items.splice(0)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('success should add a notification', () => {
    notification.success('Test message', 'Test title')

    expect(notification.items).toHaveLength(1)
    expect(notification.items[0].message).toBe('Test message')
    expect(notification.items[0].title).toBe('Test title')
    expect(notification.items[0].type).toBe(NotificationType.SUCCESS)
  })

  it('success should use default title when not provided', () => {
    notification.success('Test success message')

    expect(notification.items).toHaveLength(1)
    expect(notification.items[0].title).toBe('Success')
    expect(notification.items[0].type).toBe(NotificationType.SUCCESS)
  })

  it('info should use default title when not provided', () => {
    notification.info('Test info message')

    expect(notification.items).toHaveLength(1)
    expect(notification.items[0].title).toBe('Info')
    expect(notification.items[0].type).toBe(NotificationType.INFO)
  })

  it('warning should use default title when not provided', () => {
    notification.warning('Test warning message')

    expect(notification.items).toHaveLength(1)
    expect(notification.items[0].title).toBe('Warning')
    expect(notification.items[0].type).toBe(NotificationType.WARNING)
  })

  it('error should use default title when not provided', () => {
    notification.error('Test error message')

    expect(notification.items).toHaveLength(1)
    expect(notification.items[0].title).toBe('Error')
    expect(notification.items[0].type).toBe(NotificationType.ERROR)
  })

  it('should remove notification by id', () => {
    notification.info('Test message')
    const notificationId = notification.items[0].id

    notification.remove(notificationId)

    expect(notification.items).toHaveLength(0)
  })

  it('should handle removing a non-existent notification id gracefully', () => {
    notification.success('Test message')
    expect(notification.items).toHaveLength(1)

    notification.remove('non-existent-id')

    expect(notification.items).toHaveLength(1)
  })

  it('should auto-remove notification after 10 seconds', () => {
    notification.success('Test message')
    expect(notification.items).toHaveLength(1)

    vi.advanceTimersByTime(10000)

    expect(notification.items).toHaveLength(0)
  })

  it('should not auto-remove notification before 10 seconds', () => {
    notification.success('Test message')
    expect(notification.items).toHaveLength(1)

    vi.advanceTimersByTime(9000)

    expect(notification.items).toHaveLength(1)
  })
})
