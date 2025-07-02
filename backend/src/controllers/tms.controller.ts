import { Request, Response } from 'express'
import { TMSService } from '../services/tms.service'
import { ErrorHandler } from '../common/error.handler';
import { NotFoundError } from '../errors/NotFoundError';
import { ConflictError } from '../errors/ConflictError';
import logger from '../common/logger'
import { ForbiddenError } from '../errors/ForbiddenError';

export class TMSController {

    tmsService: TMSService = new TMSService()
    errorHandler:ErrorHandler = new ErrorHandler()

    public async health(req:Request, res:Response) {
        const currentTimestamp = new Date().toISOString();
        res.status(200).send(
            {
             apiStatus:'Healthy',
             time: currentTimestamp
            });
    }

    public async createTenant(req:Request, res:Response) {
    try {
        const tenantResponse = await this.tmsService.createTenant(req)
        res.status(201).send(tenantResponse);
    } 
    catch(error) {
            logger.error(error)
            if (error instanceof ConflictError) {
                this.errorHandler.generalError(res,"Error occurred adding user to the tenant", error.message, error.statusCode, "Conflict")
            } 
            else {
                this.errorHandler.generalError(res,"Error occurred during tenant creation", error.message, 500, "Internal Server Error")
            }
        }
    }

    public async addTenantUser(req:Request,res:Response) {
        try {
            const response = await this.tmsService.addTenantUser(req)
            res.status(201).send(response)
        }
        catch(error) {
            logger.error(error)
            if (error instanceof NotFoundError) {
                this.errorHandler.generalError(res,"Error occurred adding user to the tenant", error.message, error.statusCode, "Not Found")
            }
            else if (error instanceof ConflictError) {
                this.errorHandler.generalError(res,"Error occurred adding user to the tenant", error.message, error.statusCode, "Conflict")
            } 
            else {    
                this.errorHandler.generalError(res,"Error occurred adding user to the tenant", error.message, 500, "Internal Server Error")
            }        
        }
        }

    public async getTenantsForUser(req:Request,res:Response) {
        try {
            const tenants = await this.tmsService.getTenantsForUser(req)
            res.status(200).send(tenants)
        }
        catch(error) {
            logger.error(error)
            this.errorHandler.generalError(res,"Error occurred getting tenants for a user", error.message, 500, "Internal Server Error")
        }
              
    }

    public async getUsersForTenant(req:Request, res:Response) {
        try {
            const users = await this.tmsService.getUsersForTenant(req)
            res.status(200).send(users)
        }
        catch(error) {
            logger.error(error)
            this.errorHandler.generalError(res,"Error occurred getting users for a tenant", error.message, 500, "Internal Server Error")
        }
    }
    
    public async createRoles(req:Request, res:Response) {
        try {
            const role = await this.tmsService.createRoles(req)
            res.status(201).send(role)
        }
        catch(error) {
            logger.error(error)
            if (error instanceof NotFoundError) {
                this.errorHandler.generalError(res,"Error occurred creating role", error.message, error.statusCode, "Not Found")
            }
            else if (error instanceof ConflictError) {
                this.errorHandler.generalError(res,"Error occurred creating role", error.message, error.statusCode, "Conflict")
            } 
            else {    
                this.errorHandler.generalError(res,"Error occurred creating role", error.message, 500, "Internal Server Error")
            }        
        }
    }

    public async assignUserRoles(req:Request, res:Response) {
        try {
            const userRole = await this.tmsService.assignUserRoles(req)
            res.status(201).send(userRole)
        }
        catch(error) {
            logger.error(error)
            if (error instanceof NotFoundError) {
                this.errorHandler.generalError(res,"Error occurred assigning user role", error.message, error.statusCode, "Not Found")
            }
            else if (error instanceof ConflictError) {
                this.errorHandler.generalError(res,"Error occurred assigning user role", error.message, error.statusCode, "Conflict")
            } 
            else {    
                this.errorHandler.generalError(res,"Error occurred assigning user role", error.message, 500, "Internal Server Error")
            }        
        }
    }

