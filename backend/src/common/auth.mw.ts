import { Request, Response, NextFunction } from 'express';
import { expressjwt as jwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import logger from './logger';
import { UnauthorizedError } from '../errors/UnauthorizedError';
import {RoutesConstants} from './routes.constants'
import { TMSConstants } from './tms.constants';

const TMS_AUDIENCE = process.env.TMS_AUDIENCE || 'tenant-management-system-6014'

declare global {
  namespace Express {
    interface Request {
      decodedJwt?: {
        [key: string]: any;
      };
      isSharedServiceAccess?: boolean;
      bceidType?: 'bceidbasic' | 'bceidbusiness';
      idpType?: 'idir' | 'bceidbasic' | 'bceidbusiness'
    }
  }
}

interface CheckJwtOptions {
  sharedServiceAccess?: boolean
}

const determineBceidType = (decodedJwt: any): 'bceidbasic' | 'bceidbusiness' => {
  if (decodedJwt.bceid_business_guid) {
    return 'bceidbusiness';
  }
  return 'bceidbasic';
};

const createJwtMiddleware = (options: CheckJwtOptions = {}) => {
  const { sharedServiceAccess = false } = options
  
  return jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      jwksUri: process.env.JWKS_URI!,
      handleSigningKeyError: (err, cb) => {
        logger.error('Error:', { error: err?.message, stack: err?.stack });
        cb(new UnauthorizedError('Error occurred during authentication'));
      }
    }),
    issuer: process.env.ISSUER!,
    audience: sharedServiceAccess ? undefined : TMS_AUDIENCE,
    algorithms: ['RS256'],
    requestProperty: 'decodedJwt',
    getToken: function fromHeaderOrQuerystring(req) {
      const authHeader:string = req.headers.authorization!
      if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
        const token = authHeader.split(' ')[1]
        logger.info('Token found:')
        return token;
      }
      throw new UnauthorizedError('Error occurred during authentication');
    }
  }).unless({ path: [RoutesConstants.HEALTH] });
};

export const checkJwt = (options: CheckJwtOptions = {}) => {
  const middleware = createJwtMiddleware(options);
  
  return (req: Request, res: Response, next: NextFunction) => {
    middleware(req, res, (err) => {
      if (err) {
        logger.error('JWT Validation Error:', { 
          error: err.message,
          code: err.code,
          inner: err.inner?.message,
        });
        
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Error occurred during authentication',
          statusCode: 401
        });
      }
      
      if (options.sharedServiceAccess) {
        req.isSharedServiceAccess = true
        
        if (req.params.ssoUserId) {
        const tokenUserId: string = req.decodedJwt?.idir_user_guid || req.decodedJwt?.bceid_user_guid
          const requestedUserId: string = req.params.ssoUserId
          
          if (tokenUserId !== requestedUserId) {
            logger.error('User ID mismatch - token user does not match requested user', {
              tokenUserId,
              requestedUserId,
              sub: req.decodedJwt?.sub
            });
            
            return res.status(403).json({
              error: 'Forbidden',
              message: 'Access denied - the requested user does not match the token user',
              statusCode: 403
            });
          }
        }
        
        if (req.decodedJwt) {
          const provider = req.decodedJwt.idp || req.decodedJwt.identity_provider
          
          if (provider === TMSConstants.BCEID_BOTH_PROVIDER) {
            req.bceidType = determineBceidType(req.decodedJwt);
            req.idpType = req.bceidType;
            logger.info('BCeID type determined for shared service', { 
              bceidType: req.bceidType,
              sub: req.decodedJwt.sub,
              hasBusinessGuid: !!req.decodedJwt.bceid_business_guid
            });
          } else if (provider === TMSConstants.BASIC_BCEID_PROVIDER) {
            req.idpType = 'bceidbasic';
          } else if (provider === TMSConstants.BUSINESS_BCEID_PROVIDER) {
            req.idpType = 'bceidbusiness';
          } else {
            req.idpType = 'idir';
          }
        }
      } else if (req.decodedJwt) {
        const provider = req.decodedJwt.idp || req.decodedJwt.identity_provider

        if (provider !== TMSConstants.IDIR_PROVIDER && provider !== TMSConstants.AZURE_IDIR_PROVIDER) {
          logger.error('Invalid provider - TMS endpoints require IDIR access', { 
            provider, 
            sub: req.decodedJwt.sub,
            expectedProvider: [TMSConstants.IDIR_PROVIDER, TMSConstants.AZURE_IDIR_PROVIDER]
          });
          return res.status(401).json({ 
            error: 'Unauthorized',
            message: 'TMS endpoints require IDIR or Azure IDIR access',
            statusCode: 401
          });
        }
        req.idpType = 'idir';
      }
      
      next();
    });
  };
};

export const extractOidcSub = (req: Request, res: Response, next: NextFunction) => {
  if (req.decodedJwt) {
    logger.info('Authenticated request', { 
      sub: req.decodedJwt.sub,
   //   token: req.headers.authorization?.split(' ')[1]?.substring(0, 20) + '...',
      decodedJwt: req.decodedJwt
    });
    next();
  } else {
    logger.error('No decodedJwt found in request')
    res.status(401).json({ error: 'Error ocurred during authentication' })
  }
};

export const jwtErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.name === 'UnauthorizedError') {
    logger.error('JWT Validation Error (fallback):', { 
      error: err.message,
      code: err.code,
      inner: err.inner?.message,
    });
    
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Error occurred during authentication',
      statusCode: 401
    });
  }
  next(err);
}; 