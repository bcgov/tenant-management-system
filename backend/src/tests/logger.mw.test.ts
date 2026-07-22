import { Request, Response, NextFunction } from 'express'
import { requestLoggingMiddleware } from '../common/logger.mw'
import logger from '../common/logger'

jest.mock('../common/logger')

const mockLoggerInfo = logger.info as jest.Mock

function createMockResponse(): Response {
  const res = {} as Response
  res.send = jest.fn().mockReturnValue(res)
  res.statusCode = 200
  return res
}

describe('requestLoggingMiddleware', () => {
  let res: Response
  let next: NextFunction

  beforeEach(() => {
    jest.clearAllMocks()
    res = createMockResponse()
    next = jest.fn()
  })

  it('skips logging entirely for health check requests', () => {
    const req = { originalUrl: '/v1/health', method: 'GET' } as Request

    requestLoggingMiddleware(req, res, next)

    expect(next).toHaveBeenCalledWith()
    expect(mockLoggerInfo).not.toHaveBeenCalled()
  })

  it('logs a completed request once the response is sent', () => {
    const req = { originalUrl: '/v1/tenants', method: 'GET' } as Request

    requestLoggingMiddleware(req, res, next)
    res.send('done')

    expect(mockLoggerInfo).toHaveBeenCalledWith(
      'Request completed',
      expect.objectContaining({ method: 'GET', statusCode: 200 }),
    )
    expect(next).toHaveBeenCalledWith()
  })

  it('does not log the same response twice', () => {
    const req = { originalUrl: '/v1/tenants', method: 'GET' } as Request

    requestLoggingMiddleware(req, res, next)
    res.send('first')
    res.send('second')

    expect(mockLoggerInfo).toHaveBeenCalledTimes(1)
  })
})
