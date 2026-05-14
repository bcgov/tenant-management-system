import { Request } from 'express'
import { TMRepository } from '../repositories/tm.repository'
import { TMSRepository } from '../repositories/tms.repository'
import { connection } from '../common/db.connection'
import logger from '../common/logger'
import { getErrorMessage } from '../common/error.handler'
import { UnauthorizedError } from '../errors/UnauthorizedError'
import { NotFoundError } from '../errors/NotFoundError'
import { UnexpectedStateError } from '../errors/UnexpectedStateError'
import {
  AddGroupUserInputDto,
  AddGroupUserResultDto,
  CreateGroupInputDto,
  GetEffectiveSharedServiceRoleResultDto,
  GetEffectiveSharedServiceRolesInputDto,
  GetGroupInputDto,
  GetGroupResultDto,
  GetSharedServiceForGroupResultDto,
  GetSharedServiceRolesForGroupInputDto,
  GetTenantGroupsInputDto,
  GetUserGroupsWithSharedServiceRolesInputDto,
  GetUserGroupsWithSharedServiceRolesResultDto,
  RemoveGroupUserInputDto,
  UpdateSharedServiceRolesForGroupInputDto,
  UpdateGroupInputDto,
} from '../dtos/tm.dto'
import { Group } from '../entities/Group'
import { config } from '../services/config.service'

export class TMService {
  tmsRepository: TMSRepository = new TMSRepository(connection.manager)
  tmRepository: TMRepository = new TMRepository(
    connection.manager,
    this.tmsRepository,
  )

  public async createGroup(req: Request) {
    const input: CreateGroupInputDto = {
      tenantId: req.params.tenantId,
      name: req.body.name,
      description: req.body.description,
      tenantUserId: req.body.tenantUserId,
      createdBy:
        req.body.user?.ssoUserId || req.decodedJwt?.idir_user_guid || 'system',
    }
    const savedGroup: Group = await this.tmRepository.saveGroup(input)
    const createdByDisplayName =
      savedGroup.createdBy === 'system'
        ? 'system'
        : savedGroup.createdBy
          ? await this.tmRepository.getSsoUserDisplayName(savedGroup.createdBy)
          : undefined

    return {
      data: {
        group: {
          ...savedGroup,
          createdByDisplayName:
            createdByDisplayName || savedGroup.createdBy || undefined,
        },
      },
    }
  }

  public async addGroupUser(req: Request) {
    let savedGroupUser: AddGroupUserResultDto | null = null

    await connection.manager.transaction(async (transactionEntityManager) => {
      try {
        const tenantId: string = req.params.tenantId
        const groupId: string = req.params.groupId
        const { user } = req.body
        const updatedBy: string = req.decodedJwt?.idir_user_guid || 'system'

        const tenantUser = await this.tmsRepository.ensureTenantUserExists(
          user,
          tenantId,
          updatedBy,
          transactionEntityManager,
        )

        if (!tenantUser) {
          throw new NotFoundError(
            `Tenant user not found for tenant: ${tenantId}`,
          )
        }

        const input: AddGroupUserInputDto = {
          tenantId,
          groupId,
          tenantUserId: tenantUser.id,
          updatedBy,
        }
        savedGroupUser = await this.tmRepository.addGroupUser(
          input,
          transactionEntityManager,
        )
      } catch (error: unknown) {
        logger.error(
          'Add user to group transaction failure - rolling back inserts ',
          { error: getErrorMessage(error) },
        )
        throw error
      }
    })

    if (!savedGroupUser) {
      throw new UnexpectedStateError('Group user creation failed')
    }

    return {
      data: {
        groupUser: savedGroupUser,
      },
    }
  }

  public async updateGroup(req: Request) {
    const input: UpdateGroupInputDto = {
      tenantId: req.params.tenantId,
      groupId: req.params.groupId,
      name: req.body.name,
      description: req.body.description,
      updatedBy: req.decodedJwt?.idir_user_guid || 'system',
    }
    const updatedGroup: Group = await this.tmRepository.updateGroup(input)

    return {
      data: {
        group: updatedGroup,
      },
    }
  }

