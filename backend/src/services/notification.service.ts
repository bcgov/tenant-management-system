import logger from '../common/logger'
import { getErrorMessage } from '../common/error.handler'
import { TenantRequest } from '../entities/TenantRequest'
import { chesService } from './ches.service'
import { config } from './config.service'

const TENANT_REQUEST_CREATED = 'tenant_request_created'

function formatRequestedAt(requestedAt: Date | string | undefined): string {
  if (!requestedAt) {
    return 'Not recorded'
  }

  const value =
    requestedAt instanceof Date
      ? requestedAt.toISOString()
      : String(requestedAt)

  return value.split('T')[0]
}

export class NotificationService {
  public isEnabled(): boolean {
    return Boolean(
      chesService.isConfigured() && config.ches?.adminNotificationEmail,
    )
  }

  private buildTenantRequestCreatedEmail(tenantRequest: TenantRequest) {
    const requestsUrl = `${config.appBaseUrl || ''}/settings/requests`

    const details = [
      ['Name', tenantRequest.name || ''],
      ['Ministry name', tenantRequest.ministryName || ''],
      ['Description', tenantRequest.description || 'Not provided'],
      ['Requested by', tenantRequest.requestedBy?.displayName || 'Unknown'],
      ['Requested at', formatRequestedAt(tenantRequest.requestedAt)],
    ]
      .map(([label, value]) => `${label}: ${value}`)
      .join('\n')

    return {
      subject: `New CSTAR tenant request: ${tenantRequest.name}`,
      body: [
        'A new tenant request has been submitted in CSTAR and is awaiting a decision.',
        '',
        details,
        '',
        'Review tenant requests in CSTAR:',
        requestsUrl,
      ].join('\n'),
    }
  }

  public async notifyTenantRequestCreated(tenantRequest: TenantRequest) {
    try {
      const email = this.buildTenantRequestCreatedEmail(tenantRequest)

      if (!this.isEnabled()) {
        logger.info('Notification skipped - CHES is not configured', {
          event: TENANT_REQUEST_CREATED,
          tenantRequestId: tenantRequest.id,
        })
        logger.debug('Notification content', {
          event: TENANT_REQUEST_CREATED,
          subject: email.subject,
          body: email.body,
        })

        return
      }

      const result = await chesService.sendEmail({
        to: [config.ches.adminNotificationEmail as string],
        subject: email.subject,
        body: email.body,
      })

      logger.info('Notification sent', {
        event: TENANT_REQUEST_CREATED,
        tenantRequestId: tenantRequest.id,
        msgId: result.msgId,
        txId: result.txId,
      })
    } catch (error: unknown) {
      logger.error('Notification failed', {
        event: TENANT_REQUEST_CREATED,
        tenantRequestId: tenantRequest?.id,
        tenantName: tenantRequest?.name,
        reason: getErrorMessage(error),
      })
    }
  }
}

export const notificationService = new NotificationService()
