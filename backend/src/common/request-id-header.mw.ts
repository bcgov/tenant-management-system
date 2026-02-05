import { Request, Response, NextFunction } from 'express'
import rTracer from 'cls-rtracer'

export const addRequestIdHeader = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const requestId = rTracer.id()

  if (requestId && typeof requestId === 'string') {
    const originalSend = res.send
    res.send = function (body: any) {
      res.setHeader('X-Request-Id', requestId)
      return originalSend.call(this, body)
    }

    const originalJson = res.json
    res.json = function (body: any) {
      res.setHeader('X-Request-Id', requestId)
      return originalJson.call(this, body)
    }
  }

  next()
}
