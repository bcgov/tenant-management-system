import { Group } from '../entities/Group'
import { GroupUser } from '../entities/GroupUser'
import { TenantUser } from '../entities/TenantUser'
import { Tenant } from '../entities/Tenant'
import { EntityManager } from 'typeorm'
import { In } from 'typeorm'
import { Request } from 'express'
import { NotFoundError } from '../errors/NotFoundError'
import { ConflictError } from '../errors/ConflictError'
import logger from '../common/logger'
import { getErrorMessage } from '../common/error.handler'
import { TMSRepository } from './tms.repository'
import { GroupSharedServiceRole } from '../entities/GroupSharedServiceRole'
import { SharedServiceRole } from '../entities/SharedServiceRole'
import { TenantSharedService } from '../entities/TenantSharedService'
import { SSOUser } from '../entities/SSOUser'

export class TMRepository {
  constructor(
    private manager: EntityManager,
    private tmsRepository: TMSRepository,
  ) {
    this.manager = manager
    this.tmsRepository = tmsRepository
  }

  public async saveGroup(
    req: Request,
    transactionEntityManager?: EntityManager,
  ) {
    transactionEntityManager = transactionEntityManager
      ? transactionEntityManager
      : this.manager
    let groupResponse = {}

    await this.manager.transaction(async (transactionEntityManager) => {
      try {
        const { name, description, tenantUserId } = req.body
        const tenantId = req.params.tenantId
        const createdBy =
          req.body.user?.ssoUserId || req.decodedJwt?.idir_user_guid || 'system'

        // REDUNDANT: checkTenantAccess middleware already validates tenant exists and user has access
        // if (!await this.tmsRepository.checkIfTenantExists(tenantId, transactionEntityManager)) {
        //     throw new NotFoundError(`Tenant not found: ${tenantId}`)
        // }

        if (
          await this.checkIfGroupNameExistsInTenant(
            name,
            tenantId,
            transactionEntityManager,
          )
        ) {
          throw new ConflictError(
            `A group with name '${name}' already exists in this tenant`,
          )
        }

        if (tenantUserId) {
          if (
            !(await this.checkIfTenantUserExists(
              tenantUserId,
              transactionEntityManager,
            ))
          ) {
            throw new NotFoundError(`Tenant user not found: ${tenantUserId}`)
          }
        }

        const group: Group = new Group()
        group.name = name
        group.description = description
        group.tenant = { id: tenantId } as Tenant
        group.createdBy = createdBy
        group.updatedBy = createdBy

        const savedGroup: Group = await transactionEntityManager.save(group)

        if (tenantUserId) {
          const groupUser: GroupUser = new GroupUser()
          groupUser.group = savedGroup
          groupUser.tenantUser = { id: tenantUserId } as TenantUser
          groupUser.isDeleted = false
          groupUser.createdBy = createdBy
          groupUser.updatedBy = createdBy

          await transactionEntityManager.save(groupUser)
        }

        groupResponse = (await transactionEntityManager
          .createQueryBuilder(Group, 'group')
          .leftJoinAndSelect(
            'group.users',
            'groupUsers',
            'groupUsers.isDeleted = :isDeleted',
            { isDeleted: false },
          )
          .where('group.id = :id', { id: savedGroup.id })
          .getOne()) as any
      } catch (error: unknown) {
        logger.error(
          'Create group transaction failure - rolling back inserts ',
          { error: getErrorMessage(error) },
        )
        throw error
      }
    })

    if (
      groupResponse &&
      (groupResponse as any).createdBy &&
      (groupResponse as any).createdBy !== 'system'
    ) {
      const creator: any = await this.manager.findOne(SSOUser, {
        where: { ssoUserId: (groupResponse as any).createdBy },
      })
      ;(groupResponse as any).createdBy =
        creator?.displayName || (groupResponse as any).createdBy
    }

    return groupResponse
  }

  public async checkIfGroupNameExistsInTenant(
    name: string,
    tenantId: string,
    transactionEntityManager?: EntityManager,
    excludeGroupId?: string,
  ) {
    transactionEntityManager = transactionEntityManager
      ? transactionEntityManager
      : this.manager

    const queryBuilder = transactionEntityManager
      .createQueryBuilder(Group, 'group')
      .where('group.name = :name', { name })
      .andWhere('group.tenant.id = :tenantId', { tenantId })

    if (excludeGroupId) {
      queryBuilder.andWhere('group.id != :excludeGroupId', { excludeGroupId })
    }

    const existingGroup = await queryBuilder.getOne()

    return !!existingGroup
  }

  public async checkIfGroupExistsInTenant(
    groupId: string,
    tenantId: string,
    transactionEntityManager?: EntityManager,
  ) {
    transactionEntityManager = transactionEntityManager
      ? transactionEntityManager
      : this.manager

    const existingGroup = await transactionEntityManager
      .createQueryBuilder(Group, 'group')
      .where('group.id = :groupId', { groupId })
      .andWhere('group.tenant.id = :tenantId', { tenantId })
      .getOne()

    return existingGroup
  }

