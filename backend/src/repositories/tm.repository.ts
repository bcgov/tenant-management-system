import { Group } from '../entities/Group'
import { GroupUser } from '../entities/GroupUser'
import { TenantUser } from '../entities/TenantUser'
import { Tenant } from '../entities/Tenant'
import { EntityManager } from 'typeorm'
import { In } from 'typeorm'
import { Request } from 'express'
import { NotFoundError } from '../errors/NotFoundError'
import { ConflictError } from '../errors/ConflictError'
import { BadRequestError } from '../errors/BadRequestError'
import logger from '../common/logger'
import { TMSRepository } from './tms.repository'
import { TMSConstants } from '../common/tms.constants'
import { GroupSharedServiceRole } from '../entities/GroupSharedServiceRole'
import { SSOUser } from '../entities/SSOUser'

export class TMRepository {

    constructor(private manager: EntityManager, private tmsRepository: TMSRepository) {
        this.manager = manager
        this.tmsRepository = tmsRepository
    }

    public async saveGroup(req: Request, transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager;
        let groupResponse = {}
        
        await this.manager.transaction(async(transactionEntityManager) => {
            try {
                const { name, description, tenantUserId } = req.body;
                const tenantId = req.params.tenantId;
                const createdBy = req.body.user?.ssoUserId || req.decodedJwt?.idir_user_guid || 'system';

                // REDUNDANT: checkTenantAccess middleware already validates tenant exists and user has access
                // if (!await this.tmsRepository.checkIfTenantExists(tenantId, transactionEntityManager)) {
                //     throw new NotFoundError(`Tenant not found: ${tenantId}`)
                // }

                if (await this.checkIfGroupNameExistsInTenant(name, tenantId, transactionEntityManager)) {
                    throw new ConflictError(`A group with name '${name}' already exists in this tenant`)
                }

                if (tenantUserId) {
                    if (!await this.checkIfTenantUserExists(tenantUserId, transactionEntityManager)) {
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

                groupResponse = await transactionEntityManager
                    .createQueryBuilder(Group, 'group')
                    .leftJoinAndSelect('group.users', 'groupUsers', 'groupUsers.isDeleted = :isDeleted', { isDeleted: false })
                    .where('group.id = :id', { id: savedGroup.id })
                    .getOne();

            } catch(error) {
                logger.error('Create group transaction failure - rolling back inserts ', error);
                throw error;
            }
        });

        if (groupResponse && (groupResponse as any).createdBy && (groupResponse as any).createdBy !== 'system') {
            const creator: any = await this.manager.findOne('SSOUser', { where: { ssoUserId: (groupResponse as any).createdBy } });
            (groupResponse as any).createdBy = creator?.displayName || (groupResponse as any).createdBy
        }

        return groupResponse
    }

    public async checkIfGroupNameExistsInTenant(name: string, tenantId: string, transactionEntityManager?: EntityManager, excludeGroupId?: string) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager;
        
        const queryBuilder = transactionEntityManager
            .createQueryBuilder(Group, 'group')
            .where('group.name = :name', { name })
            .andWhere('group.tenant.id = :tenantId', { tenantId });

        if (excludeGroupId) {
            queryBuilder.andWhere('group.id != :excludeGroupId', { excludeGroupId });
        }

        const existingGroup = await queryBuilder.getOne();

        return !!existingGroup;
    }

    public async checkIfGroupExistsInTenant(groupId: string, tenantId: string, transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager;
        
        const existingGroup = await transactionEntityManager
            .createQueryBuilder(Group, 'group')
            .where('group.id = :groupId', { groupId })
            .andWhere('group.tenant.id = :tenantId', { tenantId })
            .getOne();

        return existingGroup;
    }

    public async checkIfTenantUserAlreadyInGroup(tenantUserId: string, tenantId: string, transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager;
        
        const existingGroupUser:GroupUser = await transactionEntityManager
            .createQueryBuilder(GroupUser, 'groupUser')
            .leftJoin('groupUser.group', 'group')
            .leftJoin('groupUser.tenantUser', 'tenantUser')
            .where('groupUser.tenantUser.id = :tenantUserId', { tenantUserId })
            .andWhere('group.tenant.id = :tenantId', { tenantId })
            .andWhere('groupUser.isDeleted = :isDeleted', { isDeleted: false })
            .andWhere('tenantUser.isDeleted = :isDeleted', { isDeleted: false })
            .getOne();

        return !!existingGroupUser;
    }

    public async checkIfTenantUserExists(tenantUserId: string, transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager;
        
        const tenantUser = await transactionEntityManager.findOne(TenantUser, { where: { id: tenantUserId, isDeleted: false } });
        return !!tenantUser;
    }

    public async getTenantGroups(req: Request) {
        const tenantId: string = req.params.tenantId
        const ssoUserId: string = req.decodedJwt?.idir_user_guid
        const TMS_AUDIENCE: string = process.env.TMS_AUDIENCE
        const jwtAudience: string = req.decodedJwt?.aud || req.decodedJwt?.audience || TMS_AUDIENCE

        // REDUNDANT: checkTenantAccess middleware already validates tenant exists and user has access
        // if (!await this.tmsRepository.checkIfTenantExists(tenantId)) {
        //     throw new NotFoundError(`Tenant not found: ${tenantId}`)
        // }

        const groupsQuery = this.manager
            .createQueryBuilder(Group, 'group')
            .leftJoin('group.tenant', 'tenant')
            .leftJoin('TenantSharedService', 'tss', 'tenant.id = tss.tenant_id')
            .leftJoin('SharedService', 'ss', 'tss.shared_service_id = ss.id')
            .where('group.tenant.id = :tenantId', { tenantId })
            .andWhere(
                ':jwtAudience = :tmsAudience OR (:jwtAudience != :tmsAudience AND ss.client_identifier = :jwtAudience AND tss.is_deleted = :tssDeleted AND ss.is_active = :ssActive)',
                { 
                    jwtAudience, 
                    tmsAudience: TMS_AUDIENCE, 
                    tssDeleted: false,
                    ssActive: true
                }
            );

        if (jwtAudience === TMS_AUDIENCE && ssoUserId) {
            groupsQuery
                .innerJoin('tenant.users', 'tu')
                .innerJoin('tu.ssoUser', 'su')
                .andWhere('su.ssoUserId = :ssoUserId', { ssoUserId })
                .andWhere('tu.isDeleted = :isDeleted', { isDeleted: false });
        } else {
            groupsQuery
                .leftJoin('SharedServiceRole', 'ssr', 'ss.id = ssr.sharedService.id')
                .leftJoin('GroupSharedServiceRole', 'gssr', 
                    'ssr.id = gssr.sharedServiceRole.id AND group.id = gssr.group.id')
                .andWhere('gssr.isDeleted = :gssrDeleted', { gssrDeleted: false })
                .andWhere('ssr.isDeleted = :ssrDeleted', { ssrDeleted: false })
                .distinct(true); 
        }

        const groups: Group[] = await groupsQuery.getMany()

        const uniqueCreatedByIds: string[] = [...new Set(groups.map(group => group.createdBy).filter(id => id && id !== 'system'))]
        
        if (uniqueCreatedByIds.length > 0) {
            const creators = await this.manager.find(SSOUser, { 
                where: { ssoUserId: In(uniqueCreatedByIds) }
            })
            
            const creatorMap = new Map(creators.map(creator => [creator.ssoUserId, creator.displayName]))
            
            groups.forEach(group => {
                if (group.createdBy && group.createdBy !== 'system') {
                    group.createdBy = creatorMap.get(group.createdBy) || 'system'
                }
            })
        }

        return groups
    }

    public async getGroupById(groupId: string) {
        const group:Group = await this.manager
            .createQueryBuilder(Group, 'group')
            .leftJoinAndSelect('group.tenant', 'tenant')
            .where('group.id = :groupId', { groupId })
            .getOne();

        if (!group) {
            throw new NotFoundError(`Group not found: ${groupId}`);
        }

        return group;
    }

    public async getGroupUsers(groupId: string) {
        const groupUsers:GroupUser[] = await this.manager
            .createQueryBuilder(GroupUser, 'groupUser')
            .leftJoinAndSelect('groupUser.group', 'group')
            .leftJoinAndSelect('groupUser.tenantUser', 'tenantUser')
            .leftJoinAndSelect('tenantUser.ssoUser', 'ssoUser')
            .where('groupUser.group.id = :groupId', { groupId })
            .andWhere('groupUser.isDeleted = :isDeleted', { isDeleted: false })
            .andWhere('tenantUser.isDeleted = :isDeleted', { isDeleted: false })
            .getMany();

        return groupUsers;
    }

    public async checkIfUserExistsInGroup(tenantUserId: string, groupId: string, transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager
        
        const existingGroupUser:GroupUser = await transactionEntityManager
            .createQueryBuilder(GroupUser, 'groupUser')
            .where('groupUser.tenantUser.id = :tenantUserId', { tenantUserId })
            .andWhere('groupUser.group.id = :groupId', { groupId })
            .andWhere('groupUser.isDeleted = :isDeleted', { isDeleted: false })
            .getOne();

        return !!existingGroupUser
    }

    public async findSoftDeletedGroupUser(tenantUserId: string, groupId: string, transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager
        
        const softDeletedGroupUser:GroupUser = await transactionEntityManager
            .createQueryBuilder(GroupUser, 'groupUser')
            .where('groupUser.tenantUser.id = :tenantUserId', { tenantUserId })
            .andWhere('groupUser.group.id = :groupId', { groupId })
            .andWhere('groupUser.isDeleted = :isDeleted', { isDeleted: true })
            .getOne();

        return softDeletedGroupUser
    }

    public async validateGroupsForTenant(groupIds: string[], tenantId: string, transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager
        
        const validGroups = await transactionEntityManager
            .createQueryBuilder(Group, 'group')
            .where('group.id IN (:...groupIds)', { groupIds })
            .andWhere('group.tenant.id = :tenantId', { tenantId })
            .getMany()

        if (validGroups.length !== groupIds.length) {
            const validGroupIds = validGroups.map(g => g.id)
            const invalidGroupIds = groupIds.filter(id => !validGroupIds.includes(id))
            throw new NotFoundError(`Group(s) not found or do not belong to tenant: ${invalidGroupIds.join(', ')}`)
        }

        return validGroups
    }

    public async getExistingGroupMemberships(tenantUserId: string, groupIds: string[], transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager
        
        return await transactionEntityManager
            .createQueryBuilder(GroupUser, 'groupUser')
            .leftJoinAndSelect('groupUser.group', 'group')
            .where('groupUser.tenantUser.id = :tenantUserId', { tenantUserId })
            .andWhere('groupUser.group.id IN (:...groupIds)', { groupIds })
            .andWhere('groupUser.isDeleted = :isDeleted', { isDeleted: false })
            .getMany()
    }

    public async getSoftDeletedGroupMemberships(tenantUserId: string, groupIds: string[], transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager
        
        return await transactionEntityManager
            .createQueryBuilder(GroupUser, 'groupUser')
            .leftJoinAndSelect('groupUser.group', 'group')
            .where('groupUser.tenantUser.id = :tenantUserId', { tenantUserId })
            .andWhere('groupUser.group.id IN (:...groupIds)', { groupIds })
            .andWhere('groupUser.isDeleted = :isDeleted', { isDeleted: true })
            .getMany()
    }

    public async addUserToGroups(tenantUserId: string, groupIds: string[], tenantId: string, updatedBy: string, transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager
        
        if (groupIds.length === 0) {
            return []
        }

        const validGroups = await this.validateGroupsForTenant(groupIds, tenantId, transactionEntityManager)
        
        const existingGroupUsers = await this.getExistingGroupMemberships(tenantUserId, groupIds, transactionEntityManager)
        const existingGroupIds = existingGroupUsers.map(gu => gu.group.id)
        const groupsToAdd = validGroups.filter(g => !existingGroupIds.includes(g.id))

        if (groupsToAdd.length === 0) {
            return []
        }

        const softDeletedGroupUsers = await this.getSoftDeletedGroupMemberships(tenantUserId, groupsToAdd.map(g => g.id), transactionEntityManager)
        
        const softDeletedGroupIds = softDeletedGroupUsers.map(gu => gu.group.id)
        const groupsToRestore = softDeletedGroupUsers
        const groupsToCreate = groupsToAdd.filter(g => !softDeletedGroupIds.includes(g.id))

        const addedGroups: Group[] = []

        if (groupsToRestore.length > 0) {
            groupsToRestore.forEach(gu => {
                gu.isDeleted = false
                gu.updatedBy = updatedBy
                gu.updatedDateTime = new Date()
            })
            await transactionEntityManager.save(groupsToRestore)
            addedGroups.push(...groupsToRestore.map(gu => gu.group))
        }

        if (groupsToCreate.length > 0) {
            const newGroupUsers = groupsToCreate.map(group => {
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

    public async addGroupUser(req: Request, transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager
        
        const tenantId: string = req.params.tenantId
        const groupId: string = req.params.groupId
        const tenantUserId: string = req.body.tenantUserId
        const updatedBy: string = req.decodedJwt?.idir_user_guid || 'system'

        const group = await this.checkIfGroupExistsInTenant(groupId, tenantId, transactionEntityManager);
        if (!group) {
            throw new NotFoundError(`Group not found: ${groupId}`)
        }

        if (await this.checkIfUserExistsInGroup(tenantUserId, groupId, transactionEntityManager)) {
            throw new ConflictError(`User is already a member of this group`)
        }

        const softDeletedGroupUser = await this.findSoftDeletedGroupUser(tenantUserId, groupId, transactionEntityManager)
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
            .andWhere('tenantUserRoles.isDeleted = :isDeleted', { isDeleted: false })
            .getOne();

        if (groupUserResponse) {
            const userRoles = groupUserResponse.tenantUser.roles?.map(tur => tur.role) || []
            groupUserResponse = {
                ...groupUserResponse,
                user: {
                    ...groupUserResponse.tenantUser,
                    ssoUser: groupUserResponse.tenantUser.ssoUser,
                    roles: userRoles
                }
            };
            delete groupUserResponse.tenantUser
        }

        return groupUserResponse
    }

    public async updateGroup(req: Request) {
        const groupId: string = req.params.groupId
        const tenantId: string = req.params.tenantId
        const { name, description } = req.body

        let groupResponse: Group = null
        await this.manager.transaction(async(transactionEntityManager) => {
            try {
                // REDUNDANT: checkTenantAccess middleware already validates tenant exists and user has access
                // if (!await this.tmsRepository.checkIfTenantExists(tenantId, transactionEntityManager)) {
                //     throw new NotFoundError(`Tenant not found: ${tenantId}`)
                // }

                const existingGroup:Group = await this.checkIfGroupExistsInTenant(groupId, tenantId, transactionEntityManager)
                if (!existingGroup) {
                    throw new NotFoundError(`Group not found: ${groupId}`)
                }

                if (name) {
                    if (await this.checkIfGroupNameExistsInTenant(name, tenantId, transactionEntityManager, groupId)) {
                        throw new ConflictError(`A group with name '${name}' already exists in this tenant`)
                    }
                }

                await transactionEntityManager
                    .createQueryBuilder()
                    .update(Group)
                    .set({
                        ...(name && { name }),
                        ...(description && { description }),
                        updatedBy: req.decodedJwt?.idir_user_guid || 'system'
                    })
                    .where('id = :groupId', { groupId })
                    .execute();

                groupResponse = await transactionEntityManager
                    .createQueryBuilder(Group, 'group')
                    .leftJoinAndSelect('group.tenant', 'tenant')
                    .where('group.id = :id', { id: groupId })
                    .getOne();

            } catch (error) {
                logger.error('Update group transaction failure - rolling back changes', error)
                throw error
            }
        });

        return groupResponse
    }

    public async removeGroupUser(req: Request) {
        const groupUserId: string = req.params.groupUserId
        const groupId: string = req.params.groupId
        const tenantId: string = req.params.tenantId

        await this.manager.transaction(async(transactionEntityManager) => {
            try {
                // REDUNDANT: checkTenantAccess middleware already validates tenant exists and user has access
                // if (!await this.tmsRepository.checkIfTenantExists(tenantId, transactionEntityManager)) {
                //     throw new NotFoundError(`Tenant not found: ${tenantId}`)
                // }

                const group: Group = await this.checkIfGroupExistsInTenant(groupId, tenantId, transactionEntityManager)
                if (!group) {
                    throw new NotFoundError(`Group not found: ${groupId}`)
                }

                const groupUser: GroupUser = await transactionEntityManager
                    .createQueryBuilder(GroupUser, 'groupUser')
                    .leftJoin('groupUser.group', 'group')
                    .where('groupUser.id = :groupUserId', { groupUserId })
                    .andWhere('groupUser.group.id = :groupId', { groupId })
                    .andWhere('group.tenant.id = :tenantId', { tenantId })
                    .andWhere('groupUser.isDeleted = :isDeleted', { isDeleted: false })
                    .getOne();

                if (!groupUser) {
                    throw new NotFoundError(`Group user not found: ${groupUserId}`)
                }

                await transactionEntityManager
                    .createQueryBuilder()
                    .update(GroupUser)
                    .set({
                        isDeleted: true,
                        updatedBy: req.decodedJwt?.idir_user_guid || 'system'
                    })
                    .where('id = :groupUserId', { groupUserId })
                    .execute();

            } catch (error) {
                logger.error('Remove user from group transaction failure - rolling back changes', error)
                throw error
            }
        });
    }

    public async getGroup(req: Request) {
        const groupId: string = req.params.groupId
        const tenantId: string = req.params.tenantId
        const expand: string[] = typeof req.query.expand === "string" ? req.query.expand.split(",") : []

        // REDUNDANT: checkTenantAccess middleware already validates tenant exists and user has access
        // if (!await this.tmsRepository.checkIfTenantExists(tenantId)) {
        //     throw new NotFoundError(`Tenant not found: ${tenantId}`)
        // }

        const existingGroup: Group = await this.checkIfGroupExistsInTenant(groupId, tenantId)
        if (!existingGroup) {
            throw new NotFoundError(`Group not found: ${groupId}`)
        }

        const groupQuery = this.manager
            .createQueryBuilder(Group, "group")
            .where("group.id = :groupId", { groupId });

        if (expand.includes("groupUsers")) {
            groupQuery.leftJoinAndSelect("group.users", "groupUsers")
                .leftJoinAndSelect("groupUsers.tenantUser", "tenantUser")
                .leftJoinAndSelect("tenantUser.ssoUser", "ssoUser")
                .andWhere("groupUsers.isDeleted = :isDeleted", { isDeleted: false })
                .andWhere("tenantUser.isDeleted = :isDeleted", { isDeleted: false })
        }

        const group: any = await groupQuery.getOne();
        
        if(!group) {
            throw new NotFoundError(`Group not found: ${groupId}`)
        }
            
        if (group.createdBy) {
            const creator: any = await this.manager.findOne('SSOUser', { where: { ssoUserId: group.createdBy } });
            group.createdBy = creator?.userName || group.createdBy;
        }

        if (expand.includes("groupUsers") && group.users) {
            const transformedUsers = group.users
                .map((groupUser: any) => ({
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
                        updatedBy: groupUser.tenantUser?.updatedBy
                    }
                }));
            group.users = transformedUsers;
        }

        return group
    }

    public async getSharedServiceRolesForGroup(req: Request) {
        const tenantId = req.params.tenantId
        const groupId = req.params.groupId
        
        const group: any = await this.manager
            .createQueryBuilder('Group', 'group')
            .where('group.id = :groupId', { groupId })
            .andWhere('group.tenant.id = :tenantId', { tenantId })
            .getOne();

        if (!group) {
            throw new NotFoundError(`Group not found or does not belong to tenant: ${groupId}`);
        }
      
        const result = await this.manager
            .createQueryBuilder('SharedServiceRole', 'ssr')
            .leftJoinAndSelect('ssr.sharedService', 'ss')
            .leftJoin('TenantSharedService', 'tss', 'ss.id = tss.sharedService.id')
            .leftJoin('GroupSharedServiceRole', 'gssr', 
                'ssr.id = gssr.sharedServiceRole.id AND gssr.group.id = :groupId AND gssr.isDeleted = :gssrDeleted')
            .addSelect('CASE WHEN gssr.id IS NOT NULL THEN true ELSE false END', 'enabled')
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
            .getRawAndEntities();

        const sharedServicesMap = new Map();

        result.entities.forEach((ssr, index) => {
            const raw = result.raw[index];
            const sharedServiceId = ssr.sharedService.id;
            
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
                    sharedServiceRoles: []
                });
            }

            const sharedService = sharedServicesMap.get(sharedServiceId);
            sharedService.sharedServiceRoles.push({
                id: ssr.id,
                name: ssr.name,
                description: ssr.description,
                enabled: raw.enabled === 'true' || raw.enabled === true,
                createdDateTime: ssr.createdDateTime,
                createdBy: ssr.createdBy
            });
        });

        const sharedServices = Array.from(sharedServicesMap.values());
        sharedServices.sort((a, b) => a.name.localeCompare(b.name));

        return sharedServices;
    }

    public async updateSharedServiceRolesForGroup(req: Request) {
        const tenantId = req.params.tenantId;
        const groupId = req.params.groupId;
        const { sharedServices } = req.body;
        const ssoUserId = req.decodedJwt?.idir_user_guid || 'system';

        await this.manager.transaction(async(transactionEntityManager) => {

            const group: any = await transactionEntityManager
                .createQueryBuilder('Group', 'group')
                .where('group.id = :groupId', { groupId })
                .andWhere('group.tenant.id = :tenantId', { tenantId })
                .getOne();

            if (!group) {
                throw new NotFoundError(`Group not found or does not belong to tenant: ${groupId}`);
            }

            for (const sharedService of sharedServices) {
                const { id: sharedServiceId, sharedServiceRoles } = sharedService;

                const tenantSharedService = await transactionEntityManager
                    .createQueryBuilder('TenantSharedService', 'tss')
                    .leftJoinAndSelect('tss.sharedService', 'ss')
                    .where('tss.tenant.id = :tenantId', { tenantId })
                    .andWhere('tss.sharedService.id = :sharedServiceId', { sharedServiceId })
                    .andWhere('tss.isDeleted = :isDeleted', { isDeleted: false })
                    .getOne();

                if (!tenantSharedService) {
                    throw new NotFoundError(`Shared service not found or not associated with tenant: ${sharedServiceId}`);
                }

                for (const role of sharedServiceRoles) {
                    const { id: sharedServiceRoleId, enabled } = role;

                    const sharedServiceRole = await transactionEntityManager
                        .createQueryBuilder('SharedServiceRole', 'ssr')
                        .where('ssr.id = :id', { id: sharedServiceRoleId })
                        .andWhere('ssr.sharedService.id = :sharedServiceId', { sharedServiceId })
                        .andWhere('ssr.isDeleted = :isDeleted', { isDeleted: false })
                        .getOne();

                    if (!sharedServiceRole) {
                        throw new NotFoundError(`Shared service role not found: ${sharedServiceRoleId}`);
                    }

                    const existingAssignment = await transactionEntityManager
                        .createQueryBuilder('GroupSharedServiceRole', 'gssr')
                        .where('gssr.group.id = :groupId', { groupId })
                        .andWhere('gssr.sharedServiceRole.id = :sharedServiceRoleId', { sharedServiceRoleId })
                        .getOne();

                    if (enabled) {
                        if (!existingAssignment) {

                            const newAssignment = new GroupSharedServiceRole();
                            newAssignment.group = { id: groupId } as any;
                            newAssignment.sharedServiceRole = { id: sharedServiceRoleId } as any;
                            newAssignment.isDeleted = false;
                            newAssignment.createdBy = ssoUserId;
                            newAssignment.updatedBy = ssoUserId;
                            await transactionEntityManager.save(newAssignment);
                        } else if (existingAssignment.isDeleted) {

                            await transactionEntityManager
                                .createQueryBuilder()
                                .update('GroupSharedServiceRole')
                                .set({
                                    isDeleted: false,
                                    updatedBy: ssoUserId
                                })
                                .where('id = :id', { id: existingAssignment.id })
                                .execute();
                        }
                    } else {
                        if (existingAssignment && !existingAssignment.isDeleted) {
                            await transactionEntityManager
                                .createQueryBuilder()
                                .update('GroupSharedServiceRole')
                                .set({
                                    isDeleted: true,
                                    updatedBy: ssoUserId
                                })
                                .where('id = :id', { id: existingAssignment.id })
                                .execute();
                        }
                    }
                }
            }
        });

        return await this.getSharedServiceRolesForGroup(req)
    }

    public async getUserGroupsWithSharedServiceRoles(req: Request, audience: string) {
        const tenantId: string = req.params.tenantId
        const ssoUserId: string = req.params.ssoUserId
        const idpType: string = req.idpType

        const tenantUser: TenantUser = await this.tmsRepository.getTenantUserBySsoId(ssoUserId, tenantId)
        if (!tenantUser) {
            throw new NotFoundError(`Tenant user not found: ${ssoUserId}`)
        }

        const result = await this.manager
            .createQueryBuilder('GroupUser', 'gu')
            .leftJoinAndSelect('gu.group', 'group')
            .leftJoinAndSelect('group.sharedServiceRoles', 'gssr')
            .leftJoinAndSelect('gssr.sharedServiceRole', 'ssr')
            .leftJoinAndSelect('ssr.sharedService', 'ss')
            .leftJoin('TenantSharedService', 'tss', 'ss.id = tss.sharedService.id')
            .where('gu.tenantUser.id = :tenantUserId', { tenantUserId: tenantUser.id })
            .andWhere('gu.isDeleted = :guDeleted', { guDeleted: false })
            .andWhere('gssr.isDeleted = :gssrDeleted', { gssrDeleted: false })
            .andWhere('ssr.isDeleted = :ssrDeleted', { ssrDeleted: false })
            .andWhere('ss.isActive = :ssActive', { ssActive: true })
            .andWhere('ss.clientIdentifier = :audience', { audience })
            .andWhere('tss.tenant.id = :tenantId', { tenantId })
            .andWhere('tss.isDeleted = :tssDeleted', { tssDeleted: false })
            .andWhere('(ssr.allowedIdentityProviders IS NULL OR :idpType = ANY(ssr.allowedIdentityProviders))', { idpType })
            .orderBy('group.name', 'ASC')
            .addOrderBy('ss.name', 'ASC')
            .addOrderBy('ssr.name', 'ASC')
            .getMany();

        const groupsMap = new Map()

        result.forEach(gu => {
            const groupId = gu.group.id;
            if (!groupsMap.has(groupId)) {
                groupsMap.set(groupId, {
                    id: gu.group.id,
                    name: gu.group.name,
                    sharedServiceRoles: []
                });
            }
            const group = groupsMap.get(groupId)
            
            if (gu.group.sharedServiceRoles) {
                gu.group.sharedServiceRoles.forEach(gssr => {
                    if (
                        gssr.sharedServiceRole &&
                        gssr.sharedServiceRole.sharedService &&
                        gssr.sharedServiceRole.sharedService.isActive &&
                        gssr.sharedServiceRole.sharedService.clientIdentifier === audience &&
                        !gssr.isDeleted &&
                        !gssr.sharedServiceRole.isDeleted
                    ) {
                        group.sharedServiceRoles.push({
                            name: gssr.sharedServiceRole.name,
                            enabled: true
                        });
                    }
                });
            }
        });

        const groups = Array.from(groupsMap.values())
        groups.sort((a, b) => a.name.localeCompare(b.name))

        return { groups }
    }

    public async getTenantUser(req: Request) {
        const tenantId: string = req.params.tenantId
        const tenantUserId: string = req.params.tenantUserId
        const expand: string[] = typeof req.query.expand === "string" ? req.query.expand.split(",") : []

        const validExpandValues:string[] = ['groupMemberships', 'tenantUserRoles', 'sharedServiceRoles']
        const invalidExpandValues:string[] = expand.filter(value => !validExpandValues.includes(value))
        if (invalidExpandValues.length > 0) {
            throw new BadRequestError(`Invalid expand values: ${invalidExpandValues.join(', ')}. Valid values are: ${validExpandValues.join(', ')}`)
        }

        const tenantUserQuery = this.manager
            .createQueryBuilder(TenantUser, "tenantUser")
            .leftJoinAndSelect("tenantUser.ssoUser", "ssoUser")
            .leftJoin("tenantUser.tenant", "tenant")
            .where("tenantUser.id = :tenantUserId", { tenantUserId })
            .andWhere("tenant.id = :tenantId", { tenantId })
            .andWhere("tenantUser.isDeleted = :isDeleted", { isDeleted: false })

        if (expand.includes("groupMemberships")) {
            tenantUserQuery.leftJoin("GroupUser", "groupUser", "groupUser.tenantUser.id = tenantUser.id")
                .leftJoinAndSelect("groupUser.group", "group")
                .andWhere("groupUser.isDeleted = :isDeleted", { isDeleted: false })
        }

        if (expand.includes("tenantUserRoles")) {
            tenantUserQuery.leftJoinAndSelect("tenantUser.roles", "tenantUserRole")
                .leftJoinAndSelect("tenantUserRole.role", "role")
                .andWhere("tenantUserRole.isDeleted = :isDeleted", { isDeleted: false })
                .andWhere("role.isDeleted = :isDeleted", { isDeleted: false })
        }

        if (expand.includes("sharedServiceRoles")) {
            tenantUserQuery.leftJoin("GroupUser", "groupUserForSSR", "groupUserForSSR.tenantUser.id = tenantUser.id")
                .leftJoin("groupUserForSSR.group", "groupForSSR")
                .leftJoin("GroupSharedServiceRole", "gssr", "groupForSSR.id = gssr.group_id")
                .leftJoinAndSelect("gssr.sharedServiceRole", "sharedServiceRole")
                .leftJoinAndSelect("sharedServiceRole.sharedService", "sharedService")
                .andWhere("groupUserForSSR.isDeleted = :isDeleted", { isDeleted: false })
                .andWhere("gssr.isDeleted = :isDeleted", { isDeleted: false })
                .andWhere("sharedServiceRole.isDeleted = :isDeleted", { isDeleted: false })
        }

        const tenantUser: any = await tenantUserQuery.getOne()

        if (!tenantUser) {
            throw new NotFoundError(`Tenant user not found: ${tenantUserId}`)
        }

        const result: any = {
            id: tenantUser.id,
            ssoUser: tenantUser.ssoUser,
            createdDateTime: tenantUser.createdDateTime,
            updatedDateTime: tenantUser.updatedDateTime,
            createdBy: tenantUser.createdBy,
            updatedBy: tenantUser.updatedBy
        }

        if (expand.includes("groupMemberships")) {
            const groupUsers = await this.manager
                .createQueryBuilder(GroupUser, "groupUser")
                .leftJoinAndSelect("groupUser.group", "group")
                .where("groupUser.tenantUser.id = :tenantUserId", { tenantUserId })
                .andWhere("groupUser.isDeleted = :isDeleted", { isDeleted: false })
                .getMany()

            result.groups = groupUsers.map((groupUser: any) => {
                const group = groupUser.group
                return {
                    id: group.id,
                    name: group.name,
                    description: group.description,
                    createdDateTime: group.createdDateTime,
                    updatedDateTime: group.updatedDateTime,
                    createdBy: group.createdBy,
                    updatedBy: group.updatedBy
                }
            })
        }

        if (expand.includes("tenantUserRoles") && tenantUser.roles) {
            result.roles = tenantUser.roles.map((tenantUserRole: any) => tenantUserRole.role)
        }

        if (expand.includes("sharedServiceRoles")) {
            const sharedServiceRoles = await this.manager
                .createQueryBuilder(GroupUser, "groupUser")
                .leftJoin("groupUser.group", "group")
                .leftJoin("GroupSharedServiceRole", "gssr", "group.id = gssr.group_id")
                .leftJoinAndSelect("gssr.sharedServiceRole", "sharedServiceRole")
                .leftJoinAndSelect("sharedServiceRole.sharedService", "sharedService")
                .where("groupUser.tenantUser.id = :tenantUserId", { tenantUserId })
                .andWhere("groupUser.isDeleted = :isDeleted", { isDeleted: false })
                .andWhere("gssr.isDeleted = :isDeleted", { isDeleted: false })
                .andWhere("sharedServiceRole.isDeleted = :isDeleted", { isDeleted: false })
                .getMany()

            const sharedServiceRolesMap = new Map()
            
            sharedServiceRoles.forEach((groupUser: any) => {
                if (groupUser.group && groupUser.group.sharedServiceRoles) {
                    groupUser.group.sharedServiceRoles.forEach((gssr: any) => {
                        if (gssr.sharedServiceRole && gssr.sharedServiceRole.sharedService) {
                            const key = `${gssr.sharedServiceRole.id}-${gssr.sharedServiceRole.sharedService.id}`
                            if (!sharedServiceRolesMap.has(key)) {
                                sharedServiceRolesMap.set(key, {
                                    role: gssr.sharedServiceRole,
                                    sharedService: gssr.sharedServiceRole.sharedService
                                })
                            }
                        }
                    })
                }
            })
            
            result.sharedServiceRoles = Array.from(sharedServiceRolesMap.values())
        }

        return result
    }
} 