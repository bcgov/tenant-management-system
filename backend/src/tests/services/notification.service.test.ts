import { NotificationService } from '../../services/notification.service'
import { chesService } from '../../services/ches.service'
import { config } from '../../services/config.service'
import logger from '../../common/logger'
import { TenantRequest } from '../../entities/TenantRequest'

jest.mock('../../services/ches.service', () => ({
  chesService: {
    isConfigured: jest.fn(),
    sendEmail: jest.fn(),
  },
}))

jest.mock('../../common/logger', () => ({
  __esModule: true,
  default: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

const mockChes = chesService as jest.Mocked<typeof chesService>
const mockLogger = logger as jest.Mocked<typeof logger>

function buildTenantRequest(): TenantRequest {
  return {
    id: 'request-1',
    name: 'My Tenant',
    ministryName: 'BC Elections',
    description: 'A new tenant for elections work',
    requestedAt: '2026-07-30',
    requestedBy: { displayName: 'Falk, Barrett CITZ:EX' },
  } as unknown as TenantRequest
}

describe('notifyTenantRequestCreated', () => {
  let service: NotificationService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new NotificationService()
    config.ches = {
      adminNotificationEmail: 'cstar.admin@gov.bc.ca',
      apiUrl: 'https://ches.example/api/v1/email',
      clientId: 'client',
      clientSecret: 'secret',
      tokenUrl: 'https://token.example/token',
    }
    config.appBaseUrl = 'https://cstar.example'
    mockChes.isConfigured.mockReturnValue(true)
    mockChes.sendEmail.mockResolvedValue({ msgId: 'msg-1', txId: 'tx-1' })
  })

  it('sends the email to the configured admin mailbox', async () => {
    await service.notifyTenantRequestCreated(buildTenantRequest())

    expect(mockChes.sendEmail).toHaveBeenCalledTimes(1)
    expect(mockChes.sendEmail.mock.calls[0][0].to).toEqual([
      'cstar.admin@gov.bc.ca',
    ])
  })

  it('includes every detail the operations admin needs to decide', async () => {
    await service.notifyTenantRequestCreated(buildTenantRequest())

    const email = mockChes.sendEmail.mock.calls[0][0]

    expect(email.subject).toBe('New CSTAR tenant request: My Tenant')
    expect(email.body).toContain('My Tenant')
    expect(email.body).toContain('BC Elections')
    expect(email.body).toContain('A new tenant for elections work')
    expect(email.body).toContain('Falk, Barrett CITZ:EX')
    expect(email.body).toContain('2026-07-30')
    expect(email.body).toContain('https://cstar.example/settings/requests')
  })

  it('logs the CHES message id so delivery can be traced', async () => {
    await service.notifyTenantRequestCreated(buildTenantRequest())

    expect(mockLogger.info).toHaveBeenCalledWith('Notification sent', {
      event: 'tenant_request_created',
      tenantRequestId: 'request-1',
      msgId: 'msg-1',
      txId: 'tx-1',
    })
  })

  it('never logs the recipient address or the email body on success', async () => {
    await service.notifyTenantRequestCreated(buildTenantRequest())

    const logged = JSON.stringify(mockLogger.info.mock.calls)

    expect(logged).not.toContain('cstar.admin@gov.bc.ca')
    expect(logged).not.toContain('BC Elections')
  })

  it('does not throw when CHES fails, so the tenant request still succeeds', async () => {
    mockChes.sendEmail.mockRejectedValue(new Error('CHES unavailable'))

    await expect(
      service.notifyTenantRequestCreated(buildTenantRequest()),
    ).resolves.toBeUndefined()

    expect(mockLogger.error).toHaveBeenCalledWith('Notification failed', {
      event: 'tenant_request_created',
      tenantRequestId: 'request-1',
      tenantName: 'My Tenant',
      reason: 'CHES unavailable',
    })
  })

  it('logs the email instead of sending it when CHES is not configured', async () => {
    mockChes.isConfigured.mockReturnValue(false)

    await service.notifyTenantRequestCreated(buildTenantRequest())

    expect(mockChes.sendEmail).not.toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Notification skipped - CHES is not configured',
      { event: 'tenant_request_created', tenantRequestId: 'request-1' },
    )
    expect(mockLogger.debug).toHaveBeenCalled()
  })

  it('skips sending when no admin mailbox is configured', async () => {
    config.ches.adminNotificationEmail = undefined

    await service.notifyTenantRequestCreated(buildTenantRequest())

    expect(mockChes.sendEmail).not.toHaveBeenCalled()
  })

  it('falls back gracefully when the request has no description', async () => {
    const tenantRequest = buildTenantRequest()
    tenantRequest.description = undefined as unknown as string

    await service.notifyTenantRequestCreated(tenantRequest)

    expect(mockChes.sendEmail.mock.calls[0][0].body).toContain('Not provided')
  })

  it('does not throw even when the tenant request is unusable', async () => {
    await expect(
      service.notifyTenantRequestCreated(null as unknown as TenantRequest),
    ).resolves.toBeUndefined()

    expect(mockLogger.error).toHaveBeenCalled()
  })

  it('builds a plain text body with no markup', async () => {
    await service.notifyTenantRequestCreated(buildTenantRequest())

    const body = mockChes.sendEmail.mock.calls[0][0].body

    expect(body).not.toMatch(/<[a-z]/i)
    expect(body).toContain('Name: My Tenant')
    expect(body).toContain('Ministry name: BC Elections')
    expect(body).toContain('Requested at: 2026-07-30')
  })

  it('leaves the tenant name unaltered, as plain text needs no escaping', async () => {
    const tenantRequest = buildTenantRequest()
    tenantRequest.name = 'Roads & Bridges'

    await service.notifyTenantRequestCreated(tenantRequest)

    expect(mockChes.sendEmail.mock.calls[0][0].body).toContain(
      'Name: Roads & Bridges',
    )
  })
})

