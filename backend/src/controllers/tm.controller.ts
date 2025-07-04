import { Request, Response } from 'express'
import { TMService } from '../services/tm.service'
import { ErrorHandler } from '../common/error.handler'
import { NotFoundError } from '../errors/NotFoundError'
import { ConflictError } from '../errors/ConflictError'
import logger from '../common/logger'

export class TMController {

    tmService: TMService = new TMService()
    errorHandler: ErrorHandler = new ErrorHandler()

    public async createGroup(req: Request, res: Response) {
        try {
            const groupResponse = await this.tmService.createGroup(req)
            res.status(201).send(groupResponse)
        } 
        catch(error) {
            logger.error(error)
            if (error instanceof ConflictError) {
                this.errorHandler.generalError(res, "Error occurred creating group", error.message, error.statusCode, "Conflict")
            } 
            else if (error instanceof NotFoundError) {
                this.errorHandler.generalError(res, "Error occurred creating group", error.message, error.statusCode, "Not Found")
            }
            else {
                this.errorHandler.generalError(res, "Error occurred creating group", error.message, 500, "Internal Server Error")
            }
        }
    }

    public async addGroupUser(req: Request, res: Response) {
        try {
            const groupUserResponse = await this.tmService.addGroupUser(req)
            res.status(201).send(groupUserResponse)
        } 
        catch(error) {
            logger.error(error)
            if (error instanceof ConflictError) {
                this.errorHandler.generalError(res, "Error occurred adding user to group", error.message, error.statusCode, "Conflict")
            } 
            else if (error instanceof NotFoundError) {
                this.errorHandler.generalError(res, "Error occurred adding user to group", error.message, error.statusCode, "Not Found")
            }
            else {
                this.errorHandler.generalError(res, "Error occurred adding user to group", error.message, 500, "Internal Server Error")
            }
        }
    }

    public async updateGroup(req: Request, res: Response) {
        try {
            const groupResponse = await this.tmService.updateGroup(req)
            res.status(200).send(groupResponse)
        } 
        catch(error) {
            logger.error(error)
            if (error instanceof ConflictError) {
                this.errorHandler.generalError(res, "Error occurred updating group", error.message, error.statusCode, "Conflict")
            } 
            else if (error instanceof NotFoundError) {
                this.errorHandler.generalError(res, "Error occurred updating group", error.message, error.statusCode, "Not Found")
            }
            else {
                this.errorHandler.generalError(res, "Error occurred updating group", error.message, 500, "Internal Server Error")
            }
        }
    }

    public async removeGroupUser(req: Request, res: Response) {
        try {
            await this.tmService.removeGroupUser(req)
            res.status(204).send()
        } 
        catch(error) {
            logger.error(error)
            if (error instanceof ConflictError) {
                this.errorHandler.generalError(res, "Error occurred removing user from group", error.message, error.statusCode, "Conflict")
            } 
            else if (error instanceof NotFoundError) {
                this.errorHandler.generalError(res, "Error occurred removing user from group", error.message, error.statusCode, "Not Found")
            }
            else {
                this.errorHandler.generalError(res, "Error occurred removing user from group", error.message, 500, "Internal Server Error")
            }
        }
    }

    public async getGroup(req: Request, res: Response) {
        try {
            const groupResponse = await this.tmService.getGroup(req)
            res.status(200).send(groupResponse)
        } 
        catch(error) {
            logger.error(error)
            if (error instanceof NotFoundError) {
                this.errorHandler.generalError(res, "Error occurred getting a group", error.message, error.statusCode, "Not Found")
            }
            else {
                this.errorHandler.generalError(res, "Error occurred getting a group", error.message, 500, "Internal Server Error")
            }
        }
    }

    public async getTenantGroups(req: Request, res: Response) {
        try {
            const groupsResponse = await this.tmService.getTenantGroups(req)
            res.status(200).send(groupsResponse)
        } 
        catch(error) {
            logger.error(error)
            if (error instanceof NotFoundError) {
                this.errorHandler.generalError(res, "Error occurred getting tenant groups", error.message, error.statusCode, "Not Found")
            }
            else {
                this.errorHandler.generalError(res, "Error occurred getting tenant groups", error.message, 500, "Internal Server Error")
            }
        }
    }

    public async getSharedServiceRolesForGroup(req: Request, res: Response) {
        try {
            const sharedServiceRolesResponse = await this.tmService.getSharedServiceRolesForGroup(req)
            res.status(200).send(sharedServiceRolesResponse)
        } 
        catch(error) {
            logger.error(error)
            if (error instanceof NotFoundError) {
                this.errorHandler.generalError(res, "Error occurred getting shared service roles for group", error.message, error.statusCode, "Not Found")
            }
            else {
                this.errorHandler.generalError(res, "Error occurred getting shared service roles for group", error.message, 500, "Internal Server Error")
            }
        }
    }

    public async updateSharedServiceRolesForGroup(req: Request, res: Response) {
        try {
            const sharedServiceRolesResponse = await this.tmService.updateSharedServiceRolesForGroup(req)
            res.status(200).send(sharedServiceRolesResponse)
        } 
        catch(error) {
            logger.error(error)
            if (error instanceof NotFoundError) {
                this.errorHandler.generalError(res, "Error occurred updating shared service roles for group", error.message, error.statusCode, "Not Found")
            }
            else if (error instanceof ConflictError) {
                this.errorHandler.generalError(res, "Error occurred updating shared service roles for group", error.message, error.statusCode, "Conflict")
            }
            else {
                this.errorHandler.generalError(res, "Error occurred updating shared service roles for group", error.message, 500, "Internal Server Error")
            }
        }
    }
} 