  public async checkIfTenantUserAlreadyInGroup(
    tenantUserId: string,
    tenantId: string,
    transactionEntityManager?: EntityManager,
  ) {
    transactionEntityManager = transactionEntityManager
      ? transactionEntityManager
      : this.manager

    const existingGroupUser: GroupUser | null = await transactionEntityManager
      .createQueryBuilder(GroupUser, 'groupUser')
      .leftJoin('groupUser.group', 'group')
      .leftJoin('groupUser.tenantUser', 'tenantUser')
      .where('groupUser.tenantUser.id = :tenantUserId', { tenantUserId })
      .andWhere('group.tenant.id = :tenantId', { tenantId })
      .andWhere('groupUser.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('tenantUser.isDeleted = :isDeleted', { isDeleted: false })
      .getOne()

    return !!existingGroupUser
  }

  public async checkIfTenantUserExists(
    tenantUserId: string,
    transactionEntityManager?: EntityManager,
  ) {
    transactionEntityManager = transactionEntityManager
      ? transactionEntityManager
      : this.manager

    const tenantUser = await transactionEntityManager.findOne(TenantUser, {
      where: { id: tenantUserId, isDeleted: false },
    })
    return !!tenantUser
  }

  public async getTenantGroups(req: Request) {
    const tenantId: string = req.params.tenantId
    const ssoUserId: string = req.decodedJwt?.idir_user_guid
    const TMS_AUDIENCE: string = process.env.TMS_AUDIENCE!
    const jwtAudience: string =
      req.decodedJwt?.aud || req.decodedJwt?.audience || TMS_AUDIENCE

    // REDUNDANT: checkTenantAccess middleware already validates tenant exists and user has access
    // if (!await this.tmsRepository.checkIfTenantExists(tenantId)) {
    //     throw new NotFoundError(`Tenant not found: ${tenantId}`)
    // }

    const groupsQuery = this.manager
      .createQueryBuilder(Group, 'grp')
      .leftJoin('grp.tenant', 'ten')
      .leftJoin(TenantSharedService, 'tss', 'tss.tenant_id = ten.id')
      .leftJoin('tss.sharedService', 'ss')
      .where('grp.tenant.id = :tenantId', { tenantId })
      .andWhere(
        ':jwtAudience = :tmsAudience OR (:jwtAudience != :tmsAudience AND ss.clientIdentifier = :jwtAudience AND tss.isDeleted = :tssDeleted AND ss.isActive = :ssActive)',
        {
          jwtAudience,
          tmsAudience: TMS_AUDIENCE,
          tssDeleted: false,
          ssActive: true,
        },
      )

    if (jwtAudience === TMS_AUDIENCE && ssoUserId) {
      groupsQuery
        .innerJoin('ten.users', 'tu')
        .innerJoin('tu.ssoUser', 'su')
        .andWhere('su.ssoUserId = :ssoUserId', { ssoUserId })
        .andWhere('tu.isDeleted = :isDeleted', { isDeleted: false })
    } else {
      groupsQuery
        .leftJoin('ss.roles', 'ssr')
        .leftJoin(
          GroupSharedServiceRole,
          'gssr',
          'gssr.group_id = grp.id AND gssr.shared_service_role_id = ssr.id',
        )
        .andWhere('gssr.isDeleted = :gssrDeleted', { gssrDeleted: false })
        .andWhere('ssr.isDeleted = :ssrDeleted', { ssrDeleted: false })
        .distinct(true)
    }

    const groups: Group[] = await groupsQuery.getMany()

    const uniqueCreatedByIds: string[] = [
      ...new Set(
        groups
          .map((group) => group.createdBy)
          .filter((id) => id && id !== 'system'),
      ),
    ]

    if (uniqueCreatedByIds.length > 0) {
      const creators = await this.manager.find(SSOUser, {
        where: { ssoUserId: In(uniqueCreatedByIds) },
      })

      const creatorMap = new Map(
        creators.map((creator) => [creator.ssoUserId, creator.displayName]),
      )

      groups.forEach((group) => {
        if (group.createdBy && group.createdBy !== 'system') {
          group.createdBy = creatorMap.get(group.createdBy) || 'system'
        }
      })
    }

    return groups
  }

  public async getGroupById(groupId: string) {
    const group: Group = (await this.manager
      .createQueryBuilder(Group, 'group')
      .leftJoinAndSelect('group.tenant', 'tenant')
      .where('group.id = :groupId', { groupId })
      .getOne()) as any

    if (!group) {
      throw new NotFoundError(`Group not found: ${groupId}`)
    }

    return group
  }

  public async getTenantUserGroups(tenantUserId: string) {
    const groupUsers = await this.manager
      .createQueryBuilder(GroupUser, 'groupUser')
      .leftJoinAndSelect('groupUser.group', 'group')
      .where('groupUser.tenantUser.id = :tenantUserId', { tenantUserId })
      .andWhere('groupUser.isDeleted = :isDeleted', { isDeleted: false })
      .getMany()

    return groupUsers.map((groupUser: any) => ({
      id: groupUser.group.id,
      name: groupUser.group.name,
      description: groupUser.group.description,
      createdDateTime: groupUser.group.createdDateTime,
      updatedDateTime: groupUser.group.updatedDateTime,
      createdBy: groupUser.group.createdBy,
      updatedBy: groupUser.group.updatedBy,
    }))
  }

  public async getTenantUserSharedServiceRoles(tenantUserId: string) {
    const sharedServiceRoles = await this.manager
      .createQueryBuilder(GroupUser, 'groupUser')
      .leftJoinAndSelect('groupUser.group', 'group')
      .leftJoinAndSelect(
        'group.sharedServiceRoles',
        'gssr',
        'gssr.isDeleted = :isDeleted',
        { isDeleted: false },
      )
      .leftJoinAndSelect('gssr.sharedServiceRole', 'sharedServiceRole')
      .leftJoinAndSelect('sharedServiceRole.sharedService', 'sharedService')
      .where('groupUser.tenantUser.id = :tenantUserId', { tenantUserId })
      .andWhere('groupUser.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('sharedServiceRole.isDeleted = :isDeleted', {
        isDeleted: false,
      })
      .getMany()

    const sharedServiceMap = new Map<
      string,
      {
        id: string
        name: string
        description: string | null
        clientIdentifier: string
        isActive: boolean
        sharedServiceRoles: any[]
      }
    >()

    sharedServiceRoles.forEach((groupUser: any) => {
      if (groupUser.group?.sharedServiceRoles) {
        groupUser.group.sharedServiceRoles.forEach((gssr: any) => {
          if (gssr.sharedServiceRole?.sharedService) {
            const sharedService = gssr.sharedServiceRole.sharedService
            const role = gssr.sharedServiceRole
            const serviceId = sharedService.id

            if (!sharedServiceMap.has(serviceId)) {
              sharedServiceMap.set(serviceId, {
                id: serviceId,
                name: sharedService.name,
                description: sharedService.description,
                clientIdentifier: sharedService.clientIdentifier,
                isActive: sharedService.isActive,
                sharedServiceRoles: [],
              })
            }

            const serviceEntry = sharedServiceMap.get(serviceId)!
            const roleExists = serviceEntry.sharedServiceRoles.some(
              (r: any) => r.id === role.id,
            )
            if (!roleExists) {
              const {
                sharedService,
                isDeleted,
                createdDateTime,
                updatedDateTime,
                createdBy,
                updatedBy,
                ...roleWithoutExcludedFields
              } = role
              serviceEntry.sharedServiceRoles.push(roleWithoutExcludedFields)
            }
          }
        })
      }
    })

    return Array.from(sharedServiceMap.values())
  }

