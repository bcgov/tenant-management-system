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
})
