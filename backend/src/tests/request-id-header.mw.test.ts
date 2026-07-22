import { Request, Response, NextFunction } from 'express'
import { addRequestIdHeader } from '../common/request-id-header.mw'
import rTracer from 'cls-rtracer'

jest.mock('cls-rtracer')

const mockRTracerId = rTracer.id as jest.Mock

function createMockResponse(): Response {
  const res = {} as Response
  res.send = jest.fn().mockReturnValue(res)
  res.setHeader = jest.fn().mockReturnValue(res)
  return res
}

describe('addRequestIdHeader', () => {
  let req: Request
  let res: Response
  let next: NextFunction

  beforeEach(() => {
    jest.clearAllMocks()
    req = {} as Request
    res = createMockResponse()
    next = jest.fn()
  })

  it('sets the X-Request-Id header when a request id is available', () => {
    mockRTracerId.mockReturnValue('request-123')

    addRequestIdHeader(req, res, next)
    res.send('done')

    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', 'request-123')
    expect(next).toHaveBeenCalledWith()
  })

  it('does not touch the response when no request id is available', () => {
    mockRTracerId.mockReturnValue(undefined)

    addRequestIdHeader(req, res, next)
    res.send('done')

    expect(res.setHeader).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith()
  })
})
