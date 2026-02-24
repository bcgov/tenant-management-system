import { Request, Response, NextFunction } from 'express'
import logger from '../common/logger'
import { RoutesConstants } from './routes.constants'

type ResponseWithLoggingFlag = Response & { _loggedResponse?: boolean }

export const requestLoggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const startTime = Date.now()
  const rawPath =
    req.originalUrl?.split('?')[0] || req.url?.split('?')[0] || req.path
  if (
    rawPath === RoutesConstants.HEALTH ||
    rawPath === '/health' ||
    rawPath === `/api${RoutesConstants.HEALTH}` ||
    rawPath.startsWith(RoutesConstants.HEALTH + '/') ||
    rawPath.startsWith('/health/') ||
    rawPath.startsWith(`/api${RoutesConstants.HEALTH}/`)
  ) {
    return next()
  }

  if (logger.isLevelEnabled('info')) {
    logger.info('Incoming request', {
      method: req.method,
      url: req.url,
      params: req.params,
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined,
    })
  }

  const responseWithFlag = res as ResponseWithLoggingFlag

  if (!responseWithFlag._loggedResponse) {
    const originalSend = res.send

    res.send = function (body: unknown) {
      if (!responseWithFlag._loggedResponse) {
        const responseTime = Date.now() - startTime

        if (logger.isLevelEnabled('info')) {
          logger.info('Outgoing response', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
          })
        }
        // Set flag to prevent duplicate logging
        responseWithFlag._loggedResponse = true
      }

      return originalSend.call(this, body)
    }
  }
  next()
}
