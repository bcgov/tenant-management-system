import { Request, Response, NextFunction } from 'express'
import logger from './logger'
import { sendErrorResponse } from './error.handler'
import { config } from '../services/config.service'

export const checkOperationsAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const roles = req.decodedJwt?.client_roles || []
  const isTmsToken =
    Boolean(config.oidc.tmsAudience) &&
    req.decodedJwt?.aud === config.oidc.tmsAudience

  if (!isTmsToken || !roles.includes('TMS.OPERATIONS_ADMIN')) {
    logger.error(
      'Access denied: User does not have required role: TMS.OPERATIONS_ADMIN',
      {
        userId: req.decodedJwt?.idir_user_guid,
        roles: roles,
        isTmsToken,
      },
    )

    sendErrorResponse(
      res,
      'Authorization Failure',
      'Access denied: User does not have required role',
      403,
      'Forbidden',
    )

    return
  }

  next()
}