  public async getGroupUsers(groupId: string) {
    const groupUsers: GroupUser[] = await this.manager
      .createQueryBuilder(GroupUser, 'groupUser')
      .leftJoinAndSelect('groupUser.group', 'group')
      .leftJoinAndSelect('groupUser.tenantUser', 'tenantUser')
      .leftJoinAndSelect('tenantUser.ssoUser', 'ssoUser')
      .where('groupUser.group.id = :groupId', { groupId })
      .andWhere('groupUser.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('tenantUser.isDeleted = :isDeleted', { isDeleted: false })
      .getMany()

    return groupUsers
  }

  public async checkIfUserExistsInGroup(
    tenantUserId: string,
    groupId: string,
    transactionEntityManager?: EntityManager,
  ) {
    transactionEntityManager = transactionEntityManager
      ? transactionEntityManager
      : this.manager

    const existingGroupUser: GroupUser | null = await transactionEntityManager
      .createQueryBuilder(GroupUser, 'groupUser')
      .where('groupUser.tenantUser.id = :tenantUserId', { tenantUserId })
      .andWhere('groupUser.group.id = :groupId', { groupId })
      .andWhere('groupUser.isDeleted = :isDeleted', { isDeleted: false })
      .getOne()

    return !!existingGroupUser
  }

  public async findSoftDeletedGroupUser(
    tenantUserId: string,
    groupId: string,
    transactionEntityManager?: EntityManager,
  ) {
    transactionEntityManager = transactionEntityManager
      ? transactionEntityManager
      : this.manager

    const softDeletedGroupUser: GroupUser | null =
      await transactionEntityManager
        .createQueryBuilder(GroupUser, 'groupUser')
        .where('groupUser.tenantUser.id = :tenantUserId', { tenantUserId })
        .andWhere('groupUser.group.id = :groupId', { groupId })
        .andWhere('groupUser.isDeleted = :isDeleted', { isDeleted: true })
        .getOne()

    return softDeletedGroupUser
  }

  public async validateGroupsForTenant(
    groupIds: string[],
    tenantId: string,
    transactionEntityManager?: EntityManager,
  ) {
    transactionEntityManager = transactionEntityManager
      ? transactionEntityManager
      : this.manager

    const validGroups = await transactionEntityManager
      .createQueryBuilder(Group, 'group')
      .where('group.id IN (:...groupIds)', { groupIds })
      .andWhere('group.tenant.id = :tenantId', { tenantId })
      .getMany()

    if (validGroups.length !== groupIds.length) {
      const validGroupIds = validGroups.map((g) => g.id)
      const invalidGroupIds = groupIds.filter(
        (id) => !validGroupIds.includes(id),
      )
      throw new NotFoundError(
        `Group(s) not found or do not belong to tenant: ${invalidGroupIds.join(', ')}`,
      )
    }

    return validGroups
  }

  public async getExistingGroupMemberships(
    tenantUserId: string,
    groupIds: string[],
    transactionEntityManager?: EntityManager,
  ) {
    transactionEntityManager = transactionEntityManager
      ? transactionEntityManager
      : this.manager

    return await transactionEntityManager
      .createQueryBuilder(GroupUser, 'groupUser')
      .leftJoinAndSelect('groupUser.group', 'group')
      .where('groupUser.tenantUser.id = :tenantUserId', { tenantUserId })
      .andWhere('groupUser.group.id IN (:...groupIds)', { groupIds })
      .andWhere('groupUser.isDeleted = :isDeleted', { isDeleted: false })
      .getMany()
  }

  public async getSoftDeletedGroupMemberships(
    tenantUserId: string,
    groupIds: string[],
    transactionEntityManager?: EntityManager,
  ) {
    transactionEntityManager = transactionEntityManager
      ? transactionEntityManager
      : this.manager

    return await transactionEntityManager
      .createQueryBuilder(GroupUser, 'groupUser')
      .leftJoinAndSelect('groupUser.group', 'group')
      .where('groupUser.tenantUser.id = :tenantUserId', { tenantUserId })
      .andWhere('groupUser.group.id IN (:...groupIds)', { groupIds })
      .andWhere('groupUser.isDeleted = :isDeleted', { isDeleted: true })
      .getMany()
  }

  public async removeUserFromAllGroups(
    tenantUserId: string,
    updatedBy: string,
    transactionEntityManager?: EntityManager,
  ) {
    transactionEntityManager = transactionEntityManager
      ? transactionEntityManager
      : this.manager

    await transactionEntityManager
      .createQueryBuilder()
      .update(GroupUser)
      .set({
        isDeleted: true,
        updatedBy: updatedBy,
      })
      .where('tenantUser.id = :tenantUserId', { tenantUserId })
      .andWhere('isDeleted = :isDeleted', { isDeleted: false })
      .execute()
  }

  public async addUserToGroups(
    tenantUserId: string,
    groupIds: string[],
    tenantId: string,
    updatedBy: string,
    transactionEntityManager?: EntityManager,
  ) {
    transactionEntityManager = transactionEntityManager
      ? transactionEntityManager
      : this.manager

    if (groupIds.length === 0) {
      return []
    }

    const validGroups = await this.validateGroupsForTenant(
      groupIds,
      tenantId,
      transactionEntityManager,
    )

    const existingGroupUsers = await this.getExistingGroupMemberships(
      tenantUserId,
      groupIds,
      transactionEntityManager,
    )
    const existingGroupIds = existingGroupUsers.map((gu) => gu.group.id)
    const groupsToAdd = validGroups.filter(
      (g) => !existingGroupIds.includes(g.id),
    )

    if (groupsToAdd.length === 0) {
      return []
    }

    const softDeletedGroupUsers = await this.getSoftDeletedGroupMemberships(
      tenantUserId,
      groupsToAdd.map((g) => g.id),
      transactionEntityManager,
    )

    const softDeletedGroupIds = softDeletedGroupUsers.map((gu) => gu.group.id)
    const groupsToRestore = softDeletedGroupUsers
    const groupsToCreate = groupsToAdd.filter(
      (g) => !softDeletedGroupIds.includes(g.id),
    )

    const addedGroups: Group[] = []

    if (groupsToRestore.length > 0) {
      groupsToRestore.forEach((gu) => {
        gu.isDeleted = false
        gu.updatedBy = updatedBy
        gu.updatedDateTime = new Date()
      })
      await transactionEntityManager.save(groupsToRestore)
      addedGroups.push(...groupsToRestore.map((gu) => gu.group))
    }

    if (groupsToCreate.length > 0) {
      const newGroupUsers = groupsToCreate.map((group) => {
        const groupUser = new GroupUser()
        groupUser.group = group
        groupUser.tenantUser = { id: tenantUserId } as TenantUser
        groupUser.isDeleted = false
        groupUser.createdBy = updatedBy
        groupUser.updatedBy = updatedBy
        return groupUser
      })
      await transactionEntityManager.save(newGroupUsers)
      addedGroups.push(...groupsToCreate)
    }

    return addedGroups
  }

  public async addGroupUser(
    req: Request,
    transactionEntityManager?: EntityManager,
  ) {
    transactionEntityManager = transactionEntityManager
      ? transactionEntityManager
      : this.manager

    const tenantId: string = req.params.tenantId
    const groupId: string = req.params.groupId
    const tenantUserId: string = req.body.tenantUserId
    const updatedBy: string = req.decodedJwt?.idir_user_guid || 'system'

    const group = await this.checkIfGroupExistsInTenant(
      groupId,
      tenantId,
      transactionEntityManager,
    )
    if (!group) {
      throw new NotFoundError(`Group not found: ${groupId}`)
    }

    if (
      await this.checkIfUserExistsInGroup(
        tenantUserId,
        groupId,
        transactionEntityManager,
      )
    ) {
      throw new ConflictError('User is already a member of this group')
    }

    const softDeletedGroupUser = await this.findSoftDeletedGroupUser(
      tenantUserId,
      groupId,
      transactionEntityManager,
    )
    let savedGroupUser: GroupUser

    if (softDeletedGroupUser) {
      softDeletedGroupUser.isDeleted = false
      softDeletedGroupUser.updatedBy = updatedBy
      softDeletedGroupUser.updatedDateTime = new Date()

      savedGroupUser = await transactionEntityManager.save(softDeletedGroupUser)
    } else {
      const groupUser: GroupUser = new GroupUser()
      groupUser.group = { id: groupId } as Group
      groupUser.tenantUser = { id: tenantUserId } as TenantUser
      groupUser.isDeleted = false
      groupUser.createdBy = updatedBy
      groupUser.updatedBy = updatedBy

      savedGroupUser = await transactionEntityManager.save(groupUser)
    }

    let groupUserResponse: any = await transactionEntityManager
      .createQueryBuilder(GroupUser, 'groupUser')
      .leftJoinAndSelect('groupUser.tenantUser', 'tenantUser')
      .leftJoinAndSelect('tenantUser.ssoUser', 'ssoUser')
      .leftJoinAndSelect('tenantUser.roles', 'tenantUserRoles')
      .leftJoinAndSelect('tenantUserRoles.role', 'role')
      .where('groupUser.id = :id', { id: savedGroupUser.id })
      .getOne()

    if (groupUserResponse) {
      const activeRoles =
        groupUserResponse.tenantUser.roles?.filter(
          (tur: any) => !tur.isDeleted,
        ) || []
      const userRoles = activeRoles.map((tur: any) => tur.role) || []
      groupUserResponse = {
        ...groupUserResponse,
        user: {
          ...groupUserResponse.tenantUser,
          ssoUser: groupUserResponse.tenantUser.ssoUser,
          roles: userRoles,
        },
      }
      delete groupUserResponse.tenantUser
    }

    return groupUserResponse
  }

  public async updateGroup(req: Request) {
    const groupId: string = req.params.groupId
    const tenantId: string = req.params.tenantId
    const { name, description } = req.body

    let groupResponse: Group = null as any
    await this.manager.transaction(async (transactionEntityManager) => {
      try {
        // REDUNDANT: checkTenantAccess middleware already validates tenant exists and user has access
        // if (!await this.tmsRepository.checkIfTenantExists(tenantId, transactionEntityManager)) {
        //     throw new NotFoundError(`Tenant not found: ${tenantId}`)
        // }

        const existingGroup: Group = (await this.checkIfGroupExistsInTenant(
          groupId,
          tenantId,
          transactionEntityManager,
        )) as any
        if (!existingGroup) {
          throw new NotFoundError(`Group not found: ${groupId}`)
        }

        if (name) {
          if (
            await this.checkIfGroupNameExistsInTenant(
              name,
              tenantId,
              transactionEntityManager,
              groupId,
            )
          ) {
            throw new ConflictError(
              `A group with name '${name}' already exists in this tenant`,
            )
          }
        }

        await transactionEntityManager
          .createQueryBuilder()
          .update(Group)
          .set({
            ...(name && { name }),
            ...(description && { description }),
            updatedBy: req.decodedJwt?.idir_user_guid || 'system',
          })
          .where('id = :groupId', { groupId })
          .execute()

        groupResponse = (await transactionEntityManager
          .createQueryBuilder(Group, 'group')
          .leftJoinAndSelect('group.tenant', 'tenant')
          .where('group.id = :id', { id: groupId })
          .getOne()) as any
      } catch (error: unknown) {
        logger.error(
          'Update group transaction failure - rolling back changes',
          { error: getErrorMessage(error) },
        )
        throw error
      }
    })

    return groupResponse
  }

  public async removeGroupUser(req: Request) {
    const groupUserId: string = req.params.groupUserId
    const groupId: string = req.params.groupId
    const tenantId: string = req.params.tenantId

    await this.manager.transaction(async (transactionEntityManager) => {
      try {
        // REDUNDANT: checkTenantAccess middleware already validates tenant exists and user has access
        // if (!await this.tmsRepository.checkIfTenantExists(tenantId, transactionEntityManager)) {
        //     throw new NotFoundError(`Tenant not found: ${tenantId}`)
        // }

        const group: Group = (await this.checkIfGroupExistsInTenant(
          groupId,
          tenantId,
          transactionEntityManager,
        )) as any
        if (!group) {
          throw new NotFoundError(`Group not found: ${groupId}`)
        }

        const groupUser: GroupUser = (await transactionEntityManager
          .createQueryBuilder(GroupUser, 'groupUser')
          .leftJoin('groupUser.group', 'group')
          .where('groupUser.id = :groupUserId', { groupUserId })
          .andWhere('groupUser.group.id = :groupId', { groupId })
          .andWhere('group.tenant.id = :tenantId', { tenantId })
          .andWhere('groupUser.isDeleted = :isDeleted', { isDeleted: false })
          .getOne()) as any

        if (!groupUser) {
          throw new NotFoundError(`Group user not found: ${groupUserId}`)
        }

        await transactionEntityManager
          .createQueryBuilder()
          .update(GroupUser)
          .set({
            isDeleted: true,
            updatedBy: req.decodedJwt?.idir_user_guid || 'system',
          })
          .where('id = :groupUserId', { groupUserId })
          .execute()
      } catch (error: unknown) {
        logger.error(
          'Remove user from group transaction failure - rolling back changes',
          { error: getErrorMessage(error) },
        )
        throw error
      }
    })
  }

  public async getGroup(req: Request) {
    const groupId: string = req.params.groupId
    const tenantId: string = req.params.tenantId
    const expand: string[] =
      typeof req.query.expand === 'string' ? req.query.expand.split(',') : []

    // REDUNDANT: checkTenantAccess middleware already validates tenant exists and user has access
    // if (!await this.tmsRepository.checkIfTenantExists(tenantId)) {
    //     throw new NotFoundError(`Tenant not found: ${tenantId}`)
    // }

    const existingGroup: Group = (await this.checkIfGroupExistsInTenant(
      groupId,
      tenantId,
    )) as any
    if (!existingGroup) {
      throw new NotFoundError(`Group not found: ${groupId}`)
    }

    const groupQuery = this.manager
      .createQueryBuilder(Group, 'group')
      .where('group.id = :groupId', { groupId })

    if (expand.includes('groupUsers')) {
      groupQuery
        .leftJoinAndSelect('group.users', 'groupUsers', 'groupUsers.isDeleted = :isDeleted', { isDeleted: false })
        .leftJoinAndSelect('groupUsers.tenantUser', 'tenantUser', 'tenantUser.isDeleted = :isDeleted', { isDeleted: false })
        .leftJoinAndSelect('tenantUser.ssoUser', 'ssoUser')
    }

    const group: any = await groupQuery.getOne()

    if (!group) {
      console.log(`Group not found: ${groupId}`)
      throw new NotFoundError(`Group not found: ${groupId}`)
    }

    if (group.createdBy) {
      const creator: any = await this.manager.findOne(SSOUser, {
        where: { ssoUserId: group.createdBy },
      })
      group.createdBy = creator?.userName || group.createdBy
    }

    if (expand.includes('groupUsers') && group.users) {
      const transformedUsers = group.users.map((groupUser: any) => ({
        id: groupUser.id,
        isDeleted: groupUser.isDeleted,
        createdDateTime: groupUser.createdDateTime,
        updatedDateTime: groupUser.updatedDateTime,
        createdBy: groupUser.createdBy,
        updatedBy: groupUser.updatedBy,
        user: {
          id: groupUser.tenantUser?.id,
          ssoUser: groupUser.tenantUser?.ssoUser,
          createdDateTime: groupUser.tenantUser?.createdDateTime,
          updatedDateTime: groupUser.tenantUser?.updatedDateTime,
          createdBy: groupUser.tenantUser?.createdBy,
          updatedBy: groupUser.tenantUser?.updatedBy,
        },
      }))
      group.users = transformedUsers
    }

    return group
  }

  public async getSharedServiceRolesForGroup(req: Request) {
    const tenantId = req.params.tenantId
    const groupId = req.params.groupId

    const group: any = await this.manager
      .createQueryBuilder(Group, 'group')
      .where('group.id = :groupId', { groupId })
      .andWhere('group.tenant.id = :tenantId', { tenantId })
      .getOne()

    if (!group) {
      throw new NotFoundError(
        `Group not found or does not belong to tenant: ${groupId}`,
      )
    }

    const result = await this.manager
      .createQueryBuilder(SharedServiceRole, 'ssr')
      .leftJoinAndSelect('ssr.sharedService', 'ss')
      .leftJoin('TenantSharedService', 'tss', 'ss.id = tss.sharedService.id')
      .leftJoin(
        'GroupSharedServiceRole',
        'gssr',
        'ssr.id = gssr.sharedServiceRole.id AND gssr.group.id = :groupId AND gssr.isDeleted = :gssrDeleted',
      )
      .addSelect(
        'CASE WHEN gssr.id IS NOT NULL THEN true ELSE false END',
        'enabled',
      )
      .addSelect('gssr.createdDateTime', 'assignedAt')
      .addSelect('gssr.createdBy', 'assignedBy')
      .where('tss.tenant.id = :tenantId', { tenantId })
      .andWhere('tss.isDeleted = :tssDeleted', { tssDeleted: false })
      .andWhere('ss.isActive = :ssActive', { ssActive: true })
      .andWhere('ssr.isDeleted = :ssrDeleted', { ssrDeleted: false })
      .setParameter('groupId', groupId)
      .setParameter('gssrDeleted', false)
      .orderBy('ss.name', 'ASC')
      .addOrderBy('ssr.name', 'ASC')
      .getRawAndEntities()

    const sharedServicesMap = new Map()

    result.entities.forEach((ssr, index) => {
      const raw = result.raw[index]
      const sharedServiceId = ssr.sharedService.id

      if (!sharedServicesMap.has(sharedServiceId)) {
        sharedServicesMap.set(sharedServiceId, {
          id: ssr.sharedService.id,
          name: ssr.sharedService.name,
          clientIdentifier: ssr.sharedService.clientIdentifier,
          description: ssr.sharedService.description,
          createdDateTime: ssr.sharedService.createdDateTime,
          updatedDateTime: ssr.sharedService.updatedDateTime,
          createdBy: ssr.sharedService.createdBy,
          updatedBy: ssr.sharedService.updatedBy,
          sharedServiceRoles: [],
        })
      }

      const sharedService = sharedServicesMap.get(sharedServiceId)
      sharedService.sharedServiceRoles.push({
        id: ssr.id,
        name: ssr.name,
        description: ssr.description,
        enabled: raw.enabled === 'true' || raw.enabled === true,
        createdDateTime: ssr.createdDateTime,
        createdBy: ssr.createdBy,
      })
    })

    const sharedServices = Array.from(sharedServicesMap.values())
    sharedServices.sort((a, b) => a.name.localeCompare(b.name))

    return sharedServices
  }

  public async updateSharedServiceRolesForGroup(req: Request) {
    const tenantId = req.params.tenantId
    const groupId = req.params.groupId
    const { sharedServices } = req.body
    const ssoUserId = req.decodedJwt?.idir_user_guid || 'system'

    await this.manager.transaction(async (transactionEntityManager) => {
      const group: any = await transactionEntityManager
        .createQueryBuilder(Group, 'group')
        .where('group.id = :groupId', { groupId })
        .andWhere('group.tenant.id = :tenantId', { tenantId })
        .getOne()

      if (!group) {
        throw new NotFoundError(
          `Group not found or does not belong to tenant: ${groupId}`,
        )
      }

      const sharedServiceIds: string[] = sharedServices.map((ss: any) => ss.id)
      const sharedServiceRoleIds: string[] = []
      const roleToServiceMap = new Map<string, string>() // roleId -> serviceId

      sharedServices.forEach((ss: any) => {
        ss.sharedServiceRoles.forEach((role: any) => {
          sharedServiceRoleIds.push(role.id)
          roleToServiceMap.set(role.id, ss.id)
        })
      })

      const tenantSharedServices = await transactionEntityManager
        .createQueryBuilder(TenantSharedService, 'tss')
        .leftJoinAndSelect('tss.sharedService', 'ss')
        .where('tss.tenant.id = :tenantId', { tenantId })
        .andWhere('tss.sharedService.id IN (:...sharedServiceIds)', {
          sharedServiceIds,
        })
        .andWhere('tss.isDeleted = :isDeleted', { isDeleted: false })
        .getMany()

      const tenantSharedServiceMap = new Map<string, any>()
      tenantSharedServices.forEach((tss) => {
        if (tss.sharedService) {
          tenantSharedServiceMap.set(tss.sharedService.id, tss)
        }
      })

      for (const serviceId of sharedServiceIds) {
        if (!tenantSharedServiceMap.has(serviceId)) {
          throw new NotFoundError(
            `Shared service not found or not associated with tenant: ${serviceId}`,
          )
        }
      }

      const sharedServiceRoles = await transactionEntityManager
        .createQueryBuilder(SharedServiceRole, 'ssr')
        .leftJoinAndSelect('ssr.sharedService', 'ss')
        .where('ssr.id IN (:...sharedServiceRoleIds)', { sharedServiceRoleIds })
        .andWhere('ssr.isDeleted = :isDeleted', { isDeleted: false })
        .getMany()

      const sharedServiceRoleMap = new Map<string, any>()
      sharedServiceRoles.forEach((ssr) => {
        sharedServiceRoleMap.set(ssr.id, ssr)
      })

      for (const [roleId, serviceId] of roleToServiceMap.entries()) {
        const role = sharedServiceRoleMap.get(roleId)
        if (!role) {
          throw new NotFoundError(`Shared service role not found: ${roleId}`)
        }
        if (role.sharedService?.id !== serviceId) {
          throw new NotFoundError(
            `Shared service role ${roleId} does not belong to service ${serviceId}`,
          )
        }
      }

      const existingAssignments = await transactionEntityManager
        .createQueryBuilder(GroupSharedServiceRole, 'gssr')
        .leftJoinAndSelect('gssr.sharedServiceRole', 'ssr')
        .where('gssr.group.id = :groupId', { groupId })
        .andWhere('gssr.sharedServiceRole.id IN (:...sharedServiceRoleIds)', {
          sharedServiceRoleIds,
        })
        .getMany()

      const existingAssignmentMap = new Map<string, any>()
      existingAssignments.forEach((gssr) => {
        if (gssr.sharedServiceRole) {
          existingAssignmentMap.set(gssr.sharedServiceRole.id, gssr)
        }
      })

      const toCreate: GroupSharedServiceRole[] = []
      const toRestore: string[] = [] // IDs to restore (isDeleted = false)
      const toDelete: string[] = [] // IDs to soft-delete (isDeleted = true)

      for (const sharedService of sharedServices) {
        const { id: sharedServiceId, sharedServiceRoles: roles } = sharedService

        for (const role of roles) {
          const { id: sharedServiceRoleId, enabled } = role
          const existingAssignment =
            existingAssignmentMap.get(sharedServiceRoleId)

          if (enabled) {
            if (!existingAssignment) {
              const newAssignment = new GroupSharedServiceRole()
              newAssignment.group = { id: groupId } as any
              newAssignment.sharedServiceRole = {
                id: sharedServiceRoleId,
              } as any
              newAssignment.isDeleted = false
              newAssignment.createdBy = ssoUserId
              newAssignment.updatedBy = ssoUserId
              toCreate.push(newAssignment)
            } else if (existingAssignment.isDeleted) {
              toRestore.push(existingAssignment.id)
            }
          } else {
            if (existingAssignment && !existingAssignment.isDeleted) {
              toDelete.push(existingAssignment.id)
            }
          }
        }
      }

      if (toCreate.length > 0) {
        await transactionEntityManager.save(GroupSharedServiceRole, toCreate)
      }

      if (toRestore.length > 0) {
        await transactionEntityManager
          .createQueryBuilder()
          .update('GroupSharedServiceRole')
          .set({
            isDeleted: false,
            updatedBy: ssoUserId,
          })
          .where('id IN (:...ids)', { ids: toRestore })
          .execute()
      }

      if (toDelete.length > 0) {
        await transactionEntityManager
          .createQueryBuilder()
          .update('GroupSharedServiceRole')
          .set({
            isDeleted: true,
            updatedBy: ssoUserId,
          })
          .where('id IN (:...ids)', { ids: toDelete })
          .execute()
      }
    })

    return await this.getSharedServiceRolesForGroup(req)
  }

  public async getUserGroupsWithSharedServiceRoles(
    req: Request,
    audience: string,
  ) {
    const tenantId: string = req.params.tenantId
    const ssoUserId: string = req.params.ssoUserId
    const idpType: string = req.idpType!

    const tenantUser: TenantUser =
      await this.tmsRepository.getTenantUserBySsoId(ssoUserId, tenantId)
    if (!tenantUser) {
      throw new NotFoundError(`Tenant user not found: ${ssoUserId}`)
    }

    const result = await this.manager
      .createQueryBuilder(GroupUser, 'gu')
      .leftJoinAndSelect('gu.group', 'group')
      .leftJoinAndSelect('group.sharedServiceRoles', 'gssr')
      .leftJoinAndSelect('gssr.sharedServiceRole', 'ssr')
      .leftJoinAndSelect('ssr.sharedService', 'ss')
      .leftJoin('TenantSharedService', 'tss', 'ss.id = tss.sharedService.id')
      .where('gu.tenantUser.id = :tenantUserId', {
        tenantUserId: tenantUser.id,
      })
      .andWhere('gu.isDeleted = :guDeleted', { guDeleted: false })
      .andWhere('gssr.isDeleted = :gssrDeleted', { gssrDeleted: false })
      .andWhere('ssr.isDeleted = :ssrDeleted', { ssrDeleted: false })
      .andWhere('ss.isActive = :ssActive', { ssActive: true })
      .andWhere('ss.clientIdentifier = :audience', { audience })
      .andWhere('tss.tenant.id = :tenantId', { tenantId })
      .andWhere('tss.isDeleted = :tssDeleted', { tssDeleted: false })
      .andWhere(
        '(ssr.allowedIdentityProviders IS NULL OR :idpType = ANY(ssr.allowedIdentityProviders))',
        { idpType },
      )
      .orderBy('group.name', 'ASC')
      .addOrderBy('ss.name', 'ASC')
      .addOrderBy('ssr.name', 'ASC')
      .getMany()

    const groupsMap = new Map()

    result.forEach((gu) => {
      const groupId = gu.group.id
      if (!groupsMap.has(groupId)) {
        groupsMap.set(groupId, {
          id: gu.group.id,
          name: gu.group.name,
          sharedServiceRoles: [],
        })
      }
      const group = groupsMap.get(groupId)

      if (gu.group.sharedServiceRoles) {
        gu.group.sharedServiceRoles.forEach((gssr: any) => {
          if (
            gssr.sharedServiceRole &&
            gssr.sharedServiceRole.sharedService &&
            gssr.sharedServiceRole.sharedService.isActive &&
            gssr.sharedServiceRole.sharedService.clientIdentifier ===
              audience &&
            !gssr.isDeleted &&
            !gssr.sharedServiceRole.isDeleted
          ) {
            group.sharedServiceRoles.push({
              name: gssr.sharedServiceRole.name,
              enabled: true,
            })
          }
        })
      }
    })

    const groups = Array.from(groupsMap.values())
    groups.sort((a, b) => a.name.localeCompare(b.name))

    return { groups }
  }

  public async getEffectiveSharedServiceRoles(req: Request, audience: string) {
    const tenantId: string = req.params.tenantId
    const ssoUserId: string = req.params.ssoUserId
    const idpType: string = req.idpType!

    const tenantUser: TenantUser =
      await this.tmsRepository.getTenantUserBySsoId(ssoUserId, tenantId)
    if (!tenantUser) {
      throw new NotFoundError(`Tenant user not found: ${ssoUserId}`)
    }

    const result = await this.manager
      .createQueryBuilder(GroupUser, 'gu')
      .leftJoinAndSelect('gu.group', 'group')
      .leftJoinAndSelect('group.sharedServiceRoles', 'gssr')
      .leftJoinAndSelect('gssr.sharedServiceRole', 'ssr')
      .leftJoinAndSelect('ssr.sharedService', 'ss')
      .leftJoin('TenantSharedService', 'tss', 'ss.id = tss.sharedService.id')
      .where('gu.tenantUser.id = :tenantUserId', {
        tenantUserId: tenantUser.id,
      })
      .andWhere('gu.isDeleted = :guDeleted', { guDeleted: false })
      .andWhere('gssr.isDeleted = :gssrDeleted', { gssrDeleted: false })
      .andWhere('ssr.isDeleted = :ssrDeleted', { ssrDeleted: false })
      .andWhere('ss.isActive = :ssActive', { ssActive: true })
      .andWhere('ss.clientIdentifier = :audience', { audience })
      .andWhere('tss.tenant.id = :tenantId', { tenantId })
      .andWhere('tss.isDeleted = :tssDeleted', { tssDeleted: false })
      .andWhere(
        '(ssr.allowedIdentityProviders IS NULL OR :idpType = ANY(ssr.allowedIdentityProviders))',
        { idpType },
      )
      .getMany()

    const rolesMap = new Map()

    result.forEach((gu: any) => {
      if (gu.group?.sharedServiceRoles) {
        gu.group.sharedServiceRoles.forEach((gssr: any) => {
          if (
            gssr.sharedServiceRole &&
            gssr.sharedServiceRole.sharedService &&
            gssr.sharedServiceRole.sharedService.isActive &&
            gssr.sharedServiceRole.sharedService.clientIdentifier ===
              audience &&
            !gssr.isDeleted &&
            !gssr.sharedServiceRole.isDeleted
          ) {
            const roleId = gssr.sharedServiceRole.id
            if (!rolesMap.has(roleId)) {
              rolesMap.set(roleId, {
                id: gssr.sharedServiceRole.id,
                name: gssr.sharedServiceRole.name,
                description: gssr.sharedServiceRole.description,
                allowedIdentityProviders:
                  gssr.sharedServiceRole.allowedIdentityProviders,
                groups: [],
              })
            }
            const role = rolesMap.get(roleId)
            const groupExists = role.groups.some(
              (g: any) => g.id === gu.group.id,
            )
            if (!groupExists) {
              role.groups.push({
                id: gu.group.id,
                name: gu.group.name,
              })
            }
          }
        })
      }
    })

    return Array.from(rolesMap.values())
  }

  public async getTenantUser(req: Request) {
    const tenantId: string = req.params.tenantId
    const tenantUserId: string = req.params.tenantUserId
    const expand: string[] =
      typeof req.query.expand === 'string'
        ? req.query.expand.split(',').map((v) => v.trim())
        : []

    const expandGroups = expand.includes('groups')
    const expandRoles = expand.includes('roles')
    const expandSharedServices = expand.includes('sharedServices')

    const tenantUserQuery = this.manager
      .createQueryBuilder(TenantUser, 'tenantUser')
      .leftJoinAndSelect('tenantUser.ssoUser', 'ssoUser')
      .leftJoin('tenantUser.tenant', 'tenant')
      .where('tenantUser.id = :tenantUserId', { tenantUserId })
      .andWhere('tenant.id = :tenantId', { tenantId })
      .andWhere('tenantUser.isDeleted = :isDeleted', { isDeleted: false })

    if (expandRoles) {
      tenantUserQuery
        .leftJoinAndSelect('tenantUser.roles', 'tenantUserRole')
        .leftJoinAndSelect('tenantUserRole.role', 'role')
        .andWhere('tenantUserRole.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('role.isDeleted = :isDeleted', { isDeleted: false })
    }

    const tenantUser = (await tenantUserQuery.getOne()) as any

    if (!tenantUser) {
      throw new NotFoundError(`Tenant user not found: ${tenantUserId}`)
    }

    const result: any = {
      id: tenantUser.id,
      ssoUser: tenantUser.ssoUser,
      createdDateTime: tenantUser.createdDateTime,
      updatedDateTime: tenantUser.updatedDateTime,
      createdBy: tenantUser.createdBy,
      updatedBy: tenantUser.updatedBy,
    }

    if (expandGroups) {
      result.groups = await this.getTenantUserGroups(tenantUserId)
    }

    if (expandRoles && tenantUser.roles) {
      result.roles = tenantUser.roles.map(
        (tenantUserRole: any) => tenantUserRole.role,
      )
    }

    if (expandSharedServices) {
      result.sharedServices =
        await this.getTenantUserSharedServiceRoles(tenantUserId)
    }

    return result
  }
}
