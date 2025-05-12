import { Request, Response } from 'express'
import {TMSRepository} from '../repositories/tms.repository'
import { connection } from '../common/db.connection'
import { URLSearchParams } from 'url'
import axios from 'axios';
import logger from '../common/logger'

export class TMSService {

    tmsRepository:TMSRepository = new TMSRepository(connection.manager)
    
    public async createTenant(req:Request) {
        const savedTenant:any = await this.tmsRepository.saveTenant(req)
        
        if (savedTenant?.users) {
            savedTenant.users = savedTenant.users.map(user => ({
                ...user,
                roles: user.roles.map(tur => tur.role)
            }));
        }

        return {
            data: { 
                tenant:savedTenant
            }   
        }       
    }

    public async addTenantUser(req:Request) {       
        const response:any = await this.tmsRepository.addTenantUsers(req)  
        const savedUser:any = response.user?.savedTenantUser || response.savedTenantUser
        const roleAssignments:any = response.roleAssignments || []
        const roles:any = roleAssignments.map(assignment => assignment.role)
        return {
            data: {
              user: {
                ...savedUser,
                ssoUser: savedUser?.ssoUser,
                roles: roles
              },
              
            }
        };
    }

    public async getTenantsForUser(req:Request) {
        const tenants = await this.tmsRepository.getTenantsForUser(req.params.ssoUserId)
        return {
            data: {
                tenants
            }
        }
    }
    
    public async getUsersForTenant(req:Request) {
        const users = await this.tmsRepository.getUsersForTenant(req.params.tenantId)
        return {
            data: {
                users
            }
        }
    }

    public async createRoles(req:Request) {
        const roles = await this.tmsRepository.createRoles(req)
        return {
            data: {
                role:roles
            }
        }
    }

    public async assignUserRoles(req:Request) {
        const { tenantId, tenantUserId, roleId } = req.params;
        const data = await this.tmsRepository.assignUserRoles(tenantId, tenantUserId, [roleId],null)
        return {
           data
        }
    }

    public async getTenantRoles(req:Request) {
        const roles = await this.tmsRepository.getTenantRoles(req)
        return { 
            data : {
                roles
            }
        }
    }

    public async getUserRoles(req:Request) {
        const roles = await this.tmsRepository.getUserRoles(req)
        return {
            data: {
                roles
            }
        }
    }

    public async unassignUserRoles(req:Request) {
        await this.tmsRepository.unassignUserRoles(req)
    }

    public async searchBCGOVSSOUsers(req:Request) {
        try {
            const token:string = await this.getToken()
            const queryParams = req.query;
            const response = await axios.get(process.env.BCGOV_SSO_API_URL, {
                headers: { Authorization: `Bearer ${token}` },
                params: queryParams,
            });       
            return await response.data
        }
        catch(error) {
            logger.error(error)
            throw new Error("Error invoking BC GOV SSO API. "+error)
        }
    }

    public async getTenant(req:Request) {
        const tenant = await this.tmsRepository.getTenant(req)
        return {
            data: {
                tenant
            }
        }
    }

    public async getRolesForSSOUser(req:Request) {
        const roles = await this.tmsRepository.getRolesForSSOUser(req)
        return {
            data: {
                roles
            }
        }
    }

    private async getToken() {
        try {
            const response = await axios.post(
                process.env.BCGOV_TOKEN_URL,
                new URLSearchParams({
                    client_id: process.env.BC_GOV_SSO_CLIENT_ID,
                    client_secret: process.env.BCGOV_SSO_CLIENT_SECRET,
                    grant_type: "client_credentials",
                }),
                { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
            );
            return response.data.access_token;
        } catch (error) {
            throw new Error("Failed to obtain access token: "+error)
        }
    }
}