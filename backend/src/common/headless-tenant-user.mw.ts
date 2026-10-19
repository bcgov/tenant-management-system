import { Request, Response, NextFunction } from 'express'
import { tenantRepository } from '../repositories/tenant.repository'
import { sendErrorResponse } from './error.handler'
import { TMSConstants } from './tms.constants'

export const prepareHeadlessTenantUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.isHeadlessAccess) {
    return next()
  }

  if (req.body?.groups !== undefined) {
    return sendErrorResponse(
      res,
      'Bad Request',
      TMSConstants.HEADLESS_ADD_GROUPS_SEPARATELY,
      400,
      'Bad Request',
    )
  }

  try {
    const [serviceUserRole] = await tenantRepository.findRoles(
      [TMSConstants.SERVICE_USER],
      null,
    )
    const roles = req.body?.roles

    if (roles === undefined) {
      req.body.roles = [serviceUserRole.id]
    } else if (
      Array.isArray(roles) &&
      roles.some((roleId) => roleId !== serviceUserRole.id)
    ) {
      return sendErrorResponse(
        res,
        'Authorization Failure',
        TMSConstants.HEADLESS_SERVICE_USER_ROLE_ONLY,
        403,
        'Forbidden',
      )
    }

    next()
  } catch (error: unknown) {
    next(error)
  }
}
