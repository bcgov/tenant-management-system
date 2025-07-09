import { Request, Response } from 'express'
import { TMRepository } from '../repositories/tm.repository'
import { TMSRepository } from '../repositories/tms.repository'
import { connection } from '../common/db.connection'
import logger from '../common/logger'
import { UnauthorizedError } from '../errors/UnauthorizedError'

export class TMService {

    tmRepository: TMRepository = new TMRepository(connection.manager, new TMSRepository(connection.manager))
    
    public async createGroup(req: Request) {
        const savedGroup: any = await this.tmRepository.saveGroup(req)
        
        return {
            data: { 
                group: savedGroup
            }   
        }       
    }

    public async addGroupUser(req: Request) {
        const savedGroupUser: any = await this.tmRepository.addGroupUser(req)
        
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

    public async getUserGroupsWithSharedServices(req: Request) {
        const audience = req.decodedJwt?.aud || req.decodedJwt?.audience;
        if (!audience) {
            throw new UnauthorizedError('Missing audience in JWT token');
        }

        const result = await this.tmRepository.getUserGroupsWithSharedServices(req, audience);
        
        return {
            data: result
        };
    }
} 