  public async removeGroupUser(req: Request) {
    const input: RemoveGroupUserInputDto = {
      tenantId: req.params.tenantId,
      groupId: req.params.groupId,
      groupUserId: req.params.groupUserId,
      updatedBy: req.decodedJwt?.idir_user_guid || 'system',
    }
    await this.tmRepository.removeGroupUser(input)

    return {
      data: {
        message: 'User successfully removed from group',
      },
    }
  }

  public async getGroup(req: Request) {
    const expandParam =
      typeof req.query.expand === 'string' ? req.query.expand : undefined
    const input: GetGroupInputDto = {
      tenantId: req.params.tenantId,
      groupId: req.params.groupId,
      expand: expandParam ? expandParam.split(',') : [],
    }
    const group: GetGroupResultDto = await this.tmRepository.getGroup(input)

    return {
      data: {
        group: group,
      },
    }
  }

  public async getTenantGroups(req: Request) {
    const input: GetTenantGroupsInputDto = {
      tenantId: req.params.tenantId,
      ssoUserId: req.decodedJwt?.idir_user_guid,
      jwtAudience:
        req.decodedJwt?.aud ||
        req.decodedJwt?.audience ||
        config.oidc.tmsAudience,
      tmsAudience: config.oidc.tmsAudience,
    }
    const groups = await this.tmRepository.getTenantGroups(input)

    return {
      data: {
        groups: groups,
      },
    }
  }

  public async getSharedServiceRolesForGroup(req: Request) {
    const input: GetSharedServiceRolesForGroupInputDto = {
      tenantId: req.params.tenantId,
      groupId: req.params.groupId,
    }
    const sharedServices: GetSharedServiceForGroupResultDto[] =
      await this.tmRepository.getSharedServiceRolesForGroup(input)

    return {
      data: {
        sharedServices: sharedServices,
      },
    }
  }

  public async updateSharedServiceRolesForGroup(req: Request) {
    const input: UpdateSharedServiceRolesForGroupInputDto = {
      tenantId: req.params.tenantId,
      groupId: req.params.groupId,
      updatedBy: req.decodedJwt?.idir_user_guid || 'system',
      sharedServices: req.body.sharedServices,
    }
    const sharedServices =
      await this.tmRepository.updateSharedServiceRolesForGroup(input)

    return {
      data: {
        sharedServices: sharedServices,
      },
    }
  }

  public async getUserGroupsWithSharedServiceRoles(req: Request) {
    const audience = req.decodedJwt?.aud || req.decodedJwt?.audience
    if (!audience) {
      throw new UnauthorizedError('Missing audience in JWT token')
    }
    if (!req.idpType) {
      throw new UnauthorizedError('Missing identity provider type in request')
    }

    const input: GetUserGroupsWithSharedServiceRolesInputDto = {
      tenantId: req.params.tenantId,
      ssoUserId: req.params.ssoUserId,
      audience,
      idpType: req.idpType,
    }
    const result: GetUserGroupsWithSharedServiceRolesResultDto =
      await this.tmRepository.getUserGroupsWithSharedServiceRoles(input)

    return {
      data: result,
    }
  }

  public async getEffectiveSharedServiceRoles(req: Request) {
    const audience = req.decodedJwt?.aud || req.decodedJwt?.audience
    if (!audience) {
      throw new UnauthorizedError('Missing audience in JWT token')
    }
    if (!req.idpType) {
      throw new UnauthorizedError('Missing identity provider type in request')
    }

    const input: GetEffectiveSharedServiceRolesInputDto = {
      tenantId: req.params.tenantId,
      ssoUserId: req.params.ssoUserId,
      audience,
      idpType: req.idpType,
    }
    const sharedServiceRoles: GetEffectiveSharedServiceRoleResultDto[] =
      await this.tmRepository.getEffectiveSharedServiceRoles(input)

    return {
      data: {
        sharedServiceRoles,
      },
    }
  }

  // public async getTenantUser(req: Request) {
  //   const tenantUser: any = await this.tmRepository.getTenantUser(req)

  //   return {
  //     data: {
  //       tenantUser: tenantUser,
  //     },
  //   }
  // }
}
