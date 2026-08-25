import logger from '../common/logger'
import { getErrorMessage } from '../common/error.handler'
import { chesService } from './ches.service'
import { config } from './config.service'

const TENANT_REQUEST_CREATED = 'tenant_request_created'
const TENANT_REQUEST_DECISIONED = 'tenant_request_decisioned'
const USER_ADDED_TO_TENANT = 'user_added_to_tenant'
const USER_REMOVED_FROM_TENANT = 'user_removed_from_tenant'
const USER_ADDED_TO_GROUP = 'user_added_to_group'
const USER_REMOVED_FROM_GROUP = 'user_removed_from_group'

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

export interface NotifiableTenantUser {
  createdDateTime?: Date | string
  updatedDateTime?: Date | string
  ssoUser?: { email?: string }
  tenant?: { id?: string; name?: string; ministryName?: string }
}

export interface NotifiableGroupUser {
  createdDateTime?: Date | string
  updatedDateTime?: Date | string
  group?: {
    id?: string
    name?: string
    tenant?: { id?: string; name?: string }
  }
  tenantUser?: { ssoUser?: { email?: string; ssoUserId?: string } }
}

export interface NotifiableGroup {
  name?: string
}

export interface NotifiableRoleAssignment {
  role?: { name?: string; description?: string }
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
  tenantId?: string
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

function formatRoles(roleAssignments: NotifiableRoleAssignment[]): string {
  const roleNames = roleAssignments
    .map(({ role }) => role?.description || role?.name)
    .filter(Boolean)

  if (roleNames.length === 0) {
    return 'None'
  }

  return roleNames.join(', ')
}

function formatGroups(groups: NotifiableGroup[]): string {
  return groups
    .map((group) => group.name)
    .filter(Boolean)
    .join(', ')
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

  private buildUserAddedToTenantEmail(
    tenantUser: NotifiableTenantUser,
    roleAssignments: NotifiableRoleAssignment[],
    groups: NotifiableGroup[],
  ): EmailContent {
    const tenantName = tenantUser.tenant?.name || ''

    const details: EmailDetail[] = [
      { label: 'Tenant name', value: tenantName },
      {
        label: 'Ministry name',
        value: tenantUser.tenant?.ministryName || '',
      },
      { label: 'Added at', value: formatDate(tenantUser.createdDateTime) },
      { label: 'Roles granted', value: formatRoles(roleAssignments) },
    ]

    const groupNames = formatGroups(groups)

    if (groupNames) {
      details.push({ label: 'Groups', value: groupNames })
    }

    return {
      subject: `You have been added to a CSTAR tenant: ${tenantName}`,
      body: formatBody([
        'You have been added to a tenant in CSTAR.',
        formatDetails(details),
        `Sign in to CSTAR to access this tenant:\n${getCstarUrl(`/tenants/${tenantUser.tenant?.id}/users`)}`,
      ]),
    }
  }

  private buildUserRemovedFromTenantEmail(
    tenantUser: NotifiableTenantUser,
    removedByDisplayName: string,
  ): EmailContent {
    const tenantName = tenantUser.tenant?.name || ''

    return {
      subject: `You have been removed from a CSTAR tenant: ${tenantName}`,
      body: formatBody([
        'You have been removed from a tenant in CSTAR, including all of its groups. You no longer have access to this tenant or its connected services.',
        formatDetails([
          { label: 'Tenant name', value: tenantName },
          {
            label: 'Ministry name',
            value: tenantUser.tenant?.ministryName || '',
          },
          {
            label: 'Removed at',
            value: formatDate(tenantUser.updatedDateTime),
          },
          { label: 'Removed by', value: removedByDisplayName || 'Unknown' },
        ]),
        `Sign in to CSTAR:\n${getCstarUrl()}`,
      ]),
    }
  }

  private buildUserAddedToGroupEmail(
    groupUser: NotifiableGroupUser,
    addedByDisplayName: string,
  ): EmailContent {
    const groupName = groupUser.group?.name || ''
    const tenantId = groupUser.group?.tenant?.id
    const groupId = groupUser.group?.id

    return {
      subject: `You have been added to a CSTAR group: ${groupName}`,
      body: formatBody([
        'You have been added to a group in CSTAR.',
        formatDetails([
          { label: 'Group name', value: groupName },
          { label: 'Tenant name', value: groupUser.group?.tenant?.name || '' },
          { label: 'Added at', value: formatDate(groupUser.createdDateTime) },
          { label: 'Added by', value: addedByDisplayName || 'Unknown' },
        ]),
        `Sign in to CSTAR to see this group:\n${getCstarUrl(`/tenants/${tenantId}/groups/${groupId}/members`)}`,
      ]),
    }
  }

  private buildUserRemovedFromGroupEmail(
    groupUser: NotifiableGroupUser,
    removedByDisplayName: string,
  ): EmailContent {
    const groupName = groupUser.group?.name || ''

    return {
      subject: `You have been removed from a CSTAR group: ${groupName}`,
      body: formatBody([
        'You are no longer a member of this group in CSTAR. You will still have access to other groups you belong to. You still have access to the tenant.',
        formatDetails([
          { label: 'Group name', value: groupName },
          { label: 'Tenant name', value: groupUser.group?.tenant?.name || '' },
          { label: 'Removed at', value: formatDate(groupUser.updatedDateTime) },
          { label: 'Removed by', value: removedByDisplayName || 'Unknown' },
        ]),
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
      tenantId: notification.tenantId,
    })
    logger.debug('Notification content', {
      event: notification.event,
      subject: notification.email.subject,
      body: notification.email.body,
    })
  }

  private logNotificationFailure(
    event: string,
    identifiers: {
      tenantRequestId?: string
      tenantId?: string
      tenantName?: string
    },
    error: unknown,
  ): void {
    logger.error('Notification failed', {
      event,
      ...identifiers,
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
      tenantId: notification.tenantId,
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
      this.logNotificationFailure(
        TENANT_REQUEST_CREATED,
        { tenantRequestId: tenantRequest?.id, tenantName: tenantRequest?.name },
        error,
      )
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
        { tenantRequestId: tenantRequest?.id, tenantName: tenantRequest?.name },
        error,
      )
    }
  }
  public async notifyUserAddedToTenant(
    tenantUser: NotifiableTenantUser,
    roleAssignments: NotifiableRoleAssignment[],
    groups: NotifiableGroup[] = [],
  ) {
    try {
      await this.sendNotification({
        event: USER_ADDED_TO_TENANT,
        tenantId: tenantUser.tenant?.id,
        recipient: tenantUser.ssoUser?.email,
        email: this.buildUserAddedToTenantEmail(
          tenantUser,
          roleAssignments,
          groups,
        ),
      })
    } catch (error: unknown) {
      this.logNotificationFailure(
        USER_ADDED_TO_TENANT,
        {
          tenantId: tenantUser?.tenant?.id,
          tenantName: tenantUser?.tenant?.name,
        },
        error,
      )
    }
  }
  public async notifyUserRemovedFromTenant(
    tenantUser: NotifiableTenantUser,
    removedByDisplayName: string,
  ) {
    try {
      await this.sendNotification({
        event: USER_REMOVED_FROM_TENANT,
        tenantId: tenantUser.tenant?.id,
        recipient: tenantUser.ssoUser?.email,
        email: this.buildUserRemovedFromTenantEmail(
          tenantUser,
          removedByDisplayName,
        ),
      })
    } catch (error: unknown) {
      this.logNotificationFailure(
        USER_REMOVED_FROM_TENANT,
        {
          tenantId: tenantUser?.tenant?.id,
          tenantName: tenantUser?.tenant?.name,
        },
        error,
      )
    }
  }
  public async notifyUserRemovedFromGroup(
    groupUser: NotifiableGroupUser,
    removedByDisplayName: string,
  ) {
    try {
      await this.sendNotification({
        event: USER_REMOVED_FROM_GROUP,
        tenantId: groupUser.group?.tenant?.id,
        recipient: groupUser.tenantUser?.ssoUser?.email,
        email: this.buildUserRemovedFromGroupEmail(
          groupUser,
          removedByDisplayName,
        ),
      })
    } catch (error: unknown) {
      this.logNotificationFailure(
        USER_REMOVED_FROM_GROUP,
        {
          tenantId: groupUser?.group?.tenant?.id,
          tenantName: groupUser?.group?.tenant?.name,
        },
        error,
      )
    }
  }
  public async notifyUserAddedToGroup(
    groupUser: NotifiableGroupUser,
    addedByDisplayName: string,
  ) {
    try {
      await this.sendNotification({
        event: USER_ADDED_TO_GROUP,
        tenantId: groupUser.group?.tenant?.id,
        recipient: groupUser.tenantUser?.ssoUser?.email,
        email: this.buildUserAddedToGroupEmail(groupUser, addedByDisplayName),
      })
    } catch (error: unknown) {
      this.logNotificationFailure(
        USER_ADDED_TO_GROUP,
        {
          tenantId: groupUser?.group?.tenant?.id,
          tenantName: groupUser?.group?.tenant?.name,
        },
        error,
      )
    }
  }
}

export const notificationService = new NotificationService()
