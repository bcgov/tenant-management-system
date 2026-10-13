import { Request, Response, NextFunction } from 'express'
import { checkOperationsAdmin } from '../common/operations-admin.mw'
import { config } from '../services/config.service'

const TMS_AUDIENCE = 'tms-audience'

function createMockResponse(): jest.Mocked<Response> {
  const res = {} as jest.Mocked<Response>
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

describe('checkOperationsAdmin', () => {
  const originalAudience = config.oidc.tmsAudience
  let res: jest.Mocked<Response>
  let next: NextFunction

  beforeEach(() => {
    config.oidc.tmsAudience = TMS_AUDIENCE
    res = createMockResponse()
    next = jest.fn()
  })

  afterEach(() => {
    config.oidc.tmsAudience = originalAudience
  })

  it('allows the request through when the user has the operations admin role', () => {
    const req = {
      decodedJwt: { aud: TMS_AUDIENCE, client_roles: ['TMS.OPERATIONS_ADMIN'] },
    } as unknown as Request

    checkOperationsAdmin(req, res, next)

    expect(next).toHaveBeenCalledWith()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('denies the request when the user does not have the operations admin role', () => {
    const req = {
      decodedJwt: { aud: TMS_AUDIENCE, client_roles: ['SOME_OTHER_ROLE'] },
    } as unknown as Request

    checkOperationsAdmin(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('denies the request when the role comes from a token for another service', () => {
    const req = {
      decodedJwt: {
        aud: 'another-service',
        client_roles: ['TMS.OPERATIONS_ADMIN'],
      },
    } as unknown as Request

    checkOperationsAdmin(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('denies the request when the token has no audience', () => {
    const req = {
      decodedJwt: { client_roles: ['TMS.OPERATIONS_ADMIN'] },
    } as unknown as Request

    checkOperationsAdmin(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('denies the request when no CSTAR audience is configured', () => {
    config.oidc.tmsAudience = undefined as unknown as string
    const req = {
      decodedJwt: { client_roles: ['TMS.OPERATIONS_ADMIN'] },
    } as unknown as Request

    checkOperationsAdmin(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('denies the request using the documented error body', () => {
    const req = {
      decodedJwt: { aud: TMS_AUDIENCE, client_roles: [] },
    } as unknown as Request

    checkOperationsAdmin(req, res, next)

    expect(res.json).toHaveBeenCalledWith({
      name: 'Authorization Failure',
      message: 'Access denied: User does not have required role',
      httpResponseCode: 403,
      errorMessage: 'Forbidden',
    })
  })
})
