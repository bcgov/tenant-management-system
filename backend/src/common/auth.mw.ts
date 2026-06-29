import { Request, Response, NextFunction } from 'express'
import { expressjwt as jwt } from 'express-jwt'
import jwksRsa from 'jwks-rsa'
import logger from './logger'
import { UnauthorizedError } from '../errors/UnauthorizedError'
import { RoutesConstants } from './routes.constants'
import { TMSConstants } from './tms.constants'
import { config } from '../services/config.service'

interface CheckJwtOptions {
  sharedServiceAccess?: boolean
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

const createJwtMiddleware = (options: CheckJwtOptions = {}) => {
  const { sharedServiceAccess = false } = options

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
    audience: sharedServiceAccess ? undefined : config.oidc.tmsAudience,
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
  }).unless({ path: [RoutesConstants.HEALTH] })
}

export const checkJwt = (options: CheckJwtOptions = {}) => {
  const middleware = createJwtMiddleware(options)

  return (req: Request, res: Response, next: NextFunction) => {
    middleware(req, res, (err) => {
      if (err) {
        logJwtValidationError(
          'JWT validation failed',
          err as JwtValidationError,
        )

        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Error occurred during authentication',
          statusCode: 401,
        })
      }

      if (req.params.ssoUserId && !options.skipSsoUserParamMatch) {
        const tokenUserId: string | undefined =
          req.decodedJwt?.idir_user_guid || req.decodedJwt?.bceid_user_guid
        const requestedUserId: string = req.params.ssoUserId

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
              return res.status(401).json({
                error: 'Unauthorized',
                message: 'Unsupported identity provider',
                statusCode: 401,
              })
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
            return res.status(401).json({
              error: 'Unauthorized',
              message: 'Unsupported identity provider',
              statusCode: 401,
            })
          }
        }
      } else if (req.decodedJwt) {
        const provider = req.decodedJwt.idp || req.decodedJwt.identity_provider

        if (
          provider !== TMSConstants.IDIR_PROVIDER &&
          provider !== TMSConstants.AZURE_IDIR_PROVIDER
        ) {
          logger.error('Invalid provider - TMS endpoints require IDIR access', {
            reason: 'unsupported_identity_provider',
            provider,
            expectedProvider: [
              TMSConstants.IDIR_PROVIDER,
              TMSConstants.AZURE_IDIR_PROVIDER,
            ],
          })
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'TMS endpoints require IDIR or Azure IDIR access',
            statusCode: 401,
          })
        }
        req.idpType = 'idir'
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
    res.status(401).json({ error: 'Error ocurred during authentication' })
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

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Error occurred during authentication',
      statusCode: 401,
    })
  }
  next(err)
}
