import { Request, Response, NextFunction } from 'express'
import { checkTenantAccess } from '../common/tenant-access.mw'
import { tenantRepository } from '../repositories/tenant.repository'

jest.mock('../repositories/tenant.repository')
jest.mock('../common/db.connection', () => ({
  connection: { manager: { transaction: jest.fn() } },
}))

const mockRepository = tenantRepository as jest.Mocked<typeof tenantRepository>

function createMockResponse(): jest.Mocked<Response> {
  const res = {} as jest.Mocked<Response>
  res.status = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

describe('checkTenantAccess', () => {
  let res: jest.Mocked<Response>
  let next: NextFunction

  beforeEach(() => {
    jest.clearAllMocks()
    res = createMockResponse()
    next = jest.fn()
  })

  it('allows the request through when the user has access to the tenant', async () => {
    mockRepository.checkUserTenantAccess.mockResolvedValue(true)
    const req = {
      params: { tenantId: 'tenant-1' },
      decodedJwt: { idir_user_guid: 'user-1' },
    } as unknown as Request

    await checkTenantAccess()(req, res, next)

    expect(next).toHaveBeenCalledWith()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('denies the request when the user does not have access to the tenant', async () => {
    mockRepository.checkUserTenantAccess.mockResolvedValue(false)
    const req = {
      params: { tenantId: 'tenant-1' },
      decodedJwt: { idir_user_guid: 'user-1' },
    } as unknown as Request

    await checkTenantAccess()(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('denies the request when there is no user id on the token', async () => {
    const req = {
      params: { tenantId: 'tenant-1' },
      decodedJwt: {},
    } as unknown as Request

    await checkTenantAccess()(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(mockRepository.checkUserTenantAccess).not.toHaveBeenCalled()
  })

  it('denies shared service requests that are missing a client identifier', async () => {
    const req = {
      params: { tenantId: 'tenant-1' },
      decodedJwt: { idir_user_guid: 'user-1' },
      isSharedServiceAccess: true,
    } as unknown as Request

    await checkTenantAccess()(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(
      mockRepository.checkIfTenantHasSharedServiceAccess,
    ).not.toHaveBeenCalled()
  })

  it('denies shared service requests when the service is not authorized for the tenant', async () => {
    mockRepository.checkIfTenantHasSharedServiceAccess.mockResolvedValue(false)
    const req = {
      params: { tenantId: 'tenant-1' },
      decodedJwt: { idir_user_guid: 'user-1', aud: 'some-other-client' },
      isSharedServiceAccess: true,
    } as unknown as Request

    await checkTenantAccess()(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(mockRepository.checkUserTenantAccess).not.toHaveBeenCalled()
  })

  it('denies the request using the documented error body', async () => {
    mockRepository.checkUserTenantAccess.mockResolvedValue(false)
    const req = {
      params: { tenantId: 'tenant-1' },
      decodedJwt: { idir_user_guid: 'user-1' },
    } as unknown as Request

    await checkTenantAccess()(req, res, next)

    expect(res.json).toHaveBeenCalledWith({
      name: 'Authorization Failure',
      message:
        'Access denied: User does not have required roles for tenant: tenant-1',
      httpResponseCode: 403,
      errorMessage: 'Forbidden',
    })
  })

  it('passes unexpected errors to the next error handler instead of responding directly', async () => {
    mockRepository.checkUserTenantAccess.mockRejectedValue(new Error('db down'))
    const req = {
      params: { tenantId: 'tenant-1' },
      decodedJwt: { idir_user_guid: 'user-1' },
    } as unknown as Request

    await checkTenantAccess()(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.any(Error))
    expect(res.status).not.toHaveBeenCalled()
  })

  describe('when a connected service calls a headless route', () => {
    const headlessRequest = (params: Record<string, string> = {}) =>
      ({
        params: { tenantId: 'tenant-1', ...params },
        decodedJwt: { idir_user_guid: 'user-1', aud: 'chefs-client' },
        isHeadlessAccess: true,
        headlessService: {
          id: 'ss-1',
          name: 'chefs',
          displayName: 'CHEFS',
          clientIdentifier: 'chefs-client',
        },
      }) as unknown as Request

    const expectForbiddenWith = (message: string) => {
      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        name: 'Authorization Failure',
        message,
        httpResponseCode: 403,
        errorMessage: 'Forbidden',
      })
      expect(next).not.toHaveBeenCalled()
    }

    it('lets a member through when the tenant uses the service', async () => {
      mockRepository.checkIfTenantHasSharedServiceAccess.mockResolvedValue(true)
      mockRepository.checkUserTenantAccess.mockResolvedValue(true)

      await checkTenantAccess([])(headlessRequest(), res, next)

      expect(
        mockRepository.checkIfTenantHasSharedServiceAccess,
      ).toHaveBeenCalledWith('tenant-1', 'chefs-client')
      expect(mockRepository.checkUserTenantAccess).toHaveBeenCalledWith(
        'tenant-1',
        'user-1',
        [],
      )
      expect(next).toHaveBeenCalledWith()
    })

    it('turns the call away when the tenant does not use the service', async () => {
      mockRepository.checkIfTenantHasSharedServiceAccess.mockResolvedValue(
        false,
      )

      await checkTenantAccess([])(headlessRequest(), res, next)

      expectForbiddenWith(
        'This tenant does not use CHEFS. A tenant owner can add CHEFS to the tenant in the CSTAR web app.',
      )
      expect(mockRepository.checkUserTenantAccess).not.toHaveBeenCalled()
    })

    it.each([
      [[], 'You must be a member of this tenant to do this.'],
      [undefined, 'You must be a member of this tenant to do this.'],
      [
        ['TMS.TENANT_OWNER'],
        'You need the Tenant Owner role in this tenant to do this.',
      ],
      [
        ['TMS.TENANT_OWNER', 'TMS.USER_ADMIN'],
        'You need the Tenant Owner or User Admin role in this tenant to do this.',
      ],
      [
        ['CUSTOM_ROLE'],
        'You need the CUSTOM_ROLE role in this tenant to do this.',
      ],
    ])(
      'explains which role is missing when the roles needed are %p',
      async (requiredRoles, message) => {
        mockRepository.checkIfTenantHasSharedServiceAccess.mockResolvedValue(
          true,
        )
        mockRepository.checkUserTenantAccess.mockResolvedValue(false)

        await checkTenantAccess(requiredRoles)(headlessRequest(), res, next)

        expectForbiddenWith(message)
      },
    )

    it('turns the call away when there is no tenant in the URL', async () => {
      const req = headlessRequest()
      req.params = {}

      await checkTenantAccess([])(req, res, next)

      expectForbiddenWith('Missing tenant ID or user ID')
      expect(
        mockRepository.checkIfTenantHasSharedServiceAccess,
      ).not.toHaveBeenCalled()
    })
  })

  it('does not check the service link for CSTAR web app calls', async () => {
    mockRepository.checkUserTenantAccess.mockResolvedValue(true)
    const req = {
      params: { tenantId: 'tenant-1' },
      decodedJwt: { idir_user_guid: 'user-1', aud: 'tms-audience' },
    } as unknown as Request

    await checkTenantAccess()(req, res, next)

    expect(
      mockRepository.checkIfTenantHasSharedServiceAccess,
    ).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith()
  })
})
