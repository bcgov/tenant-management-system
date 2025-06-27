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
} 