    public async getTenantRoles(req:Request, res:Response) {
        try {
            const roles = await this.tmsService.getTenantRoles(req)
            return res.status(200).send(roles)
        }
        catch(error) {
            logger.error(error)
            if (error instanceof NotFoundError) {
                this.errorHandler.generalError(res,"Error occurred getting tenant roles", error.message, error.statusCode, "Not Found")
            }
            else {    
                this.errorHandler.generalError(res,"Error occurred getting tenant roles", error.message, 500, "Internal Server Error")
            } 
        }
    }

    public async getUserRoles(req:Request, res:Response) {
        try {
            const roles = await this.tmsService.getUserRoles(req)
            return res.status(200).send(roles)
        }
        catch(error) {
            logger.error(error)
            if (error instanceof NotFoundError) {
                this.errorHandler.generalError(res,"Error occurred getting roles for user", error.message, error.statusCode, "Not Found")
            }
            else {    
                this.errorHandler.generalError(res,"Error occurred getting roles for user", error.message, 500, "Internal Server Error")
            } 
        }
    }

    public async unassignUserRoles(req:Request,res:Response) {
        try {
            await this.tmsService.unassignUserRoles(req)
            return res.status(204).send()
        }
        catch(error) {
            logger.error(error)            
            if (error instanceof NotFoundError) {
                this.errorHandler.generalError(res,"Error occurred unassigning user role", error.message, error.statusCode, "Not Found")
            }
            else if (error instanceof ConflictError) {
                this.errorHandler.generalError(res,"Error occurred unassigning user role", error.message, error.statusCode, "Conflict")
            }
            else {    
                this.errorHandler.generalError(res,"Error occurred unassigning user role", error.message, 500, "Internal Server Error")
            } 
        }
    }

    public async searchBCGOVSSOUsers(req:Request,res:Response) {
        try {
            const users = await this.tmsService.searchBCGOVSSOUsers(req)
            return res.status(200).send(users)
        }
        catch(error) {            
                this.errorHandler.generalError(res,"Error occurred searching SSO users", error.message, 500, "Internal Server Error")
        }   
    }

    public async getTenant(req:Request, res:Response) {
        try {
            const tenant = await this.tmsService.getTenant(req)
            return res.status(200).send(tenant)
        }
        catch(error) {
            logger.error(error)            
            if (error instanceof NotFoundError) {
                this.errorHandler.generalError(res,"Error occurred getting a tenant", error.message, error.statusCode, "Not Found")
            }
            else if (error instanceof ForbiddenError) {
                this.errorHandler.generalError(res,"Error occured getting a tenant", error.message, error.statusCode, "Forbidden")
            }
            else {    
                this.errorHandler.generalError(res,"Error occurred getting a tenant", error.message, 500, "Internal Server Error")
            } 
        }
    }

    public async updateTenant(req:Request, res:Response) {
        try {
            const tenant = await this.tmsService.updateTenant(req)
            return res.status(200).send(tenant)
        }
        catch(error) {
            logger.error(error)            
            if (error instanceof NotFoundError) {
                this.errorHandler.generalError(res,"Error occurred updating tenant", error.message, error.statusCode, "Not Found")
            }
            else if (error instanceof ConflictError) {
                this.errorHandler.generalError(res,"Error occurred updating tenant", error.message, error.statusCode, "Conflict")
            }
            else {    
                this.errorHandler.generalError(res,"Error occurred updating tenant", error.message, 500, "Internal Server Error")
            } 
        }
    }

