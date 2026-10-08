import { Request, Response, NextFunction } from 'express'
import { expressjwt as jwt } from 'express-jwt'
import jwksRsa from 'jwks-rsa'
import logger from './logger'
import { UnauthorizedError } from '../errors/UnauthorizedError'
import { RoutesConstants } from './routes.constants'
import { TMSConstants } from './tms.constants'
import { config } from '../services/config.service'
import { sendErrorResponse } from './error.handler'
import { sharedServiceRepository } from '../repositories/shared-service.repository'

const sendUnauthorized = (res: Response, message: string) => {
  return sendErrorResponse(res, 'Unauthorized', message, 401, 'Unauthorized')
}

const sendForbidden = (res: Response, message: string) => {
  return sendErrorResponse(
    res,
    'Authorization Failure',
    message,
    403,
    'Forbidden',
  )
}

interface CheckJwtOptions {
  sharedServiceAccess?: boolean
  headlessAccess?: boolean
  skipSsoUserParamMatch?: boolean
}

interface JwtValidationError extends Error {
  code?: string
  inner?: {
    message?: string
  }
}

const getAuthenticationFailureReason = (error: JwtValidationError): string => {
  const message = `${error.message} ${error.inner?.message || ''}`.toLowerCase()

  if (message.includes('missing') || message.includes('bearer')) {
    return 'missing_token'
  }
  if (message.includes('expired')) {
    return 'token_expired'
  }
  if (message.includes('audience')) {
    return 'invalid_audience'
  }
  if (message.includes('issuer')) {
    return 'invalid_issuer'
  }
  if (message.includes('signature')) {
    return 'invalid_signature'
  }

  return 'invalid_token'
}

const logJwtValidationError = (message: string, error: JwtValidationError) => {
  logger.error(message, {
    reason: getAuthenticationFailureReason(error),
    code: error.code,
    error: error.inner?.message || error.message,
  })
}

const getProvider = (decodedJwt?: Express.DecodedJwt) =>
  decodedJwt?.idp || decodedJwt?.identity_provider

const isIdirProvider = (provider: unknown) =>
  provider === TMSConstants.IDIR_PROVIDER ||
  provider === TMSConstants.AZURE_IDIR_PROVIDER

const allowTmsIdirUser = (req: Request, res: Response): boolean => {
  const provider = getProvider(req.decodedJwt)

  if (!isIdirProvider(provider)) {
    logger.error('Invalid provider - TMS endpoints require IDIR access', {
      reason: 'unsupported_identity_provider',
      provider,
      expectedProvider: [
        TMSConstants.IDIR_PROVIDER,
        TMSConstants.AZURE_IDIR_PROVIDER,
      ],
    })
    sendUnauthorized(res, 'TMS endpoints require IDIR or Azure IDIR access')
    return false
  }

  req.idpType = 'idir'
  return true
}

const getAudience = (decodedJwt?: Express.DecodedJwt) =>
  typeof decodedJwt?.aud === 'string' ? decodedJwt.aud : undefined

const isTmsAudience = (audience?: string) =>
  Boolean(audience) && audience === config.oidc.tmsAudience

const findServiceForAudience = async (audience?: string) =>
  audience
    ? sharedServiceRepository.findSharedServiceByClientIdentifier(audience)
    : null

const runOrPassError = async (
  next: NextFunction,
  action: () => Promise<unknown>,
) => {
  try {
    await action()
  } catch (error: unknown) {
    next(error)
  }
}

const refuseNonTmsToken = async (req: Request, res: Response) => {
  const audience = getAudience(req.decodedJwt)
  const sharedService = await findServiceForAudience(audience)

  if (!sharedService) {
    logger.error('JWT validation failed', {
      reason: 'invalid_audience',
      code: 'invalid_token',
      error: 'jwt audience invalid',
    })
    return sendUnauthorized(res, 'Error occurred during authentication')
  }

  const canUseHeadless =
    sharedService.isActive && sharedService.allowHeadlessOps
  logger.error('Connected service called a route it cannot use', {
    reason: canUseHeadless ? 'web_app_only' : 'headless_not_allowed',
    audience,
  })
  return sendForbidden(
    res,
    canUseHeadless
      ? TMSConstants.HEADLESS_WEB_APP_ONLY
      : TMSConstants.HEADLESS_SERVICE_NOT_ALLOWED,
  )
}

