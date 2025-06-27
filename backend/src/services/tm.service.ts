import { Request, Response } from 'express'
import { TMRepository } from '../repositories/tm.repository'
import { TMSRepository } from '../repositories/tms.repository'
import { connection } from '../common/db.connection'
import logger from '../common/logger'

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
} 