import { beforeEach, describe, expect, it } from 'vitest'

import { useNotification } from '@/composables/useNotification'
import { NotificationType } from '@/types/NotificationType'

describe('useNotification', () => {
  let notification: ReturnType<typeof useNotification>

  beforeEach(() => {
    notification = useNotification()
    notification.messages.value = []
  })

  it('success should add a success notification', () => {
    notification.success('Test message')

    expect(notification.messages.value).toHaveLength(1)
    expect(notification.messages.value[0].text).toBe('Test message')
    expect(notification.messages.value[0].color).toBe(NotificationType.SUCCESS)
  })

  it('info should add an info notification', () => {
    notification.info('Test message')

    expect(notification.messages.value).toHaveLength(1)
    expect(notification.messages.value[0].text).toBe('Test message')
    expect(notification.messages.value[0].color).toBe(NotificationType.INFO)
  })

  it('warning should add a warning notification', () => {
    notification.warning('Test message')

    expect(notification.messages.value).toHaveLength(1)
    expect(notification.messages.value[0].text).toBe('Test message')
    expect(notification.messages.value[0].color).toBe(NotificationType.WARNING)
  })

  it('error should add an error notification', () => {
    notification.error('Test message')

    expect(notification.messages.value).toHaveLength(1)
    expect(notification.messages.value[0].text).toBe('Test message')
    expect(notification.messages.value[0].color).toBe(NotificationType.ERROR)
  })

  it('should assign a unique id to each notification', () => {
    notification.info('First')
    notification.info('Second')

    const [first, second] = notification.messages.value

    expect(first.id).toEqual(expect.any(String))
    expect(second.id).toEqual(expect.any(String))
    expect(first.id).not.toBe(second.id)
  })

  it('should keep notifications in the order they were added', () => {
    notification.success('First')
    notification.error('Second')
    notification.warning('Third')

    expect(notification.messages.value.map((m) => m.text)).toEqual([
      'First',
      'Second',
      'Third',
    ])
  })

  it('dismiss should remove the oldest notification', () => {
    notification.success('First')
    notification.error('Second')

    notification.dismiss()

    expect(notification.messages.value).toHaveLength(1)
    expect(notification.messages.value[0].text).toBe('Second')
    expect(notification.messages.value[0].color).toBe(NotificationType.ERROR)
  })

  it('dismiss should empty the queue after dismissing every notification', () => {
    notification.success('First')
    notification.success('Second')

    notification.dismiss()
    notification.dismiss()

    expect(notification.messages.value).toHaveLength(0)
  })

  it('dismiss should not throw when there are no notifications', () => {
    expect(() => notification.dismiss()).not.toThrow()
    expect(notification.messages.value).toHaveLength(0)
  })

  it('should share state between multiple useNotification calls', () => {
    const other = useNotification()

    notification.info('Shared message')

    expect(other).toBe(notification)
    expect(other.messages.value).toHaveLength(1)
    expect(other.messages.value[0].text).toBe('Shared message')
  })
})
