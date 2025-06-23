import { Request, Response } from 'express'
import { TMRepository } from '../repositories/tm.repository'
import { connection } from '../common/db.connection'
import logger from '../common/logger'

export class TMService {

    tmRepository: TMRepository = new TMRepository(connection.manager)
    
    public async createGroup(req: Request) {
        const savedGroup: any = await this.tmRepository.saveGroup(req)
        
        return {
            data: { 
                group: savedGroup
            }   
        }       
    }
} 