const resolveHeadlessAccess = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const audience = getAudience(req.decodedJwt)

  if (isTmsAudience(audience)) {
    if (allowTmsIdirUser(req, res)) {
      next()
    }
    return
  }

  const sharedService = await findServiceForAudience(audience)

  if (!sharedService?.isActive || !sharedService.allowHeadlessOps) {
    logger.error('Connected service is not allowed headless access', {
      reason: 'headless_not_allowed',
      audience,
    })
    return sendForbidden(res, TMSConstants.HEADLESS_SERVICE_NOT_ALLOWED)
  }

  const provider = getProvider(req.decodedJwt)
  if (!isIdirProvider(provider)) {
    logger.error('Headless access requires an IDIR user', {
      reason: 'unsupported_identity_provider',
      provider,
    })
    return sendForbidden(res, TMSConstants.HEADLESS_IDIR_ONLY)
  }

  req.isHeadlessAccess = true
  req.headlessService = {
    id: sharedService.id,
    name: sharedService.name,
    displayName: sharedService.displayName,
    clientIdentifier: sharedService.clientIdentifier,
  }
  req.idpType = 'idir'
  next()
}

const createJwtMiddleware = () => {
  return jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      jwksUri: config.oidc.jwksUri,
      handleSigningKeyError: (err, cb) => {
        logger.error('JWT signing key lookup failed', {
          reason: 'jwks_error',
          error: err?.message,
          stack: err?.stack,
        })
        cb(new UnauthorizedError('Error occurred during authentication'))
      },
    }),
    issuer: config.oidc.issuer,
    algorithms: ['RS256'],
    requestProperty: 'decodedJwt',
    getToken: function fromHeaderOrQuerystring(req) {
      const authHeader = req.headers.authorization
      const [scheme, token] = authHeader?.split(' ') || []
      if (scheme === 'Bearer' && token) {
        return token
      }
      throw new UnauthorizedError('Bearer token is missing or invalid')
    },
  }).unless({ path: [RoutesConstants.HEALTH, RoutesConstants.JWKS] })
}

export const checkJwt = (options: CheckJwtOptions = {}) => {
  const middleware = createJwtMiddleware()
  const isWebAppOnly = !options.sharedServiceAccess && !options.headlessAccess

  return (req: Request, res: Response, next: NextFunction) => {
    middleware(req, res, async (err) => {
      if (err) {
        logJwtValidationError(
          'JWT validation failed',
          err as JwtValidationError,
        )

        return sendUnauthorized(res, 'Error occurred during authentication')
      }

      if (
        isWebAppOnly &&
        req.decodedJwt &&
        !isTmsAudience(getAudience(req.decodedJwt))
      ) {
        return runOrPassError(next, () => refuseNonTmsToken(req, res))
      }

      if (req.params.ssoUserId && !options.skipSsoUserParamMatch) {
        const tokenUserId: string | undefined =
          req.decodedJwt?.idir_user_guid || req.decodedJwt?.bceid_user_guid
        const requestedUserId: string = req.params.ssoUserId as string

        if (tokenUserId !== requestedUserId) {
          logger.error('JWT user does not match requested user', {
            reason: 'user_mismatch',
            route: req.route?.path,
          })

          return res.status(403).json({
            error: 'Forbidden',
            message:
              'Access denied - the requested user does not match the token user',
            statusCode: 403,
          })
        }
      }

      if (options.headlessAccess) {
        return runOrPassError(next, () => resolveHeadlessAccess(req, res, next))
      }

      if (options.sharedServiceAccess) {
        req.isSharedServiceAccess = true

        if (req.decodedJwt) {
          const provider =
            req.decodedJwt.idp || req.decodedJwt.identity_provider

          if (provider === TMSConstants.BCEID_BOTH_PROVIDER) {
            if (req.decodedJwt.bceid_business_guid) {
              req.idpType = 'bceidbusiness'
              logger.debug('Identity provider resolved', {
                provider: 'bceidbusiness',
              })
            } else {
              logger.error('Unsupported identity provider', {
                reason: 'unsupported_identity_provider',
                provider,
              })
              return sendUnauthorized(res, 'Unsupported identity provider')
            }
          } else if (provider === TMSConstants.BUSINESS_BCEID_PROVIDER) {
            req.idpType = 'bceidbusiness'
          } else if (
            provider === TMSConstants.IDIR_PROVIDER ||
            provider === TMSConstants.AZURE_IDIR_PROVIDER
          ) {
            req.idpType = 'idir'
          } else if (provider) {
            logger.error('Invalid provider for shared service access', {
              reason: 'unsupported_identity_provider',
              provider,
            })
            return sendUnauthorized(res, 'Unsupported identity provider')
          }
        }
      } else if (req.decodedJwt && !allowTmsIdirUser(req, res)) {
        return
      }

      next()
    })
  }
}

export const extractOidcSub = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.decodedJwt) {
    logger.debug('Authenticated request', {
      provider: req.decodedJwt.idp || req.decodedJwt.identity_provider,
    })
    next()
  } else {
    logger.error('No decodedJwt found in request')
    sendUnauthorized(res, 'Error occurred during authentication')
  }
}

export const jwtErrorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof Error && err.name === 'UnauthorizedError') {
    logJwtValidationError('JWT validation failed', err as JwtValidationError)

    return sendUnauthorized(res, 'Error occurred during authentication')
  }
  next(err)
}
