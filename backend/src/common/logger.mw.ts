import { Request, Response, NextFunction } from 'express';
import logger from '../common/logger';
import { RoutesConstants } from './routes.constants';

export const requestLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const rawPath = req.originalUrl?.split('?')[0] || req.url?.split('?')[0] || req.path;
    if (
        rawPath === RoutesConstants.HEALTH ||
        rawPath === '/health' ||
        rawPath === `/api${RoutesConstants.HEALTH}` ||
        rawPath.startsWith(RoutesConstants.HEALTH + '/') ||
        rawPath.startsWith('/health/') ||
        rawPath.startsWith(`/api${RoutesConstants.HEALTH}/`)
    ) {
        return next()
    }

    if (logger.isLevelEnabled('info')) {
        logger.info('Incoming request', {
            method: req.method,
            url: req.url,
            params: req.params,
            query: req.query,
            body: req.method !== 'GET' ? req.body : undefined
        });
    }

    if (!(res as any)._loggedResponse) {
        const originalSend = res.send;

        res.send = function (body) {
            if (!(res as any)._loggedResponse) {
                const responseTime = Date.now() - startTime;
                
                if (logger.isLevelEnabled('info')) {
                    logger.info('Outgoing response', {
                        method: req.method,
                        url: req.url,
                        statusCode: res.statusCode,
                        responseTime: `${responseTime}ms`
                    });
                }
                (res as any)._loggedResponse = true; // Set flag to prevent duplicate logging
            }

            return originalSend.call(this, body);
        };
    }
    next();
};
