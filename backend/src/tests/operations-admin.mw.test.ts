import { Request, Response, NextFunction } from 'express'
import { checkOperationsAdmin } from '../common/operations-admin.mw'

function createMockResponse(): jest.Mocked<Response> {
  const res = {} as jest.Mocked<Response>
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

describe('checkOperationsAdmin', () => {
  let res: jest.Mocked<Response>
  let next: NextFunction

  beforeEach(() => {
    res = createMockResponse()
    next = jest.fn()
  })

  it('allows the request through when the user has the operations admin role', () => {
    const req = {
      decodedJwt: { client_roles: ['TMS.OPERATIONS_ADMIN'] },
    } as unknown as Request

    checkOperationsAdmin(req, res, next)

    expect(next).toHaveBeenCalledWith()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('denies the request when the user does not have the operations admin role', () => {
    const req = {
      decodedJwt: { client_roles: ['SOME_OTHER_ROLE'] },
    } as unknown as Request

    checkOperationsAdmin(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })
})
