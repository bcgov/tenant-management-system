import { EntityManager, In } from 'typeorm'
import { Group } from '../entities/Group'
import { GroupUser } from '../entities/GroupUser'
import { TenantUser } from '../entities/TenantUser'
import { Tenant } from '../entities/Tenant'
import { SSOUser } from '../entities/SSOUser'
import { GroupSharedServiceRole } from '../entities/GroupSharedServiceRole'
import { SharedServiceRole } from '../entities/SharedServiceRole'
import { TenantSharedService } from '../entities/TenantSharedService'
import { tmsRepository } from './tms.repository'
import { NotFoundError } from '../errors/NotFoundError'
import { ConflictError } from '../errors/ConflictError'
import { UnexpectedStateError } from '../errors/UnexpectedStateError'
import { getManager } from '../common/db.connection'
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
  GetUserGroupsWithSharedServiceRoleResultDto,
  GetUserGroupsWithSharedServiceRolesResultDto,
  RemoveGroupUserInputDto,
  UpdateSharedServiceRolesForGroupInputDto,
  UpdateGroupInputDto,
} from '../dtos/tm.dto'

type TenantUserGroupResult = {
  id: string
  name: string
  description: string
  createdDateTime: Date
  updatedDateTime: Date
  createdBy: string
  updatedBy: string
}

type SharedServiceRoleResult = Omit<
  SharedServiceRole,
  | 'sharedService'
  | 'groupAssignments'
  | 'isDeleted'
  | 'createdDateTime'
  | 'updatedDateTime'
  | 'createdBy'
  | 'updatedBy'
>

type SharedServiceResult = {
  id: string
  name: string
  description: string | null
  clientIdentifier: string
  isActive: boolean
  sharedServiceRoles: SharedServiceRoleResult[]
}

export class GroupRepository {
  public async saveGroup(input: CreateGroupInputDto, manager: EntityManager) {
    const { name, description, tenantUserId, tenantId, createdBy } = input

    if (await this.checkIfGroupNameExistsInTenant(name, tenantId, manager)) {
      throw new ConflictError(
        `A group with name '${name}' already exists in this tenant`,
      )
    }

    if (tenantUserId) {
      if (!(await this.checkIfTenantUserExists(tenantUserId, manager))) {
        throw new NotFoundError(`Tenant user not found: ${tenantUserId}`)
      }
    }

    const group = new Group()
    group.name = name
    if (description !== undefined) {
      group.description = description
    }
    group.tenant = { id: tenantId } as Tenant
    group.createdBy = createdBy
    group.updatedBy = createdBy

    const savedGroup = await manager.save(group)

    if (tenantUserId) {
      const groupUser = new GroupUser()
      groupUser.group = savedGroup
      groupUser.tenantUser = { id: tenantUserId } as TenantUser
      groupUser.isDeleted = false
      groupUser.createdBy = createdBy
      groupUser.updatedBy = createdBy

      await manager.save(groupUser)
    }

    const groupResponse = await manager
      .createQueryBuilder(Group, 'group')
      .leftJoinAndSelect(
        'group.users',
        'groupUsers',
        'groupUsers.isDeleted = :isDeleted',
        { isDeleted: false },
      )
      .where('group.id = :id', { id: savedGroup.id })
      .getOne()

    if (!groupResponse) {
      throw new UnexpectedStateError('Group creation failed')
    }

    return groupResponse
  }

  public async getSsoUserDisplayName(
    ssoUserId: string,
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    const creator = await em.findOne(SSOUser, { where: { ssoUserId } })
    return creator?.displayName
  }

  private async getSsoUser(ssoUserId: string, manager?: EntityManager) {
    const em = manager ?? getManager()
    return await em.findOne(SSOUser, { where: { ssoUserId } })
  }

  public async checkIfGroupNameExistsInTenant(
    name: string,
    tenantId: string,
    manager?: EntityManager,
    excludeGroupId?: string,
  ) {
    const em = manager ?? getManager()
    const queryBuilder = em
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
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    const existingGroup = await em
      .createQueryBuilder(Group, 'group')
      .where('group.id = :groupId', { groupId })
      .andWhere('group.tenant.id = :tenantId', { tenantId })
      .getOne()

    return existingGroup
  }

