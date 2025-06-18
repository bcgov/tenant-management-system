import { Request, Response } from 'express'
import {TMSRepository} from '../repositories/tms.repository'
import { connection } from '../common/db.connection'
import { URLSearchParams } from 'url'
import axios from 'axios';
import logger from '../common/logger'
import { TenantRequest } from '../entities/TenantRequest'
import { Tenant } from '../entities/Tenant'

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
        const expand = typeof req.query.expand === "string" ? req.query.expand.split(",") : []
        const tenants = await this.tmsRepository.getTenantsForUser(req.params.ssoUserId, expand)
        
        if (expand.includes("tenantUserRoles") && tenants) {
            const transformedTenants = tenants.map(tenant => {
                if (tenant.users) {
                    const transformedUsers = tenant.users.map(user => {
                        const userRoles = user.roles?.map(tur => tur.role) || []
                        return {
                            ...user,
                            roles: userRoles
                        };
                    });
                    return {
                        ...tenant,
                        users: transformedUsers
                    };
                }
                return tenant;
            });
            return {
                data: {
                    tenants: transformedTenants
                }
            }
        }

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
        const { tenantId, tenantUserId } = req.params;
        const { roles } = req.body;
        
        if (!Array.isArray(roles) || roles.length === 0) {
            throw new Error("roles must be a non-empty array");
        }

        const data = await this.tmsRepository.assignUserRoles(tenantId, tenantUserId, roles, null);
        return {
            data: {
                roles: data.map(assignment => assignment.role)
            }
        };
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
        
        const expand = typeof req.query.expand === "string" ? req.query.expand.split(",") : []
        if (expand.includes("tenantUserRoles") && tenant?.users) {
            const transformedUsers = tenant.users.map(user => {
                const userRoles = user.roles?.map(tur => tur.role) || []
                return {
                    ...user,
                    roles: userRoles
                };
            });
            (tenant as any).users = transformedUsers;
        }

        return {
            data: {
                tenant
            }
        }
    }

    public async updateTenant(req: Request) {
        const updatedTenant = await this.tmsRepository.updateTenant(req);

        return {
            data: {
                tenant: updatedTenant
            }
        };
    }

    public async getRolesForSSOUser(req:Request) {
        const roles = await this.tmsRepository.getRolesForSSOUser(req)
        return {
            data: {
                roles
            }
        }
    }

    public async createTenantRequest(req: Request) {
        const tenantRequest = await this.tmsRepository.saveTenantRequest(req) as TenantRequest
        return {
            data: {
                tenantRequest: {
                    ...tenantRequest,
                    requestedBy: tenantRequest.requestedBy?.displayName
                }
            }
        }
    }
    
    private async getToken() {
        try {
            const response = await axios.post(
                process.env.BCGOV_TOKEN_URL,
                new URLSearchParams({
                    client_id: process.env.BCGOV_SSO_API_CLIENT_ID,
                    client_secret: process.env.BCGOV_SSO_API_CLIENT_SECRET,
                    grant_type: "client_credentials",
                }),
                { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
            );
            return response.data.access_token;
        } catch (error) {
            throw new Error("Failed to obtain access token: "+error)
        }
    }

    public async updateTenantRequestStatus(req: Request) {
        const response = await this.tmsRepository.updateTenantRequestStatus(req) as { tenantRequest: TenantRequest; tenant?: Tenant };
        const formattedResponse: { data: { tenantRequest: any; tenant?: Tenant } } = {
            data: {
                tenantRequest: {
                    ...response.tenantRequest,
                    requestedBy: response.tenantRequest.requestedBy?.displayName,
                    decisionedBy: response.tenantRequest.decisionedBy?.displayName
                }
            }
        };

        if (response.tenant) {
            formattedResponse.data.tenant = response.tenant;
        }

        return formattedResponse;
    }

    public async getTenantRequests(req: Request) {
        const status = req.query.status as string;
        const tenantRequests = await this.tmsRepository.getTenantRequests(status);
        
        const formattedRequests = tenantRequests.map(request => ({
            ...request,
            requestedBy: request.requestedBy?.displayName,
            decisionedBy: request.decisionedBy?.displayName
        }));

        return {
            data: {
                tenantRequests: formattedRequests
            }
        };
    }

}