    public async getRolesForSSOUser(req:Request, res:Response) {    
        try {
            const roles = await this.tmsService.getRolesForSSOUser(req)
            return res.status(200).send(roles)
        }
        catch(error) {
            logger.error(error)            
            if (error instanceof NotFoundError) {
                this.errorHandler.generalError(res,"Error occurred getting roles for SSO user", error.message, error.statusCode, "Not Found")
            }
            else {    
                this.errorHandler.generalError(res,"Error occurred getting roles for SSO user", error.message, 500, "Internal Server Error")
            } 
        }
    }

    public async createTenantRequest(req: Request, res: Response) {
        try {
            const tenantRequest = await this.tmsService.createTenantRequest(req)
            res.status(201).send(tenantRequest)
        } catch (error) {
            logger.error(error)
            if (error instanceof ConflictError) {
                this.errorHandler.generalError(res, "Error occurred creating tenant request", error.message, error.statusCode, "Conflict")
            } else {
                this.errorHandler.generalError(res, "Error occurred creating tenant request", error.message, 500, "Internal Server Error")
            }
        }
    }

    public async updateTenantRequestStatus(req: Request, res: Response) {
        try {
            const response = await this.tmsService.updateTenantRequestStatus(req);
            res.status(200).send(response);
        } catch (error) {
            logger.error(error);
            if (error instanceof NotFoundError) {
                this.errorHandler.generalError(res, "Error occurred updating tenant request status", error.message, error.statusCode, "Not Found");
            } else if (error instanceof ConflictError) {
                this.errorHandler.generalError(res, "Error occurred updating tenant request status", error.message, error.statusCode, "Conflict");
            } else {
                this.errorHandler.generalError(res, "Error occurred updating tenant request status", error.message, 500, "Internal Server Error");
            }
        }
    }

    public async getTenantRequests(req: Request, res: Response) {
        try {
            const response = await this.tmsService.getTenantRequests(req);
            res.status(200).send(response);
        } catch (error) {
            logger.error(error);
            this.errorHandler.generalError(res, "Error occurred getting tenant requests", error.message, 500, "Internal Server Error");
        }
    }

    public async createSharedService(req: Request, res: Response) {
        try {
            const sharedService = await this.tmsService.createSharedService(req)
            res.status(201).send(sharedService)
        } catch (error) {
            logger.error(error)
            if (error instanceof ConflictError) {
                this.errorHandler.generalError(res, "Error occurred creating shared service", error.message, error.statusCode, "Conflict")
            } else {
                this.errorHandler.generalError(res, "Error occurred creating shared service", error.message, 500, "Internal Server Error")
            }
        }
    }

    public async associateSharedServiceToTenant(req: Request, res: Response) {
        try {
            await this.tmsService.associateSharedServiceToTenant(req)
            res.status(201).send()
        } catch (error) {
            logger.error(error)
            if (error instanceof NotFoundError) {
                this.errorHandler.generalError(res, "Error occurred associating shared service to tenant", error.message, error.statusCode, "Not Found")
            } else if (error instanceof ConflictError) {
                this.errorHandler.generalError(res, "Error occurred associating shared service to tenant", error.message, error.statusCode, "Conflict")
            } else {
                this.errorHandler.generalError(res, "Error occurred associating shared service to tenant", error.message, 500, "Internal Server Error")
            }
        }
    }

    public async getAllActiveSharedServices(req: Request, res: Response) {
        try {
            const sharedServices = await this.tmsService.getAllActiveSharedServices(req)
            res.status(200).send(sharedServices)
        } catch (error) {
            logger.error(error)
            this.errorHandler.generalError(res, "Error occurred getting active shared services", error.message, 500, "Internal Server Error")
        }
    }

    public async getSharedServicesForTenant(req: Request, res: Response) {
        try {
            const sharedServices = await this.tmsService.getSharedServicesForTenant(req)
            res.status(200).send(sharedServices)
        } catch (error) {
            logger.error(error)
            this.errorHandler.generalError(res, "Error occurred getting shared services for tenant", error.message, 500, "Internal Server Error")
        }
    }

}