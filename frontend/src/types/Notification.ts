import type { NotificationType } from '@/types/NotificationType'

export type Notification = {
  id: number
  message: string
  type: NotificationType
}
