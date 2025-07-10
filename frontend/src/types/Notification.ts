import type { NotificationType } from './NotificationType'

export type Notification = {
  id: string
  title: string
  message: string
  type: NotificationType
}
