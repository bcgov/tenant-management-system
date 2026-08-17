import { Request, Response, NextFunction } from 'express'
import logger from './logger'
import { sendErrorResponse } from './error.handler'

export const checkOperationsAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const roles = req.decodedJwt?.client_roles || []

  if (!roles.includes('TMS.OPERATIONS_ADMIN')) {
    logger.error(
      'Access denied: User does not have required role: TMS.OPERATIONS_ADMIN',
      {
        userId: req.decodedJwt?.idir_user_guid,
        roles: roles,
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
