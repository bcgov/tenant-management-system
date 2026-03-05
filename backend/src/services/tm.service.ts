import { Request } from 'express'
import { TMRepository } from '../repositories/tm.repository'
import { TMSRepository } from '../repositories/tms.repository'
import { connection } from '../common/db.connection'
import logger from '../common/logger'
import { getErrorMessage } from '../common/error.handler'
import { UnauthorizedError } from '../errors/UnauthorizedError'
import {
  AddGroupUserInputDto,
  AddGroupUserResultDto,
  CreateGroupInputDto,
  GetGroupInputDto,
  GetGroupResultDto,
  RemoveGroupUserInputDto,
  UpdateGroupInputDto,
} from '../dtos/tm.dto'
import { Group } from '../entities/Group'

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
    if (savedGroup?.createdBy && savedGroup.createdBy !== 'system') {
      const creatorDisplayName = await this.tmRepository.getSsoUserDisplayName(
        savedGroup.createdBy,
      )
      savedGroup.createdBy = creatorDisplayName || savedGroup.createdBy
    }

    return {
      data: {
        group: savedGroup,
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
        const input: AddGroupUserInputDto = {
          tenantId,
          groupId,
          tenantUserId: tenantUser.id,
          updatedBy,
          params: {
            tenantId,
            groupId,
          },
          body: {
            tenantUserId: tenantUser.id,
          },
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

    return {
      data: {
        groupUser: savedGroupUser!,
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
      params: {
        tenantId: req.params.tenantId,
        groupId: req.params.groupId,
        groupUserId: req.params.groupUserId,
      },
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
      params: {
        tenantId: req.params.tenantId,
        groupId: req.params.groupId,
      },
      query: expandParam ? { expand: expandParam } : undefined,
    }
    const group: GetGroupResultDto = await this.tmRepository.getGroup(input)

    return {
      data: {
        group: group,
      },
    }
  }

  public async getTenantGroups(req: Request) {
    const groups: any = await this.tmRepository.getTenantGroups(req)

    return {
      data: {
        groups: groups,
      },
    }
  }

  public async getSharedServiceRolesForGroup(req: Request) {
    const sharedServices =
      await this.tmRepository.getSharedServiceRolesForGroup(req)

    return {
      data: {
        sharedServices: sharedServices,
      },
    }
  }

  public async updateSharedServiceRolesForGroup(req: Request) {
    const sharedServices =
      await this.tmRepository.updateSharedServiceRolesForGroup(req)

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

    const result = await this.tmRepository.getUserGroupsWithSharedServiceRoles(
      req,
      audience,
    )

    return {
      data: result,
    }
  }

  public async getEffectiveSharedServiceRoles(req: Request) {
    const audience = req.decodedJwt?.aud || req.decodedJwt?.audience
    if (!audience) {
      throw new UnauthorizedError('Missing audience in JWT token')
    }

    const sharedServiceRoles =
      await this.tmRepository.getEffectiveSharedServiceRoles(req, audience)

    return {
      data: {
        sharedServiceRoles,
      },
    }
  }

  public async getTenantUser(req: Request) {
    const tenantUser: any = await this.tmRepository.getTenantUser(req)

    return {
      data: {
        tenantUser: tenantUser,
      },
    }
  }
}
