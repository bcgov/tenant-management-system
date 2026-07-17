import { Request, Response } from 'express'
import { tenantService } from '../services/tenant.service'
import { handleControllerError } from '../common/error.handler'

export class TenantController {
  public async createTenant(req: Request, res: Response) {
    try {
      const tenantResponse = await tenantService.createTenant(req)
      res.status(201).send(tenantResponse)
    } catch (error: unknown) {
      handleControllerError(res, error, 'Error occurred during tenant creation')
    }
  }

  public async addTenantUser(req: Request, res: Response) {
    try {
      const response = await tenantService.addTenantUser(req)
      res.status(201).send(response)
    } catch (error: unknown) {
      handleControllerError(
        res,
        error,
        'Error occurred adding user to the tenant',
      )
    }
  }

  public async getTenantsForUser(req: Request, res: Response) {
    try {
      const tenants = await tenantService.getTenantsForUser(req)
      res.status(200).send(tenants)
    } catch (error: unknown) {
      handleControllerError(
        res,
        error,
        'Error occurred getting tenants for a user',
      )
    }
  }

  public async getUsersForTenant(req: Request, res: Response) {
    try {
      const users = await tenantService.getUsersForTenant(req)
      res.status(200).send(users)
    } catch (error: unknown) {
      handleControllerError(
        res,
        error,
        'Error occurred getting users for a tenant',
      )
    }
  }

  public async createRoles(req: Request, res: Response) {
    try {
      const role = await tenantService.createRoles(req)
      res.status(201).send(role)
    } catch (error: unknown) {
      handleControllerError(res, error, 'Error occurred creating role')
    }
  }

  public async assignUserRoles(req: Request, res: Response) {
    try {
      const userRole = await tenantService.assignUserRoles(req)
      res.status(201).send(userRole)
    } catch (error: unknown) {
      handleControllerError(res, error, 'Error occurred assigning user role')
    }
  }

  public async getTenantRoles(req: Request, res: Response) {
    try {
      const roles = await tenantService.getTenantRoles(req)
      res.status(200).send(roles)
    } catch (error: unknown) {
      handleControllerError(res, error, 'Error occurred getting tenant roles')
    }
  }

  public async getUserRoles(req: Request, res: Response) {
    try {
      const roles = await tenantService.getUserRoles(req)
      res.status(200).send(roles)
    } catch (error: unknown) {
      handleControllerError(res, error, 'Error occurred getting roles for user')
    }
  }

  public async unassignUserRoles(req: Request, res: Response) {
    try {
      await tenantService.unassignUserRoles(req)
      res.status(204).send()
    } catch (error: unknown) {
      handleControllerError(res, error, 'Error occurred unassigning user role')
    }
  }

  public async getTenant(req: Request, res: Response) {
    try {
      const tenant = await tenantService.getTenant(req)
      res.status(200).send(tenant)
    } catch (error: unknown) {
      handleControllerError(res, error, 'Error occurred getting a tenant')
    }
  }

  public async updateTenant(req: Request, res: Response) {
    try {
      const tenant = await tenantService.updateTenant(req)
      res.status(200).send(tenant)
    } catch (error: unknown) {
      handleControllerError(res, error, 'Error occurred updating tenant')
    }
  }

  public async getRolesForSSOUser(req: Request, res: Response) {
    try {
      const roles = await tenantService.getRolesForSSOUser(req)
      res.status(200).send(roles)
    } catch (error: unknown) {
      handleControllerError(
        res,
        error,
        'Error occurred getting roles for SSO user',
      )
    }
  }

  public async removeTenantUser(req: Request, res: Response) {
    try {
      await tenantService.removeTenantUser(req)
      res.status(204).send()
    } catch (error: unknown) {
      handleControllerError(res, error, 'Error occurred removing tenant user')
    }
  }

  public async getTenantUser(req: Request, res: Response) {
    try {
      const tenantUserResponse = await tenantService.getTenantUser(req)
      res.status(200).send(tenantUserResponse)
    } catch (error: unknown) {
      handleControllerError(res, error, 'Error occurred getting tenant user')
    }
  }
}

export const tenantController = new TenantController()
