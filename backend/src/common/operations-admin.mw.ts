import { Request, Response, NextFunction } from 'express'
import logger from './logger'
import { ForbiddenError } from '../errors/ForbiddenError'

export const checkOperationsAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const roles = req.decodedJwt?.client_roles || []

    if (!roles.includes('TMS.OPERATIONS_ADMIN')) {
      logger.warn(
        'Access denied: User does not have required role: TMS.OPERATIONS_ADMIN',
        {
          userId: req.decodedJwt?.idir_user_guid,
          roles: roles,
        },
      )
      throw new ForbiddenError(
        'Access denied: User does not have required role',
      )
    }

    next()
  } catch (error) {
    if (error instanceof ForbiddenError) {
      res.status(403).json({
        errorMessage: 'Forbidden',
        httpResponseCode: 403,
        message: error.message,
        name: 'User does not have access to this operation and / resource',
      })
    } else {
      logger.error('Error checking operations admin role', error as any)
      res.status(500).json({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: 'Error checking operations admin role',
        name: 'Server error',
      })
    }
  }
}
