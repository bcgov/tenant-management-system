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
                    
                    if (await this.checkIfTenantUserAlreadyInGroup(tenantUserId, tenantId, transactionEntityManager)) {
                        throw new ConflictError(`User is already assigned to a group in this tenant`)
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
                    .leftJoinAndSelect('group.tenant', 'tenant')
                    .where('group.id = :id', { id: savedGroup.id })
                    .getOne();

            } catch(error) {
                logger.error('Create group transaction failure - rolling back inserts ', error);
                throw error;
            }
        });

        return groupResponse;
    }

    public async checkIfGroupNameExistsInTenant(name: string, tenantId: string, transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager;
        
        const existingGroup = await transactionEntityManager
            .createQueryBuilder(Group, 'group')
            .where('group.name = :name', { name })
            .andWhere('group.tenant.id = :tenantId', { tenantId })
            .getOne();

        return !!existingGroup;
    }

    public async checkIfTenantUserAlreadyInGroup(tenantUserId: string, tenantId: string, transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager;
        
        const existingGroupUser = await transactionEntityManager
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
} 