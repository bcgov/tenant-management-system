import { Request, Response, NextFunction } from 'express'
import { prepareHeadlessTenantUser } from '../common/headless-tenant-user.mw'
import { tenantRepository } from '../repositories/tenant.repository'

jest.mock('../repositories/tenant.repository', () => ({
  tenantRepository: {
    findRoles: jest.fn(),
  },
}))

const mockFindRoles = tenantRepository.findRoles as jest.Mock

function createMockResponse(): jest.Mocked<Response> {
  const res = {} as jest.Mocked<Response>
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

const user = {
  firstName: 'Sam',
  lastName: 'Lee',
  displayName: 'Sam Lee',
  ssoUserId: 'SAM-GUID',
  idpType: 'idir',
}

describe('prepareHeadlessTenantUser', () => {
  let res: jest.Mocked<Response>
  let next: NextFunction

  beforeEach(() => {
    jest.clearAllMocks()
    res = createMockResponse()
    next = jest.fn()
    mockFindRoles.mockResolvedValue([{ id: 'service-user-role' }])
  })

  const headlessRequest = (body: Record<string, unknown>) =>
    ({ isHeadlessAccess: true, body }) as unknown as Request

  it('leaves web app requests alone', async () => {
    const req = {
      body: { user, roles: ['owner-role'], groups: ['group-1'] },
    } as unknown as Request

    await prepareHeadlessTenantUser(req, res, next)

    expect(next).toHaveBeenCalledWith()
    expect(req.body.roles).toEqual(['owner-role'])
    expect(mockFindRoles).not.toHaveBeenCalled()
  })

  it('gives the person the Service User role when no roles are sent', async () => {
    const req = headlessRequest({ user })

    await prepareHeadlessTenantUser(req, res, next)

    expect(mockFindRoles).toHaveBeenCalledWith(['TMS.SERVICE_USER'], null)
    expect(req.body.roles).toEqual(['service-user-role'])
    expect(next).toHaveBeenCalledWith()
  })

  it('accepts a request that asks for the Service User role', async () => {
    const req = headlessRequest({ user, roles: ['service-user-role'] })

    await prepareHeadlessTenantUser(req, res, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('refuses a request that asks for any other role', async () => {
    const req = headlessRequest({
      user,
      roles: ['service-user-role', 'owner-role'],
    })

    await prepareHeadlessTenantUser(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({
      name: 'Authorization Failure',
      message:
        'People added from a connected service can only be given the Service User role. Use the CSTAR web app to give the Tenant Owner or User Admin role.',
      httpResponseCode: 403,
      errorMessage: 'Forbidden',
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('refuses groups in the same request', async () => {
    const req = headlessRequest({ user, groups: ['group-1'] })

    await prepareHeadlessTenantUser(req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          'When adding someone from a connected service, add them to groups one at a time using the add group member route.',
      }),
    )
    expect(mockFindRoles).not.toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  it('leaves badly shaped roles for the validator to reject', async () => {
    const req = headlessRequest({ user, roles: 'owner-role' })

    await prepareHeadlessTenantUser(req, res, next)

    expect(next).toHaveBeenCalledWith()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('passes a failed role lookup on as a server error', async () => {
    mockFindRoles.mockRejectedValueOnce(new Error('db down'))
    const req = headlessRequest({ user })

    await prepareHeadlessTenantUser(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.any(Error))
  })
})
