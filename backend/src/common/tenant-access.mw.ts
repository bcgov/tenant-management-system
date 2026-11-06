import { Request, Response, NextFunction } from 'express'
import { tenantRepository } from '../repositories/tenant.repository'
import { ForbiddenError } from '../errors/ForbiddenError'
import logger from './logger'
import { getErrorMessage, sendErrorResponse } from './error.handler'
import { config } from '../services/config.service'
import { TMSConstants } from './tms.constants'

const ROLE_LABELS: Record<string, string> = {
  [TMSConstants.TENANT_OWNER]: 'Tenant Owner',
  [TMSConstants.USER_ADMIN]: 'User Admin',
  [TMSConstants.SERVICE_USER]: 'Service User',
}

const serviceNotUsedByTenantMessage = (serviceName: string) =>
  `This tenant does not use ${serviceName}. A tenant owner can add ${serviceName} to the tenant in the CSTAR web app.`

const requiredRolesMessage = (roles: string[] = []) => {
  if (roles.length === 0) {
    return TMSConstants.HEADLESS_TENANT_MEMBER_REQUIRED
  }
  const labels = roles.map((role) => ROLE_LABELS[role] ?? role)
  return `You need the ${labels.join(' or ')} role in this tenant to do this.`
}

const ensureTenantUsesService = async (
  tenantId: string,
  clientIdentifier: string,
  message: string,
) => {
  const hasServiceAccess: boolean =
    await tenantRepository.checkIfTenantHasSharedServiceAccess(
      tenantId,
      clientIdentifier,
    )
  if (!hasServiceAccess) {
    throw new ForbiddenError(message)
  }
}

interface CheckTenantAccessOptions {
  headlessOnly?: boolean
  tenantIdFromQuery?: boolean
}

const getTenantId = (req: Request, options: CheckTenantAccessOptions) =>
  (options.tenantIdFromQuery
    ? req.query.tenantId
    : req.params.tenantId) as string

const ensureCallingServiceLinked = async (req: Request, tenantId: string) => {
  if (req.isHeadlessAccess && req.headlessService) {
    if (!tenantId) {
      throw new ForbiddenError('Missing tenant ID or user ID')
    }
    await ensureTenantUsesService(
      tenantId,
      req.headlessService.clientIdentifier,
      serviceNotUsedByTenantMessage(req.headlessService.displayName),
    )
    return
  }

  if (!req.isSharedServiceAccess) {
    return
  }

  const clientIdentifier = req.decodedJwt?.aud
  if (!tenantId || !clientIdentifier) {
    throw new ForbiddenError('Missing tenant ID or client identifier')
  }
  if (clientIdentifier !== config.oidc.tmsAudience) {
    await ensureTenantUsesService(
      tenantId,
      clientIdentifier,
      'Shared service not authorized for this tenant',
    )
  }
}

const ensureUserHasRoles = async (
  req: Request,
  tenantId: string,
  requiredRoles?: string[],
) => {
  const ssoUserId =
    req.decodedJwt?.idir_user_guid || req.decodedJwt?.bceid_user_guid
  if (!tenantId || !ssoUserId) {
    throw new ForbiddenError('Missing tenant ID or user ID')
  }

  const hasAccess: boolean = await tenantRepository.checkUserTenantAccess(
    tenantId,
    ssoUserId,
    requiredRoles,
  )
  if (!hasAccess) {
    throw new ForbiddenError(
      req.isHeadlessAccess
        ? requiredRolesMessage(requiredRoles)
        : `Access denied: User does not have required roles for tenant: ${tenantId}`,
    )
  }
}

const handleAccessError = (
  error: unknown,
  res: Response,
  next: NextFunction,
) => {
  logger.error('Tenant access check failed:', {
    error: getErrorMessage(error),
  })
  if (error instanceof ForbiddenError) {
    sendErrorResponse(
      res,
      'Authorization Failure',
      error.message,
      error.statusCode,
      'Forbidden',
    )
    return
  }
  next(error)
}

export const checkTenantAccess = (
  requiredRoles?: string[],
  options: CheckTenantAccessOptions = {},
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (options.headlessOnly && !req.isHeadlessAccess) {
      return next()
    }

    const tenantId = getTenantId(req, options)
    if (options.tenantIdFromQuery && !tenantId) {
      return sendErrorResponse(
        res,
        'Bad Request',
        TMSConstants.HEADLESS_SEARCH_TENANT_REQUIRED,
        400,
        'Bad Request',
      )
    }

    try {
      await ensureCallingServiceLinked(req, tenantId)
      await ensureUserHasRoles(req, tenantId, requiredRoles)
      next()
    } catch (error: unknown) {
      handleAccessError(error, res, next)
    }
  }
}
