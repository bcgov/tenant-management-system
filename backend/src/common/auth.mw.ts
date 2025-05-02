import { Request, Response, NextFunction } from 'express';
import { expressjwt as jwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import logger from './logger';
import { UnauthorizedError } from '../errors/UnauthorizedError';
import {RoutesConstants} from './routes.constants'

const ALLOWED_AUDIENCES = process.env.ALLOWED_AUDIENCES 
  ? process.env.ALLOWED_AUDIENCES.split(',') 
  : ['tenant-manager-poc-5908'];

declare global {
  namespace Express {
    interface Request {
      decodedJwt?: {
        [key: string]: any;
      };
    }
  }
}

export const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    jwksUri: process.env.JWKS_URI,
    handleSigningKeyError: (err, cb) => {
      logger.error('Error:', { error: err.message, stack: err.stack });
      cb(new UnauthorizedError('Error ocurred during authentication'));
    }
  }),
  issuer: process.env.ISSUER,
  audience: ALLOWED_AUDIENCES,
  algorithms: ['RS256'],
  requestProperty: 'decodedJwt',
  getToken: function fromHeaderOrQuerystring(req) {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
      const token = authHeader.split(' ')[1]
      logger.info('Token found:')
      return token;
    }
    throw new UnauthorizedError('Error ocurred during authentication');
  }
}).unless({ path: [RoutesConstants.HEALTH] });

export const extractOidcSub = (req: Request, res: Response, next: NextFunction) => {
  if (req.decodedJwt) {
    logger.info('Authenticated request', { 
      sub: req.decodedJwt.sub,
      token: req.headers.authorization?.split(' ')[1]?.substring(0, 20) + '...',
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
    logger.error('JWT Validation Error:', { 
      error: err.message,
      code: err.code,
      inner: err.inner?.message,
    });
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Error ocurred during authentication',
      statusCode: 401
    });
  }
  next(err);
}; 