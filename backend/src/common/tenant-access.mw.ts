import { Request, Response, NextFunction } from 'express';
import { TMSRepository } from '../repositories/tms.repository';
import { connection } from './db.connection';
import { ForbiddenError } from '../errors/ForbiddenError';
import logger from './logger';

export const checkTenantAccess = (requiredRoles?: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantId:string = req.params.tenantId;
            const ssoUserId:string = req.decodedJwt?.idir_user_guid;

            if (!tenantId || !ssoUserId) {
                throw new ForbiddenError('Missing tenant ID or user ID');
            }

            const tmsRepository:TMSRepository = new TMSRepository(connection.manager);
            const hasAccess:boolean = await tmsRepository.checkUserTenantAccess(tenantId, ssoUserId, requiredRoles);

            if (!hasAccess) {
                throw new ForbiddenError(`Access denied: User does not have required roles for tenant: ${tenantId}`);
            }

            next();
        } catch (error) {
            logger.error('Tenant access check failed:', error);
            if (error instanceof ForbiddenError) {
                res.status(403).json({ 
                    error: 'Forbidden',
                    message: error.message,
                    statusCode: 403
                });
            } else {
                next(error);
            }
        }
    };
}; 