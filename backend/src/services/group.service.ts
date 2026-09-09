import { Request } from 'express'
import { groupRepository } from '../repositories/group.repository'
import { tenantRepository } from '../repositories/tenant.repository'
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
  GetEffectiveSharedServiceRolesInputDto,
  GetGroupInputDto,
  GetSharedServiceRolesForGroupInputDto,
  GetTenantGroupsInputDto,
  GetUserGroupsWithSharedServiceRolesInputDto,
  RemoveGroupUserInputDto,
  UpdateSharedServiceRolesForGroupInputDto,
  UpdateGroupInputDto,
} from '../dtos/tm.dto'
import { config } from '../services/config.service'
import { notificationService } from './notification.service'

export class GroupService {
  public async createGroup(req: Request) {
    const input: CreateGroupInputDto = {
      tenantId: req.params.tenantId,
      name: req.body.name,
      description: req.body.description,
      tenantUserId: req.body.tenantUserId,
      createdBy:
        req.body.user?.ssoUserId || req.decodedJwt?.idir_user_guid || 'system',
    }
    const savedGroup = await connection.manager.transaction(async (tx) => {
      try {
        return await groupRepository.saveGroup(input, tx)
      } catch (error: unknown) {
        logger.error(
          'Create group transaction failure - rolling back inserts ',
          { error: getErrorMessage(error) },
        )
        throw error
      }
    })

    const createdByDisplayName =
      savedGroup.createdBy === 'system'
        ? 'system'
        : savedGroup.createdBy
          ? await groupRepository.getSsoUserDisplayName(savedGroup.createdBy)
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

  private async notifyUserAddedToTenant(tenantUserId: string, groupId: string) {
    try {
      const tenantUser =
        await tenantRepository.getTenantUserWithRelations(tenantUserId)

      if (tenantUser) {
        const group = await groupRepository.getGroupById(groupId)

        await notificationService.notifyUserAddedToTenant(
          tenantUser,
          tenantUser.roles || [],
          [group],
        )
      }
    } catch (error: unknown) {
      logger.error('Notification lookup failed', {
        tenantUserId,
        reason: getErrorMessage(error),
      })
    }
  }

  public async addGroupUser(req: Request) {
    let savedGroupUser: AddGroupUserResultDto | null = null
    let addedTenantUserId: string | undefined
    let isNewTenantUser = false
    let addedGroupUserId: string | undefined

    await connection.manager.transaction(async (tx) => {
      try {
        const tenantId: string = req.params.tenantId
        const groupId: string = req.params.groupId
        const { user } = req.body
        const updatedBy: string = req.decodedJwt?.idir_user_guid || 'system'

        const existingTenantUser = await tenantRepository.getTenantUserBySsoId(
          user.ssoUserId,
          tenantId,
          tx,
        )

        const tenantUser = await tenantRepository.ensureTenantUserExists(
          user,
          tenantId,
          updatedBy,
          tx,
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
        savedGroupUser = await groupRepository.addGroupUser(input, tx)
        addedTenantUserId = tenantUser.id
        addedGroupUserId = savedGroupUser?.id
        isNewTenantUser = !existingTenantUser
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

    if (isNewTenantUser && addedTenantUserId) {
      await this.notifyUserAddedToTenant(addedTenantUserId, req.params.groupId)
    } else if (addedGroupUserId) {
      await this.notifyUserAddedToGroup(addedGroupUserId, {
        ssoUserId: req.decodedJwt?.idir_user_guid || 'system',
        displayName:
          req.decodedJwt?.display_name || req.decodedJwt?.name || 'System User',
      })
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
    const updatedGroup = await connection.manager.transaction(async (tx) => {
      try {
        return await groupRepository.updateGroup(input, tx)
      } catch (error: unknown) {
        logger.error(
          'Update group transaction failure - rolling back changes',
          { error: getErrorMessage(error) },
        )
        throw error
      }
    })

    const createdByDisplayName =
      updatedGroup.createdBy === 'system'
        ? 'system'
        : updatedGroup.createdBy
          ? await groupRepository.getSsoUserDisplayName(updatedGroup.createdBy)
          : undefined

    return {
      data: {
        group: {
          ...updatedGroup,
          createdByDisplayName:
            createdByDisplayName || updatedGroup.createdBy || undefined,
        },
      },
    }
  }

  private async notifyUserAddedToGroup(
    groupUserId: string,
    addedBy: { ssoUserId: string; displayName: string },
  ) {
    try {
      const groupUser =
        await groupRepository.getGroupUserWithRelations(groupUserId)

      if (!groupUser) {
        return
      }

      const addedThemselves =
        groupUser.tenantUser?.ssoUser?.ssoUserId?.toUpperCase() ===
        addedBy.ssoUserId.toUpperCase()

      if (addedThemselves) {
        return
      }

      await notificationService.notifyUserAddedToGroup(
        groupUser,
        addedBy.displayName,
      )
    } catch (error: unknown) {
      logger.error('Notification lookup failed', {
        groupUserId,
        reason: getErrorMessage(error),
      })
    }
  }

  private async notifyUserRemovedFromGroup(
    groupUserId: string,
    removedBy: { ssoUserId: string; displayName: string },
  ) {
    try {
      const groupUser =
        await groupRepository.getGroupUserWithRelations(groupUserId)

      if (!groupUser) {
        return
      }

      const removedTheirOwnAccess =
        groupUser.tenantUser?.ssoUser?.ssoUserId?.toUpperCase() ===
        removedBy.ssoUserId.toUpperCase()

      if (removedTheirOwnAccess) {
        return
      }

      await notificationService.notifyUserRemovedFromGroup(
        groupUser,
        removedBy.displayName,
      )
    } catch (error: unknown) {
      logger.error('Notification lookup failed', {
        groupUserId,
        reason: getErrorMessage(error),
      })
    }
  }

  public async removeGroupUser(req: Request) {
    const input: RemoveGroupUserInputDto = {
      tenantId: req.params.tenantId,
      groupId: req.params.groupId,
      groupUserId: req.params.groupUserId,
      updatedBy: req.decodedJwt?.idir_user_guid || 'system',
    }
    await connection.manager.transaction(async (tx) => {
      try {
        await groupRepository.removeGroupUser(input, tx)
      } catch (error: unknown) {
        logger.error(
          'Remove user from group transaction failure - rolling back changes',
          { error: getErrorMessage(error) },
        )
        throw error
      }
    })

    await this.notifyUserRemovedFromGroup(input.groupUserId, {
      ssoUserId: input.updatedBy,
      displayName:
        req.decodedJwt?.display_name || req.decodedJwt?.name || 'System User',
    })

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
    const group = await groupRepository.getGroup(input)

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
    const groups = await groupRepository.getTenantGroups(input)

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
    const sharedServices =
      await groupRepository.getSharedServiceRolesForGroup(input)

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
    const sharedServices = await connection.manager.transaction((tx) =>
      groupRepository.updateSharedServiceRolesForGroup(input, tx),
    )

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
    const result =
      await groupRepository.getUserGroupsWithSharedServiceRoles(input)

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
    const sharedServiceRoles =
      await groupRepository.getEffectiveSharedServiceRoles(input)

    return {
      data: {
        sharedServiceRoles,
      },
    }
  }
}

export const groupService = new GroupService()
