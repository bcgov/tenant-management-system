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

        return groupResponse;
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

    public async getGroupsForTenant(tenantId: string) {
        const groups:Group[] = await this.manager
            .createQueryBuilder(Group, 'group')
            .leftJoinAndSelect('group.tenant', 'tenant')
            .where('group.tenant.id = :tenantId', { tenantId })
            .getMany();

        return groups;
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
        const groupId: string = req.params.groupId;
        const tenantId: string = req.params.tenantId;
        const { name, description } = req.body;

        let groupResponse: Group = null
        await this.manager.transaction(async(transactionEntityManager) => {
            try {
                if (!await this.tmsRepository.checkIfTenantExists(tenantId, transactionEntityManager)) {
                    throw new NotFoundError(`Tenant not found: ${tenantId}`)
                }

                const existingGroup = await this.checkIfGroupExistsInTenant(groupId, tenantId, transactionEntityManager);
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
                logger.error('Update group transaction failure - rolling back changes', error);
                throw error
            }
        });

        return groupResponse
    }
} 