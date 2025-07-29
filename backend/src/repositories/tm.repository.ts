import { Group } from '../entities/Group'
import { GroupUser } from '../entities/GroupUser'
import { TenantUser } from '../entities/TenantUser'
import { Tenant } from '../entities/Tenant'
import { EntityManager } from 'typeorm'
import { Request } from 'express'
import { NotFoundError } from '../errors/NotFoundError'
import { ConflictError } from '../errors/ConflictError'
import logger from '../common/logger'
import { TMSRepository } from './tms.repository'
import { TMSConstants } from '../common/tms.constants'
import { SharedServiceRole } from '../entities/SharedServiceRole'
import { TenantSharedService } from '../entities/TenantSharedService'
import { GroupSharedServiceRole } from '../entities/GroupSharedServiceRole'

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

                if (!await this.tmsRepository.checkIfTenantExists(tenantId, transactionEntityManager)) {
                    throw new NotFoundError(`Tenant not found: ${tenantId}`)
                }

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
                    .leftJoinAndSelect('group.users', 'groupUsers')
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
            .where('groupUser.tenantUser.id = :tenantUserId', { tenantUserId })
            .andWhere('group.tenant.id = :tenantId', { tenantId })
            .andWhere('groupUser.isDeleted = :isDeleted', { isDeleted: false })
            .getOne();

        return !!existingGroupUser;
    }

    public async checkIfTenantUserExists(tenantUserId: string, transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager;
        
        const tenantUser = await transactionEntityManager.findOne(TenantUser, { where: { id: tenantUserId } });
        return !!tenantUser;
    }

    public async getTenantGroups(req: Request) {
        const tenantId: string = req.params.tenantId
        const ssoUserId: string = req.decodedJwt?.idir_user_guid
        const TMS_AUDIENCE: string = process.env.TMS_AUDIENCE
        const jwtAudience: string = req.decodedJwt?.aud || req.decodedJwt?.audience || TMS_AUDIENCE

        if (!await this.tmsRepository.checkIfTenantExists(tenantId)) {
            throw new NotFoundError(`Tenant not found: ${tenantId}`)
        }

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
                .andWhere('su.ssoUserId = :ssoUserId', { ssoUserId });
        }

        const groups: any[] = await groupsQuery.getMany()
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
            .getMany();

        return groupUsers;
    }

    public async checkIfUserExistsInGroup(tenantUserId: string, groupId: string, transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager
        
        const existingGroupUser = await transactionEntityManager
            .createQueryBuilder(GroupUser, 'groupUser')
            .where('groupUser.tenantUser.id = :tenantUserId', { tenantUserId })
            .andWhere('groupUser.group.id = :groupId', { groupId })
            .andWhere('groupUser.isDeleted = :isDeleted', { isDeleted: false })
            .getOne();

        return !!existingGroupUser
    }

    public async addGroupUser(req: Request) {
        let groupUserResponse: any = null
        
        await this.manager.transaction(async(transactionEntityManager) => {
            try {
                const tenantId:string = req.params.tenantId
                const groupId:string = req.params.groupId
                const { user } = req.body
                const createdBy:string = req.decodedJwt?.idir_user_guid || 'system'

                if (!await this.tmsRepository.checkIfTenantExists(tenantId, transactionEntityManager)) {
                    throw new NotFoundError(`Tenant not found: ${tenantId}`)
                }

                const group = await this.checkIfGroupExistsInTenant(groupId, tenantId, transactionEntityManager);
                if (!group) {
                    throw new NotFoundError(`Group not found: ${groupId}`)
                }

                let tenantUser: TenantUser
                const existingTenant:Tenant = await this.tmsRepository.getTenantIfUserDoesNotExistForTenant(user.ssoUserId, tenantId)

                if (!existingTenant) {
                    const existingTenantUser:TenantUser = await this.tmsRepository.getTenantUserBySsoId(user.ssoUserId, tenantId, transactionEntityManager)
                    if (!existingTenantUser) {
                        throw new NotFoundError(`Tenant user not found: ${user.ssoUserId}`)
                    }
                    tenantUser = existingTenantUser;
                } else {
                    const serviceUserRole = await this.tmsRepository.findRoles([TMSConstants.SERVICE_USER], null)
                    if (serviceUserRole.length === 0) {
                        throw new NotFoundError('Service User role not found')
                    }
                    
                    const addTenantUsersRequest = {
                        params: { tenantId },
                        body: { 
                            user: user, 
                            roles: [serviceUserRole[0].id]
                        }
                    } as any;
                    
                    const tenantResponse: any = await this.tmsRepository.addTenantUsers(addTenantUsersRequest)
                    tenantUser = tenantResponse.savedTenantUser
                }

                if (await this.checkIfUserExistsInGroup(tenantUser.id, groupId, transactionEntityManager)) {
                    throw new ConflictError(`User is already a member of this group`)
                }

                const groupUser: GroupUser = new GroupUser()
                groupUser.group = { id: groupId } as Group
                groupUser.tenantUser = tenantUser
                groupUser.isDeleted = false
                groupUser.createdBy = createdBy
                groupUser.updatedBy = createdBy

                const savedGroupUser: GroupUser = await transactionEntityManager.save(groupUser)

                groupUserResponse = await transactionEntityManager
                    .createQueryBuilder(GroupUser, 'groupUser')
                    .leftJoinAndSelect('groupUser.tenantUser', 'tenantUser')
                    .leftJoinAndSelect('tenantUser.ssoUser', 'ssoUser')
                    .leftJoinAndSelect('tenantUser.roles', 'tenantUserRoles')
                    .leftJoinAndSelect('tenantUserRoles.role', 'role')
                    .where('groupUser.id = :id', { id: savedGroupUser.id })
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

            } catch(error) {
                logger.error('Add user to group transaction failure - rolling back inserts ', error)
                throw error
            }
        });

        return groupUserResponse
    }

    public async updateGroup(req: Request) {
        const groupId: string = req.params.groupId
        const tenantId: string = req.params.tenantId
        const { name, description } = req.body

        let groupResponse: Group = null
        await this.manager.transaction(async(transactionEntityManager) => {
            try {
                if (!await this.tmsRepository.checkIfTenantExists(tenantId, transactionEntityManager)) {
                    throw new NotFoundError(`Tenant not found: ${tenantId}`)
                }

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
                if (!await this.tmsRepository.checkIfTenantExists(tenantId, transactionEntityManager)) {
                    throw new NotFoundError(`Tenant not found: ${tenantId}`)
                }

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

        if (!await this.tmsRepository.checkIfTenantExists(tenantId)) {
            throw new NotFoundError(`Tenant not found: ${tenantId}`)
        }

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
                .filter((groupUser: any) => !groupUser.isDeleted)
                .map((groupUser: any) => ({
                    id: groupUser.id,
                    isDeleted: groupUser.isDeleted,
                    createdDateTime: groupUser.createdDateTime,
                    updatedDateTime: groupUser.updatedDateTime,
                    createdBy: groupUser.createdBy,
                    updatedBy: groupUser.updatedBy,
                    ssoUser: groupUser.tenantUser?.ssoUser
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
        const tenantId = req.params.tenantId;
        const ssoUserId = req.params.ssoUserId;

        const tenantUser = await this.tmsRepository.getTenantUserBySsoId(ssoUserId, tenantId);
        if (!tenantUser) {
            throw new NotFoundError(`Tenant user not found: ${ssoUserId}`);
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
            .orderBy('group.name', 'ASC')
            .addOrderBy('ss.name', 'ASC')
            .addOrderBy('ssr.name', 'ASC')
            .getMany();

        const groupsMap = new Map();

        result.forEach(gu => {
            const groupId = gu.group.id;
            if (!groupsMap.has(groupId)) {
                groupsMap.set(groupId, {
                    id: gu.group.id,
                    name: gu.group.name,
                    sharedServiceRoles: []
                });
            }
            const group = groupsMap.get(groupId);
            
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

        const groups = Array.from(groupsMap.values());
        groups.sort((a, b) => a.name.localeCompare(b.name));

        return { groups };
    }
} 