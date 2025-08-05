import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useNotification } from '@/composables'
import { NotificationType } from '@/types'

vi.mock('uuid', () => ({
  v4: () => 'test-uuid-123',
}))

describe('useNotification', () => {
  let notification: ReturnType<typeof useNotification>

  beforeEach(() => {
    vi.useFakeTimers()

    notification = useNotification()
    notification.items.splice(0)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should add a success notification', () => {
    notification.success('Test message', 'Test title')

    expect(notification.items).toHaveLength(1)
    expect(notification.items[0]).toEqual({
      id: 'test-uuid-123',
      title: 'Test title',
      message: 'Test message',
      type: NotificationType.SUCCESS,
    })
  })

  it('should use default success title when not provided', () => {
    notification.success('Test success message')

    expect(notification.items).toHaveLength(1)
    expect(notification.items[0].title).toBe('Success')
    expect(notification.items[0].type).toBe(NotificationType.SUCCESS)
  })

  it('should use default info title when not provided', () => {
    notification.info('Test info message')

    expect(notification.items).toHaveLength(1)
    expect(notification.items[0].title).toBe('Info')
    expect(notification.items[0].type).toBe(NotificationType.INFO)
  })

  it('should use default warning title when not provided', () => {
    notification.warning('Test warning message')

    expect(notification.items).toHaveLength(1)
    expect(notification.items[0].title).toBe('Warning')
    expect(notification.items[0].type).toBe(NotificationType.WARNING)
  })

  it('should use default error title when not provided', () => {
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
