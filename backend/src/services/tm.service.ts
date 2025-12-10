import { Request, Response } from 'express'
import { TMRepository } from '../repositories/tm.repository'
import { TMSRepository } from '../repositories/tms.repository'
import { connection } from '../common/db.connection'
import logger from '../common/logger'
import { UnauthorizedError } from '../errors/UnauthorizedError'
import { NotFoundError } from '../errors/NotFoundError'

export class TMService {

    tmsRepository: TMSRepository = new TMSRepository(connection.manager)
    tmRepository: TMRepository = new TMRepository(connection.manager, this.tmsRepository)
    
    public async createGroup(req: Request) {
        const savedGroup: any = await this.tmRepository.saveGroup(req)
        
        return {
            data: { 
                group: savedGroup
            }   
        }       
    }

    public async addGroupUser(req: Request) {
        let savedGroupUser: any = null
        
        await connection.manager.transaction(async(transactionEntityManager) => {
            try {
                const tenantId: string = req.params.tenantId
                const groupId: string = req.params.groupId
                const { user } = req.body
                const updatedBy: string = req.decodedJwt?.idir_user_guid || 'system'

                const group = await this.tmRepository.checkIfGroupExistsInTenant(groupId, tenantId, transactionEntityManager)
                if (!group) {
                    throw new NotFoundError(`Group not found or does not exist for tenant: ${tenantId}`)
                }

                const tenantUser = await this.tmsRepository.ensureTenantUserExists(user, tenantId, updatedBy, transactionEntityManager)
                req.body.tenantUserId = tenantUser.id
                savedGroupUser = await this.tmRepository.addGroupUser(req, transactionEntityManager)
            } catch(error: any) {
                logger.error('Add user to group transaction failure - rolling back inserts ', error)
                throw error
            }
        })
        
        return {
            data: { 
                groupUser: savedGroupUser
            }   
        }       
    }

    public async updateGroup(req: Request) {
        const updatedGroup: any = await this.tmRepository.updateGroup(req)
        
        return {
            data: { 
                group: updatedGroup
            }   
        }       
    }

    public async removeGroupUser(req: Request) {
        await this.tmRepository.removeGroupUser(req)
        
        return {
            data: { 
                message: "User successfully removed from group"
            }   
        }       
    }

    public async getGroup(req: Request) {
        const group: any = await this.tmRepository.getGroup(req)
        
        return {
            data: { 
                group: group
            }   
        }       
    }

    public async getTenantGroups(req: Request) {
        const groups: any = await this.tmRepository.getTenantGroups(req)
        
        return {
            data: { 
                groups: groups
            }   
        }       
    }

    public async getSharedServiceRolesForGroup(req: Request) {
        const sharedServices = await this.tmRepository.getSharedServiceRolesForGroup(req)
        
        return {
            data: { 
                sharedServices: sharedServices
            }   
        }       
    }

    public async updateSharedServiceRolesForGroup(req: Request) {
        const sharedServices = await this.tmRepository.updateSharedServiceRolesForGroup(req)
        
        return {
            data: { 
                sharedServices: sharedServices
            }   
        }       
    }

    public async getUserGroupsWithSharedServiceRoles(req: Request) {
        const audience = req.decodedJwt?.aud || req.decodedJwt?.audience;
        if (!audience) {
            throw new UnauthorizedError('Missing audience in JWT token');
        }

        const result = await this.tmRepository.getUserGroupsWithSharedServiceRoles(req, audience);
        
        return {
            data: result
        };
    }

    public async getEffectiveSharedServiceRoles(req: Request) {
        const audience = req.decodedJwt?.aud || req.decodedJwt?.audience;
        if (!audience) {
            throw new UnauthorizedError('Missing audience in JWT token');
        }

        const sharedServiceRoles = await this.tmRepository.getEffectiveSharedServiceRoles(req, audience);
        
        return {
            data: {
                sharedServiceRoles
            }
        };
    }

    public async getTenantUser(req: Request) {
        const tenantUser: any = await this.tmRepository.getTenantUser(req)
        
        return {
            data: { 
                tenantUser: tenantUser
            }   
        }       
    }
} 