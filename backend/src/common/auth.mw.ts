import { Request, Response, NextFunction } from 'express';
import { expressjwt as jwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import logger from './logger';
import { UnauthorizedError } from '../errors/UnauthorizedError';

const ALLOWED_AUDIENCES = process.env.ALLOWED_AUDIENCES 
  ? process.env.ALLOWED_AUDIENCES.split(',') 
  : ['tenant-manager-poc-5908'];

declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        [key: string]: any;
      };
    }
  }
}

export const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    jwksUri: 'https://dev.loginproxy.gov.bc.ca/auth/realms/standard/protocol/openid-connect/certs',
    handleSigningKeyError: (err, cb) => {
      logger.error('Error:', { error: err.message, stack: err.stack });
      cb(new UnauthorizedError('Invalid token signature'));
    }
  }),
  issuer: 'https://dev.loginproxy.gov.bc.ca/auth/realms/standard',
  audience: ALLOWED_AUDIENCES,
  algorithms: ['RS256'],
  requestProperty: 'user',
  getToken: function fromHeaderOrQuerystring(req) {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
      const token = authHeader.split(' ')[1]
      logger.info('Token found:')
      return token;
    }
    throw new UnauthorizedError('No token provided');
  }
}).unless({ path: ['/v1/health'] });

export const extractOidcSub = (req: Request, res: Response, next: NextFunction) => {
  if (req.user) {
    logger.info('Authenticated request', { 
      sub: req.user.sub,
      token: req.headers.authorization?.split(' ')[1]?.substring(0, 20) + '...',
      user: req.user
    });
    next();
  } else {
    logger.error('No user found in request', { 
      headers: req.headers,
      user: req.user 
    });
    res.status(401).json({ error: 'Unauthorized' });
  }
};

export const jwtErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.name === 'UnauthorizedError') {
    logger.error('JWT Validation Error:', { 
      error: err.message,
      code: err.code,
      inner: err.inner?.message,
      stack: err.stack
    });
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: err.message,
      statusCode: 401
    });
  }
  next(err);
}; 