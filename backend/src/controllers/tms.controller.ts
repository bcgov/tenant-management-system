import { Request, Response } from 'express'
import { TMSService } from '../services/tms.service'
import { ErrorHandler, getErrorMessage } from '../common/error.handler'
import { NotFoundError } from '../errors/NotFoundError'
import { ConflictError } from '../errors/ConflictError'
import { BadRequestError } from '../errors/BadRequestError'
import logger from '../common/logger'
import { ForbiddenError } from '../errors/ForbiddenError'

export class TMSController {
  tmsService: TMSService = new TMSService()
  errorHandler: ErrorHandler = new ErrorHandler()

  public async health(req: Request, res: Response) {
    const currentTimestamp = new Date().toISOString()
    res.status(200).send({
      apiStatus: 'Healthy',
      time: currentTimestamp,
    })
  }

  public async createTenant(req: Request, res: Response) {
    try {
      const tenantResponse = await this.tmsService.createTenant(req)
      res.status(201).send(tenantResponse)
    } catch (error: unknown) {
      logger.error(getErrorMessage(error))
      if (error instanceof ConflictError) {
        this.errorHandler.generalError(
          res,
          'Error occurred adding user to the tenant',
          getErrorMessage(error),
          error.statusCode,
          'Conflict',
        )
      } else {
        this.errorHandler.generalError(
          res,
          'Error occurred during tenant creation',
          getErrorMessage(error),
          500,
          'Internal Server Error',
        )
      }
    }
  }

  public async addTenantUser(req: Request, res: Response) {
    try {
      const response = await this.tmsService.addTenantUser(req)
      res.status(201).send(response)
    } catch (error: unknown) {
      logger.error(getErrorMessage(error))
      if (error instanceof NotFoundError) {
        this.errorHandler.generalError(
          res,
          'Error occurred adding user to the tenant',
          getErrorMessage(error),
          error.statusCode,
          'Not Found',
        )
      } else if (error instanceof ConflictError) {
        this.errorHandler.generalError(
          res,
          'Error occurred adding user to the tenant',
          getErrorMessage(error),
          error.statusCode,
          'Conflict',
        )
      } else {
        this.errorHandler.generalError(
          res,
          'Error occurred adding user to the tenant',
          getErrorMessage(error),
          500,
          'Internal Server Error',
        )
      }
    }
  }

  public async getTenantsForUser(req: Request, res: Response) {
    try {
      const tenants = await this.tmsService.getTenantsForUser(req)
      res.status(200).send(tenants)
    } catch (error: unknown) {
      logger.error(getErrorMessage(error))
      this.errorHandler.generalError(
        res,
        'Error occurred getting tenants for a user',
        getErrorMessage(error),
        500,
        'Internal Server Error',
      )
    }
  }

  public async getUsersForTenant(req: Request, res: Response) {
    try {
      const users = await this.tmsService.getUsersForTenant(req)
      res.status(200).send(users)
    } catch (error: unknown) {
      logger.error(getErrorMessage(error))
      this.errorHandler.generalError(
        res,
        'Error occurred getting users for a tenant',
        getErrorMessage(error),
        500,
        'Internal Server Error',
      )
    }
  }

  public async createRoles(req: Request, res: Response) {
    try {
      const role = await this.tmsService.createRoles(req)
      res.status(201).send(role)
    } catch (error: unknown) {
      logger.error(getErrorMessage(error))
      if (error instanceof NotFoundError) {
        this.errorHandler.generalError(
          res,
          'Error occurred creating role',
          getErrorMessage(error),
          error.statusCode,
          'Not Found',
        )
      } else if (error instanceof ConflictError) {
        this.errorHandler.generalError(
          res,
          'Error occurred creating role',
          getErrorMessage(error),
          error.statusCode,
          'Conflict',
        )
      } else {
        this.errorHandler.generalError(
          res,
          'Error occurred creating role',
          getErrorMessage(error),
          500,
          'Internal Server Error',
        )
      }
    }
  }

  public async assignUserRoles(req: Request, res: Response) {
    try {
      const userRole = await this.tmsService.assignUserRoles(req)
      res.status(201).send(userRole)
    } catch (error: unknown) {
      logger.error(getErrorMessage(error))
      if (error instanceof NotFoundError) {
        this.errorHandler.generalError(
          res,
          'Error occurred assigning user role',
          getErrorMessage(error),
          error.statusCode,
          'Not Found',
        )
      } else if (error instanceof ConflictError) {
        this.errorHandler.generalError(
          res,
          'Error occurred assigning user role',
          getErrorMessage(error),
          error.statusCode,
          'Conflict',
        )
      } else {
        this.errorHandler.generalError(
          res,
          'Error occurred assigning user role',
          getErrorMessage(error),
          500,
          'Internal Server Error',
        )
      }
    }
  }

  public async getTenantRoles(req: Request, res: Response) {
    try {
      const roles = await this.tmsService.getTenantRoles(req)
      return res.status(200).send(roles)
    } catch (error: unknown) {
      logger.error(getErrorMessage(error))
      if (error instanceof NotFoundError) {
        this.errorHandler.generalError(
          res,
          'Error occurred getting tenant roles',
          getErrorMessage(error),
          error.statusCode,
          'Not Found',
        )
      } else {
        this.errorHandler.generalError(
          res,
          'Error occurred getting tenant roles',
          getErrorMessage(error),
          500,
          'Internal Server Error',
        )
      }
    }
  }

  public async getUserRoles(req: Request, res: Response) {
    try {
      const roles = await this.tmsService.getUserRoles(req)
      return res.status(200).send(roles)
    } catch (error: unknown) {
      logger.error(getErrorMessage(error))
      if (error instanceof NotFoundError) {
        this.errorHandler.generalError(
          res,
          'Error occurred getting roles for user',
          getErrorMessage(error),
          error.statusCode,
          'Not Found',
        )
      } else {
        this.errorHandler.generalError(
          res,
          'Error occurred getting roles for user',
          getErrorMessage(error),
          500,
          'Internal Server Error',
        )
      }
    }
  }

  public async unassignUserRoles(req: Request, res: Response) {
    try {
      await this.tmsService.unassignUserRoles(req)
      return res.status(204).send()
    } catch (error: unknown) {
      logger.error(getErrorMessage(error))
      if (error instanceof NotFoundError) {
        this.errorHandler.generalError(
          res,
          'Error occurred unassigning user role',
          getErrorMessage(error),
          error.statusCode,
          'Not Found',
        )
      } else if (error instanceof ConflictError) {
        this.errorHandler.generalError(
          res,
          'Error occurred unassigning user role',
          getErrorMessage(error),
          error.statusCode,
          'Conflict',
        )
      } else {
        this.errorHandler.generalError(
          res,
          'Error occurred unassigning user role',
          getErrorMessage(error),
          500,
          'Internal Server Error',
        )
      }
    }
  }

  public async searchBCGOVSSOUsers(req: Request, res: Response) {
    try {
      const users = await this.tmsService.searchBCGOVSSOUsers(req)
      return res.status(200).send(users)
    } catch (error: unknown) {
      logger.error(getErrorMessage(error))
      if (error instanceof BadRequestError) {
        this.errorHandler.generalError(
          res,
          'Error occurred searching SSO users',
          getErrorMessage(error),
          error.statusCode,
          'Bad Request',
        )
      } else {
        this.errorHandler.generalError(
          res,
          'Error occurred searching SSO users',
          getErrorMessage(error),
          500,
          'Internal Server Error',
        )
      }
    }
  }

  public async searchBCGOVSSOBceidUsers(req: Request, res: Response) {
    try {
      const users = await this.tmsService.searchBCGOVSSOBceidUsers(req)
      return res.status(200).send(users)
    } catch (error: unknown) {
      logger.error(getErrorMessage(error))
      if (error instanceof BadRequestError) {
        this.errorHandler.generalError(
          res,
          'Error occurred searching BCEID users',
          getErrorMessage(error),
          error.statusCode,
          'Bad Request',
        )
      } else {
        this.errorHandler.generalError(
          res,
          'Error occurred searching BCEID users',
          getErrorMessage(error),
          500,
          'Internal Server Error',
        )
      }
    }
  }

  public async getTenant(req: Request, res: Response) {
    try {
      const tenant = await this.tmsService.getTenant(req)
      return res.status(200).send(tenant)
    } catch (error: unknown) {
      logger.error(getErrorMessage(error))
      if (error instanceof NotFoundError) {
        this.errorHandler.generalError(
          res,
          'Error occurred getting a tenant',
          getErrorMessage(error),
          error.statusCode,
          'Not Found',
        )
      } else if (error instanceof ForbiddenError) {
        this.errorHandler.generalError(
          res,
          'Error occured getting a tenant',
          getErrorMessage(error),
          error.statusCode,
          'Forbidden',
        )
      } else {
        this.errorHandler.generalError(
          res,
          'Error occurred getting a tenant',
          getErrorMessage(error),
          500,
          'Internal Server Error',
        )
      }
    }
  }

  public async updateTenant(req: Request, res: Response) {
    try {
      const tenant = await this.tmsService.updateTenant(req)
      return res.status(200).send(tenant)
    } catch (error: unknown) {
      logger.error(getErrorMessage(error))
      if (error instanceof NotFoundError) {
        this.errorHandler.generalError(
          res,
          'Error occurred updating tenant',
          getErrorMessage(error),
          error.statusCode,
          'Not Found',
        )
      } else if (error instanceof ConflictError) {
        this.errorHandler.generalError(
          res,
          'Error occurred updating tenant',
          getErrorMessage(error),
          error.statusCode,
          'Conflict',
        )
      } else {
        this.errorHandler.generalError(
          res,
          'Error occurred updating tenant',
          getErrorMessage(error),
          500,
          'Internal Server Error',
        )
      }
    }
  }

  public async getRolesForSSOUser(req: Request, res: Response) {
    try {
      const roles = await this.tmsService.getRolesForSSOUser(req)
      return res.status(200).send(roles)
    } catch (error: unknown) {
      logger.error(getErrorMessage(error))
      if (error instanceof NotFoundError) {
        this.errorHandler.generalError(
          res,
          'Error occurred getting roles for SSO user',
          getErrorMessage(error),
          error.statusCode,
          'Not Found',
        )
      } else {
        this.errorHandler.generalError(
          res,
          'Error occurred getting roles for SSO user',
          getErrorMessage(error),
          500,
          'Internal Server Error',
        )
      }
    }
  }

  public async createTenantRequest(req: Request, res: Response) {
    try {
      const tenantRequest = await this.tmsService.createTenantRequest(req)
      res.status(201).send(tenantRequest)
    } catch (error: unknown) {
      logger.error(getErrorMessage(error))
      if (error instanceof ConflictError) {
        this.errorHandler.generalError(
          res,
          'Error occurred creating tenant request',
          getErrorMessage(error),
          error.statusCode,
          'Conflict',
        )
      } else {
        this.errorHandler.generalError(
          res,
          'Error occurred creating tenant request',
          getErrorMessage(error),
          500,
          'Internal Server Error',
        )
      }
    }
  }

  public async updateTenantRequestStatus(req: Request, res: Response) {
    try {
      const response = await this.tmsService.updateTenantRequestStatus(req)
      res.status(200).send(response)
    } catch (error: unknown) {
      logger.error(getErrorMessage(error))
      if (error instanceof NotFoundError) {
        this.errorHandler.generalError(
          res,
          'Error occurred updating tenant request status',
          getErrorMessage(error),
          error.statusCode,
          'Not Found',
        )
      } else if (error instanceof ConflictError) {
        this.errorHandler.generalError(
          res,
          'Error occurred updating tenant request status',
          getErrorMessage(error),
          error.statusCode,
          'Conflict',
        )
      } else {
        this.errorHandler.generalError(
          res,
          'Error occurred updating tenant request status',
          getErrorMessage(error),
          500,
          'Internal Server Error',
        )
      }
    }
  }

  public async getTenantRequests(req: Request, res: Response) {
    try {
      const response = await this.tmsService.getTenantRequests(req)
      res.status(200).send(response)
    } catch (error: unknown) {
      logger.error(getErrorMessage(error))
      this.errorHandler.generalError(
        res,
        'Error occurred getting tenant requests',
        getErrorMessage(error),
        500,
        'Internal Server Error',
      )
    }
  }

  public async createSharedService(req: Request, res: Response) {
    try {
      const sharedService = await this.tmsService.createSharedService(req)
      res.status(201).send(sharedService)
    } catch (error: unknown) {
      logger.error(getErrorMessage(error))
      if (error instanceof ConflictError) {
        this.errorHandler.generalError(
          res,
          'Error occurred creating shared service',
          getErrorMessage(error),
          error.statusCode,
          'Conflict',
        )
      } else {
        this.errorHandler.generalError(
          res,
          'Error occurred creating shared service',
          getErrorMessage(error),
          500,
          'Internal Server Error',
        )
      }
    }
  }

  public async addSharedServiceRoles(req: Request, res: Response) {
    try {
      const result = await this.tmsService.addSharedServiceRoles(req)
      res.status(201).send(result)
    } catch (error: unknown) {
      logger.error(getErrorMessage(error))
      if (error instanceof ConflictError) {
        this.errorHandler.generalError(
          res,
          'Error occurred adding shared service roles',
          getErrorMessage(error),
          error.statusCode,
          'Conflict',
        )
      } else if (error instanceof NotFoundError) {
        this.errorHandler.generalError(
          res,
          'Error occurred adding shared service roles',
          getErrorMessage(error),
          error.statusCode,
          'Not Found',
        )
      } else {
        this.errorHandler.generalError(
          res,
          'Error occurred adding shared service roles',
          getErrorMessage(error),
          500,
          'Internal Server Error',
        )
      }
    }
  }

  public async associateSharedServiceToTenant(req: Request, res: Response) {
    try {
      await this.tmsService.associateSharedServiceToTenant(req)
      res.status(201).send()
    } catch (error: unknown) {
      logger.error(getErrorMessage(error))
      if (error instanceof NotFoundError) {
        this.errorHandler.generalError(
          res,
          'Error occurred associating shared service to tenant',
          getErrorMessage(error),
          error.statusCode,
          'Not Found',
        )
      } else if (error instanceof ConflictError) {
        this.errorHandler.generalError(
          res,
          'Error occurred associating shared service to tenant',
          getErrorMessage(error),
          error.statusCode,
          'Conflict',
        )
      } else {
        this.errorHandler.generalError(
          res,
          'Error occurred associating shared service to tenant',
          getErrorMessage(error),
          500,
          'Internal Server Error',
        )
      }
    }
  }

  public async getAllActiveSharedServices(req: Request, res: Response) {
    try {
      const sharedServices =
        await this.tmsService.getAllActiveSharedServices(req)
      res.status(200).send(sharedServices)
    } catch (error: unknown) {
      logger.error(getErrorMessage(error))
      this.errorHandler.generalError(
        res,
        'Error occurred getting active shared services',
        getErrorMessage(error),
        500,
        'Internal Server Error',
      )
    }
  }

  public async getSharedServicesForTenant(req: Request, res: Response) {
    try {
      const sharedServices =
        await this.tmsService.getSharedServicesForTenant(req)
      res.status(200).send(sharedServices)
    } catch (error: unknown) {
      logger.error(getErrorMessage(error))
      this.errorHandler.generalError(
        res,
        'Error occurred getting shared services for tenant',
        getErrorMessage(error),
        500,
        'Internal Server Error',
      )
    }
  }

  public async removeTenantUser(req: Request, res: Response) {
    try {
      await this.tmsService.removeTenantUser(req)
      res.status(204).send()
    } catch (error: unknown) {
      logger.error(getErrorMessage(error))
      if (error instanceof NotFoundError) {
        this.errorHandler.generalError(
          res,
          'Error occurred removing tenant user',
          getErrorMessage(error),
          error.statusCode,
          'Not Found',
        )
      } else if (error instanceof ConflictError) {
        this.errorHandler.generalError(
          res,
          'Error occurred removing tenant user',
          getErrorMessage(error),
          error.statusCode,
          'Conflict',
        )
      } else if (error instanceof BadRequestError) {
        this.errorHandler.generalError(
          res,
          'Error occurred removing tenant user',
          getErrorMessage(error),
          error.statusCode,
          'Bad Request',
        )
      } else {
        this.errorHandler.generalError(
          res,
          'Error occurred removing tenant user',
          getErrorMessage(error),
          500,
          'Internal Server Error',
        )
      }
    }
  }

  public async getTenantUser(req: Request, res: Response) {
    try {
      const tenantUserResponse = await this.tmsService.getTenantUser(req)
      res.status(200).send(tenantUserResponse)
    } catch (error: unknown) {
      logger.error(getErrorMessage(error))
      if (error instanceof NotFoundError) {
        this.errorHandler.generalError(
          res,
          'Error occurred getting tenant user',
          getErrorMessage(error),
          error.statusCode,
          'Not Found',
        )
      } else if (error instanceof BadRequestError) {
        this.errorHandler.generalError(
          res,
          'Error occurred getting tenant user',
          getErrorMessage(error),
          error.statusCode,
          'Bad Request',
        )
      } else {
        this.errorHandler.generalError(
          res,
          'Error occurred getting tenant user',
          getErrorMessage(error),
          500,
          'Internal Server Error',
        )
      }
    }
  }
}
