import { Request } from 'express'
import { tenantRepository } from '../repositories/tenant.repository'
import { groupRepository } from '../repositories/group.repository'
import { connection } from '../common/db.connection'
import logger from '../common/logger'
import { Tenant } from '../entities/Tenant'
import { Group } from '../entities/Group'
import { getErrorMessage } from '../common/error.handler'
import { AddTenantUserResponseDto, TMSMapper } from '../mappers/tms.mapper'
import {
  AssignUserRolesInputDto,
  AddTenantUserInputDto,
  AddTenantUserResultDto,
  CreateTenantRolesInputDto,
  CreateTenantInputDto,
  GetRolesForSsoUserInputDto,
  GetTenantInputDto,
  GetTenantUserInputDto,
  GetTenantUserResultDto,
  GetTenantUsersInputDto,
  GetTenantRolesInputDto,
  GetUserRolesInputDto,
  GetUserTenantsInputDto,
  RemoveTenantUserInputDto,
  UpdateTenantInputDto,
  UnassignUserRolesInputDto,
} from '../dtos/tms.dto'
import { config } from '../services/config.service'

export class TenantService {
  mapper: TMSMapper

  constructor(mapper?: TMSMapper) {
    this.mapper = mapper || new TMSMapper()
  }

  public async createTenant(req: Request) {
    const input: CreateTenantInputDto = {
      name: req.body.name,
      ministryName: req.body.ministryName,
      description: req.body.description,
      user: req.body.user,
    }

    let savedTenant: Tenant | undefined
    await connection.manager.transaction(async (transactionEntityManager) => {
      try {
        savedTenant = await tenantRepository.saveTenant(
          input,
          transactionEntityManager,
        )
      } catch (error: unknown) {
        logger.error(
          'Create tenant transaction failure - rolling back inserts ',
          { error: getErrorMessage(error) },
        )
        throw error
      }
    })

    const tenantDto = this.mapper.toTenantDto(savedTenant as Tenant)

    return {
      data: {
        tenant: tenantDto,
      },
    }
  }

  public async addTenantUser(req: Request) {
    let response: AddTenantUserResponseDto | undefined
    const input: AddTenantUserInputDto = {
      tenantId: req.params.tenantId,
      updatedBy: req.decodedJwt?.idir_user_guid || 'system',
      user: req.body.user,
      roles: req.body.roles,
      groups: req.body.groups,
    }

    await connection.manager.transaction(async (transactionEntityManager) => {
      try {
        const tenantResponse: AddTenantUserResultDto =
          await tenantRepository.addTenantUsers(input, transactionEntityManager)
        const groupIds: string[] = input.groups || []
        const groups: Group[] = await groupRepository.addUserToGroups(
          tenantResponse.tenantUserId,
          groupIds,
          input.tenantId,
          input.updatedBy,
          transactionEntityManager,
        )
        response = this.mapper.toAddTenantUserResponseDto(
          tenantResponse.savedTenantUser,
          tenantResponse.roleAssignments,
          groups,
        )
      } catch (error: unknown) {
        logger.error(
          'Add user to a tenant transaction failure - rolling back inserts ',
          { error: getErrorMessage(error) },
        )
        throw error
      }
    })
    if (!response) {
      throw new Error('Failed to create add tenant user response')
    }
    return response
  }

  public async getTenantsForUser(req: Request) {
    const expand =
      typeof req.query.expand === 'string' ? req.query.expand.split(',') : []
    const input: GetUserTenantsInputDto = {
      ssoUserId: req.params.ssoUserId,
      expand,
      jwtAudience:
        req.decodedJwt?.aud ||
        req.decodedJwt?.audience ||
        config.oidc.tmsAudience,
    }
    const tenants = await tenantRepository.getTenantsForUser(input)

    if (expand.includes('tenantUserRoles') && tenants) {
      return {
        data: {
          tenants: this.mapper.toTenantDtos(tenants),
        },
      }
    }

    return {
      data: {
        tenants,
      },
    }
  }

  public async getUsersForTenant(req: Request) {
    const groupIds =
      typeof req.query.groupIds === 'string'
        ? req.query.groupIds
            .split(',')
            .map((id) => id.trim())
            .filter((id) => id.length > 0)
        : undefined
    const sharedServiceRoleIds =
      typeof req.query.sharedServiceRoleIds === 'string'
        ? req.query.sharedServiceRoleIds
            .split(',')
            .map((id) => id.trim())
            .filter((id) => id.length > 0)
        : undefined

    const input: GetTenantUsersInputDto = {
      tenantId: req.params.tenantId,
      groupIds,
      sharedServiceRoleIds,
    }
    const users = await tenantRepository.getUsersForTenant(input)
    return {
      data: {
        users,
      },
    }
  }

  public async createRoles(req: Request) {
    const input: CreateTenantRolesInputDto = {
      tenantId: req.params.tenantId,
      role: req.body.role,
    }

    let roles: unknown
    await connection.manager.transaction(async (transactionEntityManager) => {
      try {
        roles = await tenantRepository.createRoles(
          input,
          transactionEntityManager,
        )
      } catch (error: unknown) {
        logger.error(
          'Create Role for tenant transaction failure - rolling back inserts ',
          { error: getErrorMessage(error) },
        )
        throw error
      }
    })

    return {
      data: {
        role: roles,
      },
    }
  }