  public async checkIfTenantUserExists(
    tenantUserId: string,
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    const tenantUser = await em.findOne(TenantUser, {
      where: { id: tenantUserId, isDeleted: false },
    })
    return !!tenantUser
  }

  public async getTenantGroups(
    input: GetTenantGroupsInputDto,
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    const tenantId = input.tenantId
    const TMS_AUDIENCE = input.tmsAudience
    const jwtAudience = input.jwtAudience

    const groupsQuery = em
      .createQueryBuilder(Group, 'grp')
      .innerJoin('grp.tenant', 'ten')
      .where('ten.id = :tenantId', { tenantId })
      .distinct(true)

    if (jwtAudience !== TMS_AUDIENCE) {
      groupsQuery
        .innerJoin(
          TenantSharedService,
          'tss',
          'tss.tenant.id = ten.id AND tss.isDeleted = false',
        )
        .innerJoin(
          'tss.sharedService',
          'ss',
          'ss.clientIdentifier = :jwtAudience AND ss.isActive = true',
          { jwtAudience },
        )
        .innerJoin(
          GroupSharedServiceRole,
          'gssr',
          'gssr.group.id = grp.id AND gssr.isDeleted = false',
        )
        .innerJoin(
          SharedServiceRole,
          'ssr',
          'ssr.id = gssr.sharedServiceRole.id AND ssr.sharedService.id = ss.id AND ssr.isDeleted = false',
        )
    }

    const groups = await groupsQuery.getMany()
    const uniqueCreatedByIds: string[] = [
      ...new Set(
        groups
          .map((group) => group.createdBy)
          .filter((id) => id && id !== 'system'),
      ),
    ]

    if (uniqueCreatedByIds.length > 0) {
      const creators = await em.find(SSOUser, {
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

  public async getGroupById(groupId: string, manager?: EntityManager) {
    const em = manager ?? getManager()
    const group = await em
      .createQueryBuilder(Group, 'group')
      .leftJoinAndSelect('group.tenant', 'tenant')
      .where('group.id = :groupId', { groupId })
      .getOne()

    if (!group) {
      throw new NotFoundError(`Group not found: ${groupId}`)
    }

    return group
  }

  public async getTenantUserGroups(
    tenantUserId: string,
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    const groupUsers = await em
      .createQueryBuilder(GroupUser, 'groupUser')
      .leftJoinAndSelect('groupUser.group', 'group')
      .where('groupUser.tenantUser.id = :tenantUserId', { tenantUserId })
      .andWhere('groupUser.isDeleted = :isDeleted', { isDeleted: false })
      .getMany()

    return groupUsers.map(
      (groupUser): TenantUserGroupResult => ({
        id: groupUser.group.id,
        name: groupUser.group.name,
        description: groupUser.group.description,
        createdDateTime: groupUser.group.createdDateTime,
        updatedDateTime: groupUser.group.updatedDateTime,
        createdBy: groupUser.group.createdBy,
        updatedBy: groupUser.group.updatedBy,
      }),
    )
  }

  public async getTenantUserSharedServiceRoles(
    tenantUserId: string,
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    const sharedServiceRoles = await em
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

    const sharedServiceMap = new Map<string, SharedServiceResult>()

    sharedServiceRoles.forEach((groupUser) => {
      if (groupUser.group?.sharedServiceRoles) {
        groupUser.group.sharedServiceRoles.forEach((gssr) => {
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

            const serviceEntry = sharedServiceMap.get(serviceId)
            if (!serviceEntry) {
              throw new UnexpectedStateError(
                `Shared service aggregation failed for service: ${serviceId}`,
              )
            }
            const roleExists = serviceEntry.sharedServiceRoles.some(
              (existingRole) => existingRole.id === role.id,
            )
            if (!roleExists) {
              const roleWithoutExcludedFields: SharedServiceRoleResult = {
                id: role.id,
                name: role.name,
                description: role.description,
                allowedIdentityProviders: role.allowedIdentityProviders,
              }
              serviceEntry.sharedServiceRoles.push(roleWithoutExcludedFields)
            }
          }
        })
      }
    })

    return Array.from(sharedServiceMap.values())
  }

  public async checkIfUserExistsInGroup(
    tenantUserId: string,
    groupId: string,
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    const existingGroupUser = await em
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
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    const softDeletedGroupUser = await em
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
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    const validGroups = await em
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
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    return await em
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
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    return await em
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
    manager: EntityManager,
  ) {
    await manager
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
    manager: EntityManager,
  ) {
    if (groupIds.length === 0) {
      return []
    }

    const validGroups = await this.validateGroupsForTenant(
      groupIds,
      tenantId,
      manager,
    )

    const existingGroupUsers = await this.getExistingGroupMemberships(
      tenantUserId,
      groupIds,
      manager,
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
      manager,
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
      await manager.save(groupsToRestore)
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
      await manager.save(newGroupUsers)
      addedGroups.push(...groupsToCreate)
    }

    return addedGroups
  }

  public async addGroupUser(
    input: AddGroupUserInputDto,
    manager: EntityManager,
  ) {
    const tenantId = input.tenantId
    const groupId = input.groupId
    const tenantUserId = input.tenantUserId
    const updatedBy = input.updatedBy

    const group = await this.checkIfGroupExistsInTenant(
      groupId,
      tenantId,
      manager,
    )
    if (!group) {
      throw new NotFoundError(`Group not found: ${groupId}`)
    }

    if (await this.checkIfUserExistsInGroup(tenantUserId, groupId, manager)) {
      throw new ConflictError('User is already a member of this group')
    }

    const softDeletedGroupUser = await this.findSoftDeletedGroupUser(
      tenantUserId,
      groupId,
      manager,
    )
    let savedGroupUser: GroupUser

    if (softDeletedGroupUser) {
      softDeletedGroupUser.isDeleted = false
      softDeletedGroupUser.updatedBy = updatedBy
      softDeletedGroupUser.updatedDateTime = new Date()

      savedGroupUser = await manager.save(softDeletedGroupUser)
    } else {
      const groupUser = new GroupUser()
      groupUser.group = { id: groupId } as Group
      groupUser.tenantUser = { id: tenantUserId } as TenantUser
      groupUser.isDeleted = false
      groupUser.createdBy = updatedBy
      groupUser.updatedBy = updatedBy

      savedGroupUser = await manager.save(groupUser)
    }

    const groupUserEntity = await manager
      .createQueryBuilder(GroupUser, 'groupUser')
      .leftJoinAndSelect('groupUser.tenantUser', 'tenantUser')
      .leftJoinAndSelect('tenantUser.ssoUser', 'ssoUser')
      .leftJoinAndSelect('tenantUser.roles', 'tenantUserRoles')
      .leftJoinAndSelect('tenantUserRoles.role', 'role')
      .where('groupUser.id = :id', { id: savedGroupUser.id })
      .getOne()

    if (!groupUserEntity) {
      throw new UnexpectedStateError('Group user creation failed')
    }

    const activeRoles =
      groupUserEntity.tenantUser.roles?.filter((tur) => !tur.isDeleted) || []
    const userRoles = activeRoles.map((tur) => tur.role) || []
    const groupUserResponse: AddGroupUserResultDto = {
      id: groupUserEntity.id,
      isDeleted: groupUserEntity.isDeleted,
      createdDateTime: groupUserEntity.createdDateTime,
      updatedDateTime: groupUserEntity.updatedDateTime,
      createdBy: groupUserEntity.createdBy,
      updatedBy: groupUserEntity.updatedBy,
      user: {
        id: groupUserEntity.tenantUser.id,
        isDeleted: groupUserEntity.tenantUser.isDeleted,
        ssoUser: groupUserEntity.tenantUser.ssoUser,
        createdDateTime: groupUserEntity.tenantUser.createdDateTime,
        updatedDateTime: groupUserEntity.tenantUser.updatedDateTime,
        createdBy: groupUserEntity.tenantUser.createdBy,
        updatedBy: groupUserEntity.tenantUser.updatedBy,
        roles: userRoles,
      },
    }

    return groupUserResponse
  }

  public async updateGroup(input: UpdateGroupInputDto, manager: EntityManager) {
    const groupId = input.groupId
    const tenantId = input.tenantId
    const { name, description, updatedBy } = input

    const existingGroup = await this.checkIfGroupExistsInTenant(
      groupId,
      tenantId,
      manager,
    )
    if (!existingGroup) {
      throw new NotFoundError(`Group not found: ${groupId}`)
    }

    if (name) {
      if (
        await this.checkIfGroupNameExistsInTenant(
          name,
          tenantId,
          manager,
          groupId,
        )
      ) {
        throw new ConflictError(
          `A group with name '${name}' already exists in this tenant`,
        )
      }
    }

    await manager
      .createQueryBuilder()
      .update(Group)
      .set({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        updatedBy,
      })
      .where('id = :groupId', { groupId })
      .execute()

    const groupResponse = await manager
      .createQueryBuilder(Group, 'group')
      .leftJoinAndSelect('group.tenant', 'tenant')
      .where('group.id = :id', { id: groupId })
      .getOne()

    if (!groupResponse) {
      throw new UnexpectedStateError('Group update failed')
    }

    return groupResponse
  }

  public async removeGroupUser(
    input: RemoveGroupUserInputDto,
    manager: EntityManager,
  ) {
    const groupUserId = input.groupUserId
    const groupId = input.groupId
    const tenantId = input.tenantId

    const group = await this.checkIfGroupExistsInTenant(
      groupId,
      tenantId,
      manager,
    )
    if (!group) {
      throw new NotFoundError(`Group not found: ${groupId}`)
    }

    const groupUser = await manager
      .createQueryBuilder(GroupUser, 'groupUser')
      .leftJoin('groupUser.group', 'group')
      .where('groupUser.id = :groupUserId', { groupUserId })
      .andWhere('groupUser.group.id = :groupId', { groupId })
      .andWhere('group.tenant.id = :tenantId', { tenantId })
      .andWhere('groupUser.isDeleted = :isDeleted', { isDeleted: false })
      .getOne()

    if (!groupUser) {
      throw new NotFoundError(`Group user not found: ${groupUserId}`)
    }

    await manager
      .createQueryBuilder()
      .update(GroupUser)
      .set({
        isDeleted: true,
        updatedBy: input.updatedBy,
      })
      .where('id = :groupUserId', { groupUserId })
      .execute()
  }

  public async getGroup(input: GetGroupInputDto, manager?: EntityManager) {
    const em = manager ?? getManager()
    const groupId = input.groupId
    const tenantId = input.tenantId
    const expand = input.expand

    const existingGroup = await this.checkIfGroupExistsInTenant(
      groupId,
      tenantId,
      em,
    )
    if (!existingGroup) {
      throw new NotFoundError(`Group not found: ${groupId}`)
    }

    const groupQuery = em
      .createQueryBuilder(Group, 'group')
      .where('group.id = :groupId', { groupId })

    if (expand.includes('groupUsers')) {
      groupQuery
        .leftJoinAndSelect(
          'group.users',
          'groupUsers',
          'groupUsers.isDeleted = :isDeleted',
          { isDeleted: false },
        )
        .leftJoinAndSelect(
          'groupUsers.tenantUser',
          'tenantUser',
          'tenantUser.isDeleted = :isDeleted',
          { isDeleted: false },
        )
        .leftJoinAndSelect('tenantUser.ssoUser', 'ssoUser')
    }

    const group = await groupQuery.getOne()

    if (!group) {
      throw new NotFoundError(`Group not found: ${groupId}`)
    }

    const normalizedCreatedBy = group.createdBy?.trim()

    let createdByUserName: string | undefined
    let createdByDisplayName: string | undefined
    if (normalizedCreatedBy === 'system') {
      createdByUserName = 'system'
      createdByDisplayName = 'system'
    } else if (normalizedCreatedBy) {
      const creator = await this.getSsoUser(normalizedCreatedBy, em)
      createdByUserName = creator?.userName
      createdByDisplayName = creator?.displayName
    }

    const groupResponse: GetGroupResultDto = {
      id: group.id,
      name: group.name,
      description: group.description,
      createdDateTime: group.createdDateTime,
      updatedDateTime: group.updatedDateTime,
      createdBy: group.createdBy,
      createdByUserName,
      createdByDisplayName,
      updatedBy: group.updatedBy,
    }

    if (expand.includes('groupUsers') && group.users) {
      const transformedUsers = group.users.map((groupUser) => ({
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
      groupResponse.users = transformedUsers
    }

    return groupResponse
  }

  public async getSharedServiceRolesForGroup(
    input: GetSharedServiceRolesForGroupInputDto,
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    const { tenantId, groupId } = input

    const groupExists = await em
      .createQueryBuilder(Group, 'group')
      .where('group.id = :groupId', { groupId })
      .andWhere('group.tenant.id = :tenantId', { tenantId })
      .getExists()

    if (!groupExists) {
      throw new NotFoundError(
        `Group not found or does not belong to tenant: ${groupId}`,
      )
    }

    return this.fetchSharedServiceRolesForGroup(tenantId, groupId, em)
  }

  private async fetchSharedServiceRolesForGroup(
    tenantId: string,
    groupId: string,
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    const result = await em
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

    const sharedServicesMap = new Map<
      string,
      GetSharedServiceForGroupResultDto
    >()

    result.entities.forEach((ssr, index) => {
      const raw = result.raw[index]
      const sharedServiceId = ssr.sharedService.id

      if (!sharedServicesMap.has(sharedServiceId)) {
        sharedServicesMap.set(sharedServiceId, {
          id: ssr.sharedService.id,
          name: ssr.sharedService.name,
          displayName: ssr.sharedService.displayName,
          clientIdentifier: ssr.sharedService.clientIdentifier,
          landingPageUrl: ssr.sharedService.landingPageUrl,
          description: ssr.sharedService.description,
          createdDateTime: ssr.sharedService.createdDateTime,
          updatedDateTime: ssr.sharedService.updatedDateTime,
          createdBy: ssr.sharedService.createdBy,
          updatedBy: ssr.sharedService.updatedBy,
          sharedServiceRoles: [],
        })
      }

      const sharedService = sharedServicesMap.get(sharedServiceId)
      if (sharedService) {
        sharedService.sharedServiceRoles.push({
          id: ssr.id,
          name: ssr.name,
          description: ssr.description,
          enabled: raw.enabled === 'true' || raw.enabled === true,
          createdDateTime: ssr.createdDateTime,
          createdBy: ssr.createdBy,
        })
      }
    })

    const sharedServices = Array.from(sharedServicesMap.values())
    sharedServices.sort((a, b) => a.name.localeCompare(b.name))

    return sharedServices
  }

  private async ensureGroupBelongsToTenant(
    tenantId: string,
    groupId: string,
    manager: EntityManager,
  ) {
    const group = await manager
      .createQueryBuilder(Group, 'group')
      .where('group.id = :groupId', { groupId })
      .andWhere('group.tenant.id = :tenantId', { tenantId })
      .getOne()

    if (!group) {
      throw new NotFoundError(
        `Group not found or does not belong to tenant: ${groupId}`,
      )
    }
  }

  private indexSharedServiceRoleInputs(
    sharedServices: UpdateSharedServiceRolesForGroupInputDto['sharedServices'],
  ) {
    const sharedServiceIds: string[] = sharedServices.map((ss) => ss.id)
    const sharedServiceRoleIds: string[] = []
    const roleToServiceMap = new Map<string, string>()

    sharedServices.forEach((ss) => {
      ss.sharedServiceRoles.forEach((role) => {
        sharedServiceRoleIds.push(role.id)
        roleToServiceMap.set(role.id, ss.id)
      })
    })

    return { sharedServiceIds, sharedServiceRoleIds, roleToServiceMap }
  }

  private async validateSharedServicesForTenant(
    tenantId: string,
    sharedServiceIds: string[],
    manager: EntityManager,
  ) {
    const tenantSharedServices = await manager
      .createQueryBuilder(TenantSharedService, 'tss')
      .leftJoinAndSelect('tss.sharedService', 'ss')
      .where('tss.tenant.id = :tenantId', { tenantId })
      .andWhere('tss.sharedService.id IN (:...sharedServiceIds)', {
        sharedServiceIds,
      })
      .andWhere('tss.isDeleted = :isDeleted', { isDeleted: false })
      .getMany()

    const tenantSharedServiceMap = new Map<string, TenantSharedService>()
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
  }

  private async validateSharedServiceRoles(
    sharedServiceRoleIds: string[],
    roleToServiceMap: Map<string, string>,
    manager: EntityManager,
  ) {
    const sharedServiceRoles = await manager
      .createQueryBuilder(SharedServiceRole, 'ssr')
      .leftJoinAndSelect('ssr.sharedService', 'ss')
      .where('ssr.id IN (:...sharedServiceRoleIds)', { sharedServiceRoleIds })
      .andWhere('ssr.isDeleted = :isDeleted', { isDeleted: false })
      .getMany()

    const sharedServiceRoleMap = new Map<string, SharedServiceRole>()
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
  }

  private async getExistingGroupSharedServiceRoleAssignments(
    groupId: string,
    sharedServiceRoleIds: string[],
    manager: EntityManager,
  ) {
    const existingAssignments = await manager
      .createQueryBuilder(GroupSharedServiceRole, 'gssr')
      .leftJoinAndSelect('gssr.sharedServiceRole', 'ssr')
      .where('gssr.group.id = :groupId', { groupId })
      .andWhere('gssr.sharedServiceRole.id IN (:...sharedServiceRoleIds)', {
        sharedServiceRoleIds,
      })
      .getMany()

    const existingAssignmentMap = new Map<string, GroupSharedServiceRole>()
    existingAssignments.forEach((gssr) => {
      if (gssr.sharedServiceRole) {
        existingAssignmentMap.set(gssr.sharedServiceRole.id, gssr)
      }
    })

    return existingAssignmentMap
  }

  private planSharedServiceRoleAssignment(
    groupId: string,
    sharedServiceRoleId: string,
    enabled: boolean,
    existingAssignment: GroupSharedServiceRole | undefined,
    updatedBy: string,
    toCreate: GroupSharedServiceRole[],
    toRestore: string[],
    toDelete: string[],
  ) {
    if (!enabled) {
      if (existingAssignment && !existingAssignment.isDeleted) {
        toDelete.push(existingAssignment.id)
      }
      return
    }

    if (!existingAssignment) {
      const newAssignment = new GroupSharedServiceRole()
      const groupRef = new Group()
      groupRef.id = groupId
      newAssignment.group = groupRef
      const sharedServiceRoleRef = new SharedServiceRole()
      sharedServiceRoleRef.id = sharedServiceRoleId
      newAssignment.sharedServiceRole = sharedServiceRoleRef
      newAssignment.isDeleted = false
      newAssignment.createdBy = updatedBy
      newAssignment.updatedBy = updatedBy
      toCreate.push(newAssignment)
    } else if (existingAssignment.isDeleted) {
      toRestore.push(existingAssignment.id)
    }
  }

  private computeSharedServiceRoleAssignmentDiff(
    groupId: string,
    sharedServices: UpdateSharedServiceRolesForGroupInputDto['sharedServices'],
    existingAssignmentMap: Map<string, GroupSharedServiceRole>,
    updatedBy: string,
  ) {
    const toCreate: GroupSharedServiceRole[] = []
    const toRestore: string[] = []
    const toDelete: string[] = []

    for (const sharedService of sharedServices) {
      for (const role of sharedService.sharedServiceRoles) {
        this.planSharedServiceRoleAssignment(
          groupId,
          role.id,
          role.enabled,
          existingAssignmentMap.get(role.id),
          updatedBy,
          toCreate,
          toRestore,
          toDelete,
        )
      }
    }

    return { toCreate, toRestore, toDelete }
  }

  private async applySharedServiceRoleAssignmentDiff(
    manager: EntityManager,
    toCreate: GroupSharedServiceRole[],
    toRestore: string[],
    toDelete: string[],
    updatedBy: string,
  ) {
    if (toCreate.length > 0) {
      await manager.save(GroupSharedServiceRole, toCreate)
    }

    if (toRestore.length > 0) {
      await manager
        .createQueryBuilder()
        .update('GroupSharedServiceRole')
        .set({
          isDeleted: false,
          updatedBy: updatedBy,
        })
        .where('id IN (:...ids)', { ids: toRestore })
        .execute()
    }

    if (toDelete.length > 0) {
      await manager
        .createQueryBuilder()
        .update('GroupSharedServiceRole')
        .set({
          isDeleted: true,
          updatedBy: updatedBy,
        })
        .where('id IN (:...ids)', { ids: toDelete })
        .execute()
    }
  }

  public async updateSharedServiceRolesForGroup(
    input: UpdateSharedServiceRolesForGroupInputDto,
    manager: EntityManager,
  ) {
    const { tenantId, groupId, sharedServices, updatedBy } = input

    await this.ensureGroupBelongsToTenant(tenantId, groupId, manager)

    const { sharedServiceIds, sharedServiceRoleIds, roleToServiceMap } =
      this.indexSharedServiceRoleInputs(sharedServices)

    await this.validateSharedServicesForTenant(
      tenantId,
      sharedServiceIds,
      manager,
    )
    await this.validateSharedServiceRoles(
      sharedServiceRoleIds,
      roleToServiceMap,
      manager,
    )

    const existingAssignmentMap =
      await this.getExistingGroupSharedServiceRoleAssignments(
        groupId,
        sharedServiceRoleIds,
        manager,
      )

    const { toCreate, toRestore, toDelete } =
      this.computeSharedServiceRoleAssignmentDiff(
        groupId,
        sharedServices,
        existingAssignmentMap,
        updatedBy,
      )

    await this.applySharedServiceRoleAssignmentDiff(
      manager,
      toCreate,
      toRestore,
      toDelete,
      updatedBy,
    )

    return this.fetchSharedServiceRolesForGroup(tenantId, groupId, manager)
  }

  public async getUserGroupsWithSharedServiceRoles(
    input: GetUserGroupsWithSharedServiceRolesInputDto,
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    const { tenantId, ssoUserId, audience, idpType } = input

    const tenantUser = await tmsRepository.getTenantUserBySsoId(
      ssoUserId,
      tenantId,
    )
    if (!tenantUser) {
      throw new NotFoundError(`Tenant user not found: ${ssoUserId}`)
    }

    const result = await em
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

    const groupsMap = new Map<
      string,
      {
        id: string
        name: string
        description: string | null
        createdDateTime: Date
        updatedDateTime: Date
        sharedServiceRoles: GetUserGroupsWithSharedServiceRoleResultDto[]
      }
    >()

    result.forEach((gu) => {
      const groupId = gu.group.id
      if (!groupsMap.has(groupId)) {
        groupsMap.set(groupId, {
          id: gu.group.id,
          name: gu.group.name,
          description: gu.group.description,
          createdDateTime: gu.group.createdDateTime,
          updatedDateTime: gu.group.updatedDateTime,
          sharedServiceRoles: [],
        })
      }
      const group = groupsMap.get(groupId)

      if (gu.group.sharedServiceRoles) {
        gu.group.sharedServiceRoles.forEach((gssr) => {
          if (
            gssr.sharedServiceRole &&
            gssr.sharedServiceRole.sharedService &&
            gssr.sharedServiceRole.sharedService.isActive &&
            gssr.sharedServiceRole.sharedService.clientIdentifier ===
              audience &&
            !gssr.isDeleted &&
            !gssr.sharedServiceRole.isDeleted
          ) {
            if (group) {
              group.sharedServiceRoles.push({
                id: gssr.sharedServiceRole.id,
                name: gssr.sharedServiceRole.name,
                description: gssr.sharedServiceRole.description,
                allowedIdentityProviders:
                  gssr.sharedServiceRole.allowedIdentityProviders,
                isDeleted: gssr.sharedServiceRole.isDeleted,
                createdDateTime: gssr.sharedServiceRole.createdDateTime,
                updatedDateTime: gssr.sharedServiceRole.updatedDateTime,
                createdBy: gssr.sharedServiceRole.createdBy,
                updatedBy: gssr.sharedServiceRole.updatedBy,
              })
            }
          }
        })
      }
    })

    const groups: GetUserGroupsWithSharedServiceRolesResultDto['groups'] =
      Array.from(groupsMap.values())
    groups.sort((a, b) => a.name.localeCompare(b.name))

    return { groups }
  }

  public async getEffectiveSharedServiceRoles(
    input: GetEffectiveSharedServiceRolesInputDto,
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    const { tenantId, ssoUserId, audience, idpType } = input

    const tenantUser = await tmsRepository.getTenantUserBySsoId(
      ssoUserId,
      tenantId,
    )
    if (!tenantUser) {
      throw new NotFoundError(`Tenant user not found: ${ssoUserId}`)
    }

    const result = await em
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

    const rolesMap = new Map<string, GetEffectiveSharedServiceRoleResultDto>()

    result.forEach((gu) => {
      if (gu.group?.sharedServiceRoles) {
        gu.group.sharedServiceRoles.forEach((gssr) => {
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
            if (role) {
              const groupExists = role.groups.some((g) => g.id === gu.group.id)
              if (!groupExists) {
                role.groups.push({
                  id: gu.group.id,
                  name: gu.group.name,
                })
              }
            }
          }
        })
      }
    })

    return Array.from(rolesMap.values())
  }
}

export const groupRepository = new GroupRepository()