function buildDecisionedRequest(
  status: 'APPROVED' | 'REJECTED',
  rejectionReason?: string,
) {
  return {
    id: 'request-1',
    name: 'My Tenant',
    ministryName: 'BC Elections',
    description: 'A new tenant for elections work',
    status,
    decisionedAt: '2026-08-02',
    rejectionReason: rejectionReason ?? null,
    requestedBy: {
      displayName: 'Falk, Barrett CITZ:EX',
      email: 'barrett.falk@gov.bc.ca',
    },
    decisionedBy: { displayName: 'Sethuraman, Shankar JEG:EX' },
  }
}

describe('notifyTenantRequestDecisioned', () => {
  let service: NotificationService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new NotificationService()
    config.ches = {
      adminNotificationEmail: 'cstar.admin@gov.bc.ca',
      apiUrl: 'https://ches.example/api/v1/email',
      clientId: 'client',
      clientSecret: 'secret',
      tokenUrl: 'https://token.example/token',
    }
    config.appBaseUrl = 'https://cstar.example'
    mockChes.isConfigured.mockReturnValue(true)
    mockChes.sendEmail.mockResolvedValue({ msgId: 'msg-2', txId: 'tx-2' })
  })

  it('emails the original requester, not the admin mailbox', async () => {
    await service.notifyTenantRequestDecisioned(
      buildDecisionedRequest('APPROVED'),
    )

    expect(mockChes.sendEmail.mock.calls[0][0].to).toEqual([
      'barrett.falk@gov.bc.ca',
    ])
  })

  it('includes every detail the requester needs on approval', async () => {
    await service.notifyTenantRequestDecisioned(
      buildDecisionedRequest('APPROVED'),
    )

    const email = mockChes.sendEmail.mock.calls[0][0]

    expect(email.subject).toBe(
      'Your CSTAR tenant request was approved: My Tenant',
    )
    expect(email.body).toContain('Tenant name: My Tenant')
    expect(email.body).toContain('Ministry name: BC Elections')
    expect(email.body).toContain('Description: A new tenant for elections work')
    expect(email.body).toContain('Status: APPROVED')
    expect(email.body).toContain('Decisioned by: Sethuraman, Shankar JEG:EX')
    expect(email.body).toContain('Decisioned at: 2026-08-02')
    expect(email.body).toContain('https://cstar.example')
  })

  it('includes the rejection reason when the request was rejected', async () => {
    await service.notifyTenantRequestDecisioned(
      buildDecisionedRequest('REJECTED', 'Duplicate of an existing tenant'),
    )

    const email = mockChes.sendEmail.mock.calls[0][0]

    expect(email.subject).toBe(
      'Your CSTAR tenant request was rejected: My Tenant',
    )
    expect(email.body).toContain('Status: REJECTED')
    expect(email.body).toContain('Reason: Duplicate of an existing tenant')
  })

  it('omits the reason line when there is no rejection reason', async () => {
    await service.notifyTenantRequestDecisioned(
      buildDecisionedRequest('APPROVED'),
    )

    expect(mockChes.sendEmail.mock.calls[0][0].body).not.toContain('Reason:')
  })

  it('skips sending when the requester has no email address', async () => {
    const decisioned = buildDecisionedRequest('APPROVED')
    decisioned.requestedBy.email = ''

    await service.notifyTenantRequestDecisioned(decisioned)

    expect(mockChes.sendEmail).not.toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Notification skipped - no recipient',
      { event: 'tenant_request_decisioned', tenantRequestId: 'request-1' },
    )
  })

  it('never logs the requester email address', async () => {
    await service.notifyTenantRequestDecisioned(
      buildDecisionedRequest('APPROVED'),
    )

    expect(JSON.stringify(mockLogger.info.mock.calls)).not.toContain(
      'barrett.falk@gov.bc.ca',
    )
  })

  it('logs the CHES message id so delivery can be traced', async () => {
    await service.notifyTenantRequestDecisioned(
      buildDecisionedRequest('REJECTED', 'Not enough information'),
    )

    expect(mockLogger.info).toHaveBeenCalledWith('Notification sent', {
      event: 'tenant_request_decisioned',
      tenantRequestId: 'request-1',
      msgId: 'msg-2',
      txId: 'tx-2',
    })
  })

  it('does not throw when CHES fails, so the status update still succeeds', async () => {
    mockChes.sendEmail.mockRejectedValue(new Error('CHES unavailable'))

    await expect(
      service.notifyTenantRequestDecisioned(buildDecisionedRequest('APPROVED')),
    ).resolves.toBeUndefined()

    expect(mockLogger.error).toHaveBeenCalledWith('Notification failed', {
      event: 'tenant_request_decisioned',
      tenantRequestId: 'request-1',
      tenantName: 'My Tenant',
      reason: 'CHES unavailable',
    })
  })
})
