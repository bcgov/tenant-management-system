import { Request, Response, NextFunction } from 'express'
import { UnauthorizedError } from '../errors/UnauthorizedError'
import logger from './logger'

export const checkOperationsAdmin = (req: Request, res: Response, next: NextFunction) => {
    try {
        const roles = req.decodedJwt?.roles || []
        
        if (!roles.includes('TMS.OPERATIONS_ADMIN')) {
            logger.warn('Access denied: User does not have TMS.OPERATIONS_ADMIN role', {
                userId: req.decodedJwt?.idir_user_guid,
                roles: roles
            })
            throw new UnauthorizedError('Access denied: Operations Admin role required')
        }

        next()
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            res.status(403).json({
                errorMessage: 'Forbidden',
                httpResponseCode: 403,
                message: error.message,
                name: 'Unauthorized access'
            })
        } else {
            logger.error('Error checking operations admin role', error)
            res.status(500).json({
                errorMessage: 'Internal Server Error',
                httpResponseCode: 500,
                message: 'Error checking operations admin role',
                name: 'Server error'
            })
        }
    }
} 