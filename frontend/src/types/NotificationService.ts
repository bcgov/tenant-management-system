import type { NotificationType } from "./NotificationType"

export type NotificationService = {
    addNotification: (message: string, type?: NotificationType) => void
}