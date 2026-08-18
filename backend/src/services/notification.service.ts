import logger from '../common/logger'
import { getErrorMessage } from '../common/error.handler'
import { chesService } from './ches.service'
import { config } from './config.service'

const TENANT_REQUEST_CREATED = 'tenant_request_created'
const TENANT_REQUEST_DECISIONED = 'tenant_request_decisioned'

export interface NotifiableTenantRequest {
  id?: string
  name?: string
  ministryName?: string
  description?: string
  status?: string
  rejectionReason?: string | null
  requestedAt?: Date | string
  decisionedAt?: Date | string
  requestedBy?: { displayName?: string; email?: string }
  decisionedBy?: { displayName?: string }
}

interface EmailDetail {
  label: string
  value: string
}

interface EmailContent {
  subject: string
  body: string
}

interface NotificationRequest {
  event: string
  tenantRequestId?: string
  recipient?: string
  email: EmailContent
}

function formatDate(value: Date | string | undefined): string {
  if (!value) {
    return 'Not recorded'
  }

  const isoString = value instanceof Date ? value.toISOString() : String(value)

  return isoString.split('T')[0]
}

function formatDetails(details: EmailDetail[]): string {
  return details.map(({ label, value }) => `${label}: ${value}`).join('\n')
}

function formatBody(paragraphs: string[]): string {
  return paragraphs.join('\n\n')
}

function getCstarUrl(path = ''): string {
  return `${config.appBaseUrl || ''}${path}`
}

export class NotificationService {
  public isEnabled(): boolean {
    return chesService.isConfigured()
  }

  private getDecisionedDetails(
    tenantRequest: NotifiableTenantRequest,
  ): EmailDetail[] {
    const details: EmailDetail[] = [
      { label: 'Tenant name', value: tenantRequest.name || '' },
      { label: 'Ministry name', value: tenantRequest.ministryName || '' },
      {
        label: 'Description',
        value: tenantRequest.description || 'Not provided',
      },
      { label: 'Status', value: tenantRequest.status || '' },
      {
        label: 'Decisioned by',
        value: tenantRequest.decisionedBy?.displayName || 'Unknown',
      },
      { label: 'Decisioned at', value: formatDate(tenantRequest.decisionedAt) },
    ]

    if (tenantRequest.rejectionReason) {
      details.push({ label: 'Reason', value: tenantRequest.rejectionReason })
    }

    return details
  }

  private buildTenantRequestCreatedEmail(
    tenantRequest: NotifiableTenantRequest,
  ): EmailContent {
    return {
      subject: `New CSTAR tenant request: ${tenantRequest.name}`,
      body: formatBody([
        'A new tenant request has been submitted in CSTAR and is awaiting a decision.',
        formatDetails([
          { label: 'Name', value: tenantRequest.name || '' },
          { label: 'Ministry name', value: tenantRequest.ministryName || '' },
          {
            label: 'Description',
            value: tenantRequest.description || 'Not provided',
          },
          {
            label: 'Requested by',
            value: tenantRequest.requestedBy?.displayName || 'Unknown',
          },
          {
            label: 'Requested at',
            value: formatDate(tenantRequest.requestedAt),
          },
        ]),
        `Review tenant requests in CSTAR:\n${getCstarUrl('/settings/requests')}`,
      ]),
    }
  }

  private buildTenantRequestDecisionedEmail(
    tenantRequest: NotifiableTenantRequest,
  ): EmailContent {
    const details = formatDetails(this.getDecisionedDetails(tenantRequest))

    if (tenantRequest.status === 'APPROVED') {
      return {
        subject: `Your CSTAR tenant request was approved: ${tenantRequest.name}`,
        body: formatBody([
          'Your CSTAR tenant request has been approved.',
          details,
          `Sign in to CSTAR to start setting up your tenant:\n${getCstarUrl()}`,
        ]),
      }
    }

    return {
      subject: `Your CSTAR tenant request was rejected: ${tenantRequest.name}`,
      body: formatBody([
        'Your CSTAR tenant request has been rejected.',
        details,
        `Sign in to CSTAR:\n${getCstarUrl()}`,
      ]),
    }
  }

  private skipNotification(
    notification: NotificationRequest,
    reason: string,
  ): void {
    logger.info(reason, {
      event: notification.event,
      tenantRequestId: notification.tenantRequestId,
    })
    logger.debug('Notification content', {
      event: notification.event,
      subject: notification.email.subject,
      body: notification.email.body,
    })
  }

  private logNotificationFailure(
    event: string,
    tenantRequest: NotifiableTenantRequest,
    error: unknown,
  ): void {
    logger.error('Notification failed', {
      event,
      tenantRequestId: tenantRequest?.id,
      tenantName: tenantRequest?.name,
      reason: getErrorMessage(error),
    })
  }

  private async sendNotification(notification: NotificationRequest) {
    if (!this.isEnabled()) {
      return this.skipNotification(
        notification,
        'Notification skipped - CHES is not configured',
      )
    }

    if (!notification.recipient) {
      return this.skipNotification(
        notification,
        'Notification skipped - no recipient',
      )
    }

    const result = await chesService.sendEmail({
      to: [notification.recipient],
      subject: notification.email.subject,
      body: notification.email.body,
    })

    logger.info('Notification sent', {
      event: notification.event,
      tenantRequestId: notification.tenantRequestId,
      msgId: result.msgId,
      txId: result.txId,
    })
  }

  public async notifyTenantRequestCreated(
    tenantRequest: NotifiableTenantRequest,
  ) {
    try {
      await this.sendNotification({
        event: TENANT_REQUEST_CREATED,
        tenantRequestId: tenantRequest.id,
        recipient: config.ches?.adminNotificationEmail,
        email: this.buildTenantRequestCreatedEmail(tenantRequest),
      })
    } catch (error: unknown) {
      this.logNotificationFailure(TENANT_REQUEST_CREATED, tenantRequest, error)
    }
  }

  public async notifyTenantRequestDecisioned(
    tenantRequest: NotifiableTenantRequest,
  ) {
    try {
      await this.sendNotification({
        event: TENANT_REQUEST_DECISIONED,
        tenantRequestId: tenantRequest.id,
        recipient: tenantRequest.requestedBy?.email,
        email: this.buildTenantRequestDecisionedEmail(tenantRequest),
      })
    } catch (error: unknown) {
      this.logNotificationFailure(
        TENANT_REQUEST_DECISIONED,
        tenantRequest,
        error,
      )
    }
  }
}

export const notificationService = new NotificationService()
