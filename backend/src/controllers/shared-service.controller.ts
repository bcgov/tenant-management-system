import { Request, Response } from 'express'
import { sharedServiceService } from '../services/shared-service.service'
import { handleControllerError } from '../common/error.handler'

export class SharedServiceController {
  public async createSharedService(req: Request, res: Response) {
    try {
      const sharedService = await sharedServiceService.createSharedService(req)
      res.status(201).send(sharedService)
    } catch (error: unknown) {
      handleControllerError(
        res,
        error,
        'Error occurred creating shared service',
      )
    }
  }

  public async updateSharedService(req: Request, res: Response) {
    try {
      const sharedService = await sharedServiceService.updateSharedService(req)
      res.status(200).send(sharedService)
    } catch (error: unknown) {
      handleControllerError(
        res,
        error,
        'Error occurred updating shared service',
      )
    }
  }

  public async addSharedServiceRoles(req: Request, res: Response) {
    try {
      const result = await sharedServiceService.addSharedServiceRoles(req)
      res.status(201).send(result)
    } catch (error: unknown) {
      handleControllerError(
        res,
        error,
        'Error occurred adding shared service roles',
      )
    }
  }

  public async updateSharedServiceRole(req: Request, res: Response) {
    try {
      const result = await sharedServiceService.updateSharedServiceRole(req)
      res.status(200).send(result)
    } catch (error: unknown) {
      handleControllerError(
        res,
        error,
        'Error occurred updating shared service role',
      )
    }
  }

  public async updateSharedServiceStatus(req: Request, res: Response) {
    try {
      const result = await sharedServiceService.updateSharedServiceStatus(req)
      res.status(200).send(result)
    } catch (error: unknown) {
      handleControllerError(
        res,
        error,
        'Error occurred updating shared service status',
      )
    }
  }

  public async associateSharedServiceToTenant(req: Request, res: Response) {
    try {
      await sharedServiceService.associateSharedServiceToTenant(req)
      res.status(201).send()
    } catch (error: unknown) {
      handleControllerError(
        res,
        error,
        'Error occurred associating shared service to tenant',
      )
    }
  }

  public async getAllActiveSharedServices(_req: Request, res: Response) {
    try {
      const sharedServices =
        await sharedServiceService.getAllActiveSharedServices()
      res.status(200).send(sharedServices)
    } catch (error: unknown) {
      handleControllerError(
        res,
        error,
        'Error occurred getting active shared services',
      )
    }
  }

  public async getSharedServicesForTenant(req: Request, res: Response) {
    try {
      const sharedServices =
        await sharedServiceService.getSharedServicesForTenant(req)
      res.status(200).send(sharedServices)
    } catch (error: unknown) {
      handleControllerError(
        res,
        error,
        'Error occurred getting shared services for tenant',
      )
    }
  }
}

export const sharedServiceController = new SharedServiceController()