  public async assignUserRoles(req: Request) {
    const { tenantId, tenantUserId } = req.params
    const { roles } = req.body

    const input: AssignUserRolesInputDto = {
      tenantId,
      tenantUserId,
      roleIds: roles,
    }

    let data:
      | Awaited<ReturnType<typeof tenantRepository.assignUserRolesForUser>>
      | undefined
    await connection.manager.transaction(async (transactionEntityManager) => {
      data = await tenantRepository.assignUserRolesForUser(
        input,
        transactionEntityManager,
      )
    })

    if (!data) {
      throw new Error('Failed to assign user roles')
    }

    return {
      data: {
        roles: data.map((assignment) => assignment.role),
      },
    }
  }

  public async getTenantRoles(req: Request) {
    const input: GetTenantRolesInputDto = {
      tenantId: req.params.tenantId,
    }
    const roles = await tenantRepository.getTenantRoles(input)
    return {
      data: {
        roles,
      },
    }
  }

  public async getUserRoles(req: Request) {
    const input: GetUserRolesInputDto = {
      tenantId: req.params.tenantId,
      tenantUserId: req.params.tenantUserId,
    }
    const roles = await tenantRepository.getUserRoles(input)
    return {
      data: {
        roles,
      },
    }
  }

  public async unassignUserRoles(req: Request) {
    const input: UnassignUserRolesInputDto = {
      tenantId: req.params.tenantId,
      tenantUserId: req.params.tenantUserId,
      roleId: req.params.roleId,
      updatedBy: req.decodedJwt?.idir_user_guid || 'system',
    }

    await connection.manager.transaction(async (transactionEntityManager) => {
      await tenantRepository.unassignUserRoles(input, transactionEntityManager)
    })
  }

  public async getTenant(req: Request) {
    const expand =
      typeof req.query.expand === 'string' ? req.query.expand.split(',') : []
    const input: GetTenantInputDto = {
      tenantId: req.params.tenantId,
      expand,
    }
    const tenant = await tenantRepository.getTenant(input)

    if (expand.includes('tenantUserRoles') && tenant?.users) {
      const tenantDto = this.mapper.toTenantDto(tenant as Tenant)
      return {
        data: {
          tenant: tenantDto,
        },
      }
    }

    return {
      data: {
        tenant,
      },
    }
  }

  public async updateTenant(req: Request) {
    const input: UpdateTenantInputDto = {
      tenantId: req.params.tenantId,
      name: req.body.name,
      ministryName: req.body.ministryName,
      description: req.body.description,
      updatedBy: req.decodedJwt?.idir_user_guid || 'system',
    }

    let updatedTenant:
      | Awaited<ReturnType<typeof tenantRepository.updateTenant>>
      | undefined
    await connection.manager.transaction(async (transactionEntityManager) => {
      try {
        updatedTenant = await tenantRepository.updateTenant(
          input,
          transactionEntityManager,
        )
      } catch (error: unknown) {
        logger.error(
          'Update tenant transaction failure - rolling back changes',
          { error: getErrorMessage(error) },
        )
        throw error
      }
    })

    if (!updatedTenant) {
      throw new Error('Failed to update tenant')
    }

    return {
      data: {
        tenant: updatedTenant,
      },
    }
  }

  public async getRolesForSSOUser(req: Request) {
    const input: GetRolesForSsoUserInputDto = {
      tenantId: req.params.tenantId,
      ssoUserId: req.params.ssoUserId,
    }
    const roles = await tenantRepository.getRolesForSSOUser(input)
    return {
      data: {
        roles,
      },
    }
  }

  public async removeTenantUser(req: Request) {
    const input: RemoveTenantUserInputDto = {
      tenantId: req.params.tenantId,
      tenantUserId: req.params.tenantUserId,
      deletedBy: req.decodedJwt?.idir_user_guid || 'system',
    }

    await connection.manager.transaction(async (transactionEntityManager) => {
      try {
        await tenantRepository.removeTenantUser(input, transactionEntityManager)
        await groupRepository.removeUserFromAllGroups(
          input.tenantUserId,
          input.deletedBy,
          transactionEntityManager,
        )
      } catch (error: unknown) {
        logger.error(
          'Remove tenant user transaction failure - rolling back changes',
          { error: getErrorMessage(error) },
        )
        throw error
      }
    })
  }

  public async getTenantUser(req: Request) {
    const expand: string[] =
      typeof req.query.expand === 'string'
        ? req.query.expand.split(',').map((v) => v.trim())
        : []
    const input: GetTenantUserInputDto = {
      tenantId: req.params.tenantId,
      tenantUserId: req.params.tenantUserId,
      expand,
    }
    const tenantUser: GetTenantUserResultDto =
      await tenantRepository.getTenantUser(input)

    if (expand.includes('groups')) {
      tenantUser.groups = await groupRepository.getTenantUserGroups(
        tenantUser.id,
      )
    }

    if (expand.includes('sharedServices')) {
      tenantUser.sharedServices =
        await groupRepository.getTenantUserSharedServiceRoles(tenantUser.id)
    }

    return {
      data: {
        tenantUser: tenantUser,
      },
    }
  }
}

export const tenantService = new TenantService()
