import { Request, Response } from 'express'
import { tenantRequestService } from '../services/tenant-request.service'
import { handleControllerError } from '../common/error.handler'

export class TenantRequestController {
  public async createTenantRequest(req: Request, res: Response) {
    try {
      const tenantRequest = await tenantRequestService.createTenantRequest(req)
      res.status(201).send(tenantRequest)
    } catch (error: unknown) {
      handleControllerError(
        res,
        error,
        'Error occurred creating tenant request',
      )
    }
  }

  public async updateTenantRequestStatus(req: Request, res: Response) {
    try {
      const response = await tenantRequestService.updateTenantRequestStatus(req)
      res.status(200).send(response)
    } catch (error: unknown) {
      handleControllerError(
        res,
        error,
        'Error occurred updating tenant request status',
      )
    }
  }

  public async getTenantRequests(req: Request, res: Response) {
    try {
      const response = await tenantRequestService.getTenantRequests(req)
      res.status(200).send(response)
    } catch (error: unknown) {
      handleControllerError(
        res,
        error,
        'Error occurred getting tenant requests',
      )
    }
  }

  public async getUserTenantRequests(req: Request, res: Response) {
    try {
      const response = await tenantRequestService.getUserTenantRequests(req)
      res.status(200).send(response)
    } catch (error: unknown) {
      handleControllerError(
        res,
        error,
        'Error occurred getting tenant requests',
      )
    }
  }
}

export const tenantRequestController = new TenantRequestController()
