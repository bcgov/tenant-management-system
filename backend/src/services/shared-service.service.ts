import { Request } from 'express'
import { sharedServiceRepository } from '../repositories/shared-service.repository'
import {
  AddSharedServiceRolesInputDto,
  AssociateSharedServiceToTenantInputDto,
  CreateSharedServiceInputDto,
  GetSharedServicesForTenantInputDto,
  UpdateSharedServiceInputDto,
  UpdateSharedServiceRoleInputDto,
  UpdateSharedServiceStatusInputDto,
} from '../dtos/tms.dto'

export class SharedServiceService {
  public async createSharedService(req: Request) {
    const input: CreateSharedServiceInputDto = {
      name: req.body.name,
      displayName: req.body.displayName,
      clientIdentifier: req.body.clientIdentifier,
      landingPageUrl: req.body.landingPageUrl,
      description: req.body.description,
      isActive: req.body.isActive,
      roles: req.body.roles,
      updatedBy: req.decodedJwt?.idir_user_guid || 'system',
    }
    const savedSharedService =
      await sharedServiceRepository.saveSharedService(input)
    return {
      data: {
        sharedService: savedSharedService,
      },
    }
  }

  public async updateSharedService(req: Request) {
    const input: UpdateSharedServiceInputDto = {
      sharedServiceId: req.params.sharedServiceId,
      name: req.body.name,
      displayName: req.body.displayName,
      clientIdentifier: req.body.clientIdentifier,
      landingPageUrl: req.body.landingPageUrl,
      description: req.body.description,
      updatedBy: req.decodedJwt?.idir_user_guid || 'system',
    }
    const updatedSharedService =
      await sharedServiceRepository.updateSharedService(input)
    return {
      data: {
        sharedService: updatedSharedService,
      },
    }
  }

  public async addSharedServiceRoles(req: Request) {
    const input: AddSharedServiceRolesInputDto = {
      sharedServiceId: req.params.sharedServiceId,
      roles: req.body.roles,
      updatedBy: req.decodedJwt?.idir_user_guid || 'system',
    }
    const updatedSharedService =
      await sharedServiceRepository.addSharedServiceRoles(input)
    return {
      data: {
        sharedService: updatedSharedService,
      },
    }
  }

  public async updateSharedServiceRole(req: Request) {
    const input: UpdateSharedServiceRoleInputDto = {
      sharedServiceId: req.params.sharedServiceId,
      sharedServiceRoleId: req.params.sharedServiceRoleId,
      name: req.body.name,
      description: req.body.description,
      allowedIdentityProviders: req.body.allowedIdentityProviders,
      updatedBy: req.decodedJwt?.idir_user_guid || 'system',
    }
    const updatedSharedService =
      await sharedServiceRepository.updateSharedServiceRole(input)
    return {
      data: {
        sharedService: updatedSharedService,
      },
    }
  }

  public async updateSharedServiceStatus(req: Request) {
    const input: UpdateSharedServiceStatusInputDto = {
      sharedServiceId: req.params.sharedServiceId,
      isActive: req.body.isActive,
      updatedBy: req.decodedJwt?.idir_user_guid || 'system',
    }
    const updatedSharedService =
      await sharedServiceRepository.updateSharedServiceStatus(input)
    return {
      data: {
        sharedService: updatedSharedService,
      },
    }
  }

  public async associateSharedServiceToTenant(req: Request) {
    const input: AssociateSharedServiceToTenantInputDto = {
      tenantId: req.params.tenantId,
      sharedServiceId: req.body.sharedServiceId,
      updatedBy: req.decodedJwt?.idir_user_guid || 'system',
    }
    await sharedServiceRepository.associateSharedServiceToTenant(input)
  }

  public async getAllActiveSharedServices() {
    const sharedServices =
      await sharedServiceRepository.getAllActiveSharedServices()
    return {
      data: {
        sharedServices,
      },
    }
  }

  public async getSharedServicesForTenant(req: Request) {
    const input: GetSharedServicesForTenantInputDto = {
      tenantId: req.params.tenantId,
    }
    const sharedServices =
      await sharedServiceRepository.getSharedServicesForTenant(input)
    return {
      data: {
        sharedServices,
      },
    }
  }
}

export const sharedServiceService = new SharedServiceService()
