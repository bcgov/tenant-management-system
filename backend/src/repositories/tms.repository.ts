import { Tenant } from '../entities/Tenant'
import { TenantUser } from '../entities/TenantUser'
import { SSOUser } from '../entities/SSOUser'
import { Role } from '../entities/Role'
import { EntityManager } from 'typeorm'
import { In } from 'typeorm'
import { Request} from 'express'
import { TMSConstants } from '../common/tms.constants'
import { TenantUserRole } from '../entities/TenantUserRole'
import { GroupUser } from '../entities/GroupUser'
import { GroupSharedServiceRole } from '../entities/GroupSharedServiceRole'
import { NotFoundError } from '../errors/NotFoundError'
import { ConflictError } from '../errors/ConflictError'
import logger from '../common/logger'
import { TenantRequest } from '../entities/TenantRequest'
import { SharedService } from '../entities/SharedService'
import { SharedServiceRole } from '../entities/SharedServiceRole'
import { TenantSharedService } from '../entities/TenantSharedService'

export class TMSRepository {

    constructor (private manager: EntityManager) {
        this.manager = manager
    }

    public async saveTenant(req: Request | { body: any }, transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager;
        let tenantResponse = {}
        await this.manager.transaction(async(transactionEntityManager) => {
            try {
                if(await this.checkIfTenantNameAndMinistryNameExists(req.body.name, req.body.ministryName)) {
                    throw new ConflictError(`A tenant with name '${req.body.name}' and ministry name '${req.body.ministryName}' already exists`);
                }

                const tenantUser:TenantUser = new TenantUser()
                const ssoUser:SSOUser = await this.setSSOUser(req.body.user.ssoUserId,req.body.user.firstName,req.body.user.lastName,req.body.user.displayName,
                    req.body.user.userName,req.body.user.email)
                tenantUser.ssoUser = ssoUser
                const tenant:Tenant = new Tenant()
                tenant.ministryName = req.body.ministryName
                tenant.name = req.body.name
                tenant.users = [tenantUser]
                tenant.description = req.body.description
                tenant.createdBy = req.body.user.ssoUserId
                tenant.updatedBy = req.body.user.ssoUserId

                const savedTenant:Tenant = await transactionEntityManager.save(tenant)
                  
                const globalTenantRoles = [TMSConstants.SERVICE_USER, TMSConstants.TENANT_OWNER, TMSConstants.USER_ADMIN]

                const roles:Role[] = await this.findRoles(globalTenantRoles,null)

                let savedRoles:Role[]

                if(roles?.length === 0) { 
                    const newRoles:Role [] = []
                    for(const role of globalTenantRoles) {
                        const tempRole:Role = new Role()
                        tempRole.name = role
                        tempRole.description = role === TMSConstants.TENANT_OWNER ? "Tenant Owner" :
                                            role === TMSConstants.SERVICE_USER ? "Service User" :
                                            role === TMSConstants.USER_ADMIN ? "User Admin" : "";
                        newRoles.push(tempRole)  
                    }
                    savedRoles = await transactionEntityManager.save(newRoles)
                }
                else {
                    savedRoles = roles
                }

                const tenantUserRoles:TenantUserRole [] = []
                for(const role of savedRoles) {
                    const tenantUserRole:TenantUserRole = new TenantUserRole()
                    tenantUserRole.role = role
                    tenantUserRole.tenantUser = savedTenant.users[0]
                    tenantUserRoles.push(tenantUserRole)
                }
                await transactionEntityManager.save(tenantUserRoles)

                tenantResponse = await transactionEntityManager
                    .createQueryBuilder(Tenant, 'tenant')
                    .leftJoinAndSelect('tenant.users','tu')
                    .leftJoinAndSelect('tu.ssoUser','sso')
                    .leftJoinAndSelect('tu.roles','turoles')
                    .leftJoinAndSelect('turoles.role','role')
                    .where('tenant.id = :id', { id: savedTenant.id })
                    .getOne(); 
            } catch(error) {
                logger.error('Create tenant transaction failure - rolling back inserts ', error);
                throw error
            }
        });

        return tenantResponse
    }

    public async updateTenant(req: Request) {
        const tenantId:string = req.params.tenantId;
        const { name, ministryName, description, updatedBy }  = req.body;

        let tenantResponse:Tenant = null
        await this.manager.transaction(async(transactionEntityManager) => {
            try {

                // REDUNDANT: checkTenantAccess middleware already validates tenant exists and user has access
                // if (!await this.checkIfTenantExists(tenantId, transactionEntityManager)) {
                //     throw new NotFoundError(`Tenant not found: ${tenantId}`)
                // }

                if (name || ministryName) {
                    const existingTenant = await transactionEntityManager
                        .createQueryBuilder(Tenant, 't')
                        .where('t.name = :name', { name })
                        .andWhere('t.ministry_name = :ministryName', { ministryName })
                        .andWhere('t.id != :tenantId', { tenantId })
                        .getOne();

                    if (existingTenant) {
                        throw new ConflictError(`A tenant with name '${name}' and ministry name '${ministryName}' already exists`)
                    }
                }

                await transactionEntityManager
                    .createQueryBuilder()
                    .update(Tenant)
                    .set({
                        ...(name && { name }),
                        ...(ministryName && { ministryName }),
                        ...(description && { description }),
                        updatedBy: req.decodedJwt?.idir_user_guid || 'system'
                    })
                    .where('id = :tenantId', { tenantId })
                    .execute();

                const tenant:Tenant = await transactionEntityManager
                    .createQueryBuilder(Tenant, 'tenant')
                    .where('tenant.id = :id', { id: tenantId })
                    .getOne();

                const createdBy:SSOUser = tenant.createdBy ? await transactionEntityManager.findOne(SSOUser, { where: { ssoUserId: tenant.createdBy } }) : null;

                tenantResponse = {
                    ...tenant,
                    createdBy: createdBy?.userName || tenant.createdBy,
                };

            } catch (error) {
                logger.error('Update tenant transaction failure - rolling back changes', error);
                throw error
            }
        });

        return tenantResponse
    }

    public async addTenantUsers(req:Request) {

        let response = {}
        await this.manager.transaction(async(transactionEntityManager) => {

        try {  
            const tenantId:string = req.params.tenantId
            const roles:string[] = req.body.roles
            const ssoUserId:string = req.body.user.ssoUserId
            const updatedBy:string = req.decodedJwt?.idir_user_guid || 'system'
            
            // REDUNDANT: checkTenantAccess middleware already validates tenant exists and user has access
            // if(!await this.checkIfTenantExists(tenantId)) {  
            //     throw new NotFoundError("Tenant Not Found: "+tenantId)
            // } 
        
            const tenant:Tenant = await this.getTenantIfUserDoesNotExistForTenant(ssoUserId,tenantId)
    
            if(!tenant) {
                // Check if user was previously soft-deleted and restore them
                const softDeletedUser = await this.findSoftDeletedTenantUser(ssoUserId, tenantId, transactionEntityManager)
                
                if (softDeletedUser) {
                    softDeletedUser.isDeleted = false
                    softDeletedUser.updatedBy = updatedBy
                    softDeletedUser.updatedDateTime = new Date()
                    
                    const restoredTenantUser:TenantUser = await transactionEntityManager.save(softDeletedUser)
                    
                    const restoredTenantUserWithRelations = await transactionEntityManager
                        .createQueryBuilder(TenantUser, 'tu')
                        .leftJoinAndSelect('tu.ssoUser', 'ssoUser')
                        .where('tu.id = :tenantUserId', { tenantUserId: restoredTenantUser.id })
                        .getOne()
                    
                    const roleAssignments = await this.assignUserRoles(tenantId, restoredTenantUser.id, req.body.roles, transactionEntityManager)
                    
                    delete restoredTenantUserWithRelations.tenant
                    response = {savedTenantUser: restoredTenantUserWithRelations, roleAssignments}
                } else {
                    throw new ConflictError("User is already added to this tenant: "+tenantId)
                }
            } else {

                const tenantUser:TenantUser = new TenantUser()
                tenantUser.tenant = tenant
                tenantUser.createdBy = updatedBy
                tenantUser.updatedBy = updatedBy
                const user = req.body.user
                const ssoUser:SSOUser = await this.setSSOUser(user.ssoUserId,user.firstName,user.lastName,user.displayName,
                    user.userName,user.email, user.idpType)       
                tenantUser.ssoUser = ssoUser
        
                const savedTenantUser:TenantUser = await transactionEntityManager.save(tenantUser)
    
                let rolesToAssign = req.body.roles
                if (user.idpType === 'bceidbasic' || user.idpType === 'bceidbusiness') {
                    const serviceUserRole:Role[] = await this.findRoles([TMSConstants.SERVICE_USER], null)
                    if (serviceUserRole.length === 0) {
                        throw new NotFoundError('SERVICE_USER role not found')
                    }
                    rolesToAssign = [serviceUserRole[0].id]
                }
                
                const roleAssignments = await this.assignUserRoles(tenantId, savedTenantUser.id, rolesToAssign, transactionEntityManager)
                       
                delete savedTenantUser.tenant
                response = {savedTenantUser,roleAssignments}
            }
            
        }
        
        catch(error) {
            console.log(error)
            logger.error('Add user to a tenant transaction failure - rolling back inserts ', error);
            throw error
        }
        
    });     
        return response
    }

    public async createRoles(req:Request) {
        let response = {}
        await this.manager.transaction(async(transactionEntityManager) => {
            try {
                const tenantId:string = req.params.tenantId
                const requestRole = req.body.role

                const tenant:Tenant = await transactionEntityManager.findOne(Tenant,{where: {id:tenantId}})
                if(!tenant) {  
                    throw new NotFoundError("Tenant Not Found: "+tenantId)
                }

                const dbRoles:Role [] = await this.findRoles([requestRole.name],tenantId)

                if(dbRoles?.length !== 0) {
                    throw new ConflictError("Role already exists for tenant: "+tenantId + " : " + requestRole.name)
                }   

                const role:Role = new Role()
                role.name = requestRole.name
                role.description = requestRole.description
               // role.tenant = tenant
                const savedRole = await transactionEntityManager.save(role)
              //  delete savedRole.tenant
                response = savedRole


            }
            catch(error) {
                logger.error('Create Role for tenant transaction failure - rolling back inserts ',error)
                throw error
            }

        });

        return response
    }

    public async getExistingRolesForUser(tenantUserId: string, transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager;
        const tenantUser:TenantUser = await transactionEntityManager
            .createQueryBuilder(TenantUser, "tenantUser")
            .leftJoinAndSelect("tenantUser.roles", "tenantUserRole")
            .leftJoinAndSelect("tenantUserRole.role", "role")
            .where("tenantUser.id = :tenantUserId", { tenantUserId })
            .andWhere("tenantUser.isDeleted = :isDeleted", { isDeleted: false })
            .andWhere("tenantUserRole.is_deleted = :isDeleted", { isDeleted: false })
            .getOne();
        
        return tenantUser?.roles?.map(tur => tur.role) || [];
    }

    public async assignUserRoles(tenantId: string, tenantUserId: string, roleIds: string[], transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager
        
        try {
            // REDUNDANT: checkTenantAccess middleware already validates tenant user exists and user has access
            // const tenantUserExists:boolean = await this.checkIfTenantUserExistsForTenant(tenantId, tenantUserId,transactionEntityManager);
            // if (!tenantUserExists) {
            //     throw new NotFoundError(`Tenant user not found for tenant: ${tenantId}`)
            // }

            const existingRoles:Role[] = await this.getExistingRolesForUser(tenantUserId, transactionEntityManager);
            const existingRoleIds:string[] = existingRoles.map(role => role.id)
            
            // Check for soft-deleted role assignments that can be restored
            const softDeletedRoleAssignments:TenantUserRole[] = await transactionEntityManager
                .createQueryBuilder(TenantUserRole, "tur")
                .leftJoinAndSelect("tur.role", "role")
                .where("tur.tenantUser.id = :tenantUserId", { tenantUserId })
                .andWhere("tur.isDeleted = :isDeleted", { isDeleted: true })
                .andWhere("role.id IN (:...roleIds)", { roleIds })
                .getMany();

            const rolesToRestore:TenantUserRole[] = [];
            const rolesToCreate:string[] = [];

            // Separate roles that can be restored vs need new assignments
            for (const roleId of roleIds) {
                const softDeletedAssignment = softDeletedRoleAssignments.find(tur => tur.role.id === roleId);
                if (softDeletedAssignment) {
                    // Restore the soft-deleted assignment
                    softDeletedAssignment.isDeleted = false;
                    softDeletedAssignment.updatedBy = 'system';
                    softDeletedAssignment.updatedDateTime = new Date();
                    rolesToRestore.push(softDeletedAssignment);
                } else if (!existingRoleIds.includes(roleId)) {
                    // Create new assignment (role doesn't exist for this user)
                    rolesToCreate.push(roleId);
                }
            }

            const savedAssignments:TenantUserRole[] = [];

            // Restore soft-deleted assignments
            if (rolesToRestore.length > 0) {
                const restoredAssignments = await transactionEntityManager.save(rolesToRestore);
                savedAssignments.push(...restoredAssignments);
            }

            // Create new assignments for roles that don't exist
            if (rolesToCreate.length > 0) {
                const validRoles:Role[] = await transactionEntityManager
                    .createQueryBuilder(Role, "role")
                    .where("role.id IN (:...roleIds)", { roleIds: rolesToCreate })
                    .getMany();

                if (validRoles.length !== rolesToCreate.length) {
                    throw new NotFoundError("Role(s) not found")
                }

                const tenantUser:TenantUser = await transactionEntityManager.findOne(TenantUser, { where: { id: tenantUserId, isDeleted: false } })
                const newAssignments:TenantUserRole[] = validRoles.map(role => {
                    const tenantUserRole:TenantUserRole = new TenantUserRole()
                    tenantUserRole.tenantUser = tenantUser
                    tenantUserRole.role = role
                    return tenantUserRole
                });

                const createdAssignments = await transactionEntityManager.save(newAssignments);
                savedAssignments.push(...createdAssignments);
            }

            if (savedAssignments.length === 0) {
                throw new ConflictError("All roles are already assigned to the user")
            }

            return savedAssignments

        } catch (error) {
            logger.error('Assign roles to user transaction failure - rolling back inserts', error)
            throw error
        }
    }
    

    public async getTenantRoles(req:Request) {
        const roles:Role [] = await this.findTenantRoles()
        return roles
    }

    public async getUserRoles(req:Request) {
        const tenantId = req.params.tenantId
        const tenantUserId = req.params.tenantUserId
        // REDUNDANT: checkTenantAccess middleware already validates tenant user exists and user has access
        // if(!await this.checkIfTenantUserExistsForTenant(tenantId,tenantUserId) ) {
        //     throw new NotFoundError("Tenant or Tenant user not found: Tenant: "+tenantId+" Tenant User: "+tenantUserId)
        // }
        // else {
            const roles:Role [] = await this.getRolesForUser(tenantUserId)
            return roles
        // }
    }

    public async unassignUserRoles(req:Request) {
        const tenantId = req.params.tenantId
        const tenantUserId = req.params.tenantUserId
        const roleId = req.params.roleId
        const assignedTenantUserRole:TenantUserRole = await this.getTenantUserRole(tenantId,tenantUserId,roleId)       
        
        if(!assignedTenantUserRole) {
            throw new NotFoundError("Tenant: " + tenantId + ",  Users: " + tenantUserId +  " and / or roles: " + roleId +  " not found")
        } 

        const role = await this.manager.findOne(Role, { where: { id: roleId } });
        if (role?.name === TMSConstants.TENANT_OWNER) {

            const otherTenantOwnersCount:number = await this.manager
                .createQueryBuilder(TenantUserRole, "tenantUserRole")
                .innerJoin("tenantUserRole.tenantUser", "tenantUser")
                .innerJoin("tenantUserRole.role", "role")
                .where("tenantUser.tenant.id = :tenantId", { tenantId })
                .andWhere("role.name = :roleName", { roleName: TMSConstants.TENANT_OWNER })
                .andWhere("tenantUserRole.isDeleted = :isDeleted", { isDeleted: false })
                .andWhere("tenantUserRole.tenantUser.id != :tenantUserId", { tenantUserId })
                .getCount();

            if (otherTenantOwnersCount === 0) {
                throw new ConflictError("Cannot unassign tenant owner role. At least one tenant owner must remain.");
            }
        }

        const userRoleCount:number = await this.manager
            .createQueryBuilder(TenantUserRole, "tenantUserRole")
            .innerJoin("tenantUserRole.tenantUser", "tenantUser")
            .where("tenantUser.tenant.id = :tenantId", { tenantId })
            .andWhere("tenantUser.id = :tenantUserId", { tenantUserId })
            .andWhere("tenantUserRole.isDeleted = :isDeleted", { isDeleted: false })
            .getCount();

        if (userRoleCount === 1) {
            throw new ConflictError("Cannot unassign the last role from a user. User must have at least one role in the tenant");
        }

        await this.manager.update(TenantUserRole, {
            tenantUser: { id: tenantUserId },
            role: { id: roleId }
        }, {
            isDeleted: true,
            updatedBy: req.body.updatedBy || 'system'
        });
    }

    public async checkUserTenantAccess(tenantId: string, ssoUserId: string, requiredRoles?: string[], transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager;
        
        const query = transactionEntityManager
            .createQueryBuilder()
            .from(TenantUser, "tu")
            .innerJoin("tu.ssoUser", "su")
            .where("tu.tenant_id = :tenantId", { tenantId })
            .andWhere("su.ssoUserId = :ssoUserId", { ssoUserId })
            .andWhere("tu.isDeleted = :isDeleted", { isDeleted: false });

        if (requiredRoles && requiredRoles.length > 0) {
            query
                .innerJoin("tu.roles", "tur")
                .innerJoin("tur.role", "role")
                .andWhere("role.name IN (:...requiredRoles)", { requiredRoles })
                .andWhere("tur.isDeleted = :isDeleted", { isDeleted: false });
        }

        return await query.getExists();
    }

    public async getUserTenantAccessWithRoles(tenantId: string, ssoUserId: string, requiredRoles?: string[], transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager
        
        const query = transactionEntityManager
            .createQueryBuilder(TenantUser, "tu")
            .leftJoinAndSelect("tu.ssoUser", "su")
            .leftJoinAndSelect("tu.roles", "tur")
            .leftJoinAndSelect("tur.role", "role")
            .where("tu.tenant_id = :tenantId", { tenantId })
            .andWhere("su.ssoUserId = :ssoUserId", { ssoUserId })
            .andWhere("tu.isDeleted = :isDeleted", { isDeleted: false })
            .andWhere("tur.isDeleted = :isDeleted", { isDeleted: false });

        const tenantUser:TenantUser = await query.getOne()
        
        if (!tenantUser) {
            return { 
                hasAccess: false, 
                user: null, 
                roles: [],
                tenantId,
                ssoUserId
            };
        }

        const userRoles:string[] = tenantUser.roles?.map(tur => tur.role.name) || []
        const hasRequiredRoles:boolean = !requiredRoles || requiredRoles.length === 0 || 
            requiredRoles.some(role => userRoles.includes(role))

        return {
            hasAccess: hasRequiredRoles,
            user: tenantUser,
            roles: userRoles,
            tenantId,
            ssoUserId
        };
    }

    private async getCreatorDisplayName(ssoUserId: string) {
        const creator:SSOUser = await this.manager.findOne(SSOUser, { where: { ssoUserId } });
        return creator;
    }



    public async getTenant(req:Request) {
        const tenantId:string = req.params.tenantId
        const expand: string[] = typeof req.query.expand === "string" ? req.query.expand.split(",") : []

        const tenantQuery = this.manager
            .createQueryBuilder(Tenant, "tenant")
            .where("tenant.id = :tenantId", { tenantId })

        if (expand.includes("tenantUserRoles")) {
            tenantQuery.leftJoinAndSelect("tenant.users", "user").leftJoinAndSelect("user.ssoUser", "ssoUser")
            tenantQuery.leftJoinAndSelect("user.roles", "tenantUserRole")
            tenantQuery.leftJoinAndSelect("tenantUserRole.role", "role")    
            tenantQuery.andWhere("tenantUserRole.isDeleted = :isDeleted",{ isDeleted: false})
            tenantQuery.andWhere("user.isDeleted = :isDeleted",{ isDeleted: false})                 
        }
        const tenant:Tenant = await tenantQuery.getOne();
        
        if(!tenant) {
            throw new NotFoundError("Tenant Not Found: "+tenantId)
        }
            
        if (tenant.createdBy) {
            tenant.createdBy = (await this.getCreatorDisplayName(tenant.createdBy))?.userName || tenant.createdBy;
        }
        return tenant
    }

    public async getRolesForSSOUser(req:Request) {
        const tenantId:string = req.params.tenantId
        const ssoUserId:string = req.params.ssoUserId

        if(! await this.checkIfTenantExists(tenantId)) {
            throw new NotFoundError("Tenant Not Found: "+tenantId)   
        }
        
        const roles:Role[] = await this.getRolesForSSOUserAndTenant(tenantId,ssoUserId)
        return roles
    }

    public async getRolesForSSOUserAndTenant(tenantId:string,ssoUserId:string) {
        const roles:Role[] = await this.manager
            .createQueryBuilder(Role, "role")
            .innerJoin("role.tenantUserRoles", "tenantUserRole")
            .innerJoin("tenantUserRole.tenantUser", "tenantUser")
            .innerJoin("tenantUser.tenant", "tenant")
            .innerJoin("tenantUser.ssoUser", "ssoUser")
            .where("tenant.id = :tenantId", { tenantId })
            .andWhere("ssoUser.ssoUserId = :ssoUserId", { ssoUserId })
            .andWhere("tenantUser.isDeleted = :isDeleted", { isDeleted: false })
            .andWhere("tenantUserRole.isDeleted = :isDeleted", { isDeleted: false })
            .getMany();
        return roles
    }

    public async getTenantUserRole(tenantId:string,tenantUserId:string,roleId:string)  {
        const tenantUserRole:TenantUserRole = await this.manager
            .createQueryBuilder(TenantUserRole, "tenantUserRole")
            .innerJoin("tenantUserRole.tenantUser", "tenantUser") 
            .innerJoin("tenantUserRole.role", "role") 
            .innerJoin("tenantUser.tenant", "tenant") 
            .where("tenant.id = :tenantId", { tenantId })
            .andWhere("tenantUser.id = :tenantUserId", { tenantUserId }) 
            .andWhere("role.id = :roleId", { roleId })
            .andWhere("tenantUserRole.isDeleted = :isDeleted", { isDeleted: false })
            .getOne();
        return tenantUserRole
    }

    public async checkIfTenantUserExistsForTenant(tenantId:string, tenantUserId:string, transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager;
        const tenantUserExists = await transactionEntityManager
            .createQueryBuilder(TenantUser,"tu")
            .where("tu.id = :tenantUserId", { tenantUserId })
            .andWhere("tu.tenant_id = :tenantId", { tenantId })
            .andWhere("tu.isDeleted = :isDeleted", { isDeleted: false })
            .getExists();
        return tenantUserExists
    }

    public async getRolesForUser(tenantUserId:string, transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager;
        const roles = await transactionEntityManager
            .createQueryBuilder(Role,"role")
            .innerJoin("TenantUserRole", "tur", "tur.role_id = role.id")
            .innerJoin("TenantUser", "tu", "tu.id = tur.tenant_user_id")
            .where("tu.id = :tenantUserId", { tenantUserId })
            .andWhere("tu.isDeleted = :isDeleted", { isDeleted: false })
            .andWhere("tur.isDeleted = :isDeleted", { isDeleted: false })
            .getMany();
        return roles
    }

    public async getTenantsUsersAndRoles(tenantId:string,tenantUserId:string,roleId:string,transactionEntityManager:EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager
        const tenant = await transactionEntityManager
            .createQueryBuilder(Tenant,"tenant")
            .leftJoinAndSelect("tenant.users", "tenantUser")
            .leftJoinAndSelect("tenantUser.ssoUser","ssoUser")
            .leftJoinAndSelect("tenantUser.roles","turoles")
            .leftJoinAndSelect("turoles.role","role")
            .where("tenant.id = :tenantId", { tenantId })
            .andWhere("tenantUser.id = :tenantUserId", { tenantUserId })
            .andWhere("tenantUser.isDeleted = :isDeleted", { isDeleted: false })
            .andWhere("turoles.isDeleted = :isDeleted", { isDeleted: false })
            .getOne();
        return tenant
    }

    public async checkIfTenantExists(tenantId:string, transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager;
        const tenantExists = await transactionEntityManager
            .createQueryBuilder()
            .from(Tenant, "t")
            .where("t.id = :tenantId", { tenantId })
            .getExists();
        return tenantExists
    }

    public async checkIfTenantNameAndMinistryNameExists(name:string, ministryName:string) {
        const tenantExists = await this.manager
            .createQueryBuilder()
            .from(Tenant, "t")
            .where("t.name = :name", { name })
            .andWhere("t.ministry_name = :ministryName", { ministryName })
            .getExists();
        return tenantExists
    }

    public async getTenantsForUser(req: Request) {
        const ssoUserId:string = req.params.ssoUserId
        const expand:string[] = typeof req.query.expand === "string" ? req.query.expand.split(",") : []
        const TMS_AUDIENCE:string = process.env.TMS_AUDIENCE
        const jwtAudience:string = req.decodedJwt?.aud || req.decodedJwt?.audience || TMS_AUDIENCE
        
        const tenantQuery = this.manager.createQueryBuilder(Tenant, "t")
            .innerJoin("t.users", "tu")
            .innerJoin("tu.ssoUser", "su")
            .where("su.ssoUserId = :ssoUserId", { ssoUserId })
            .andWhere("tu.isDeleted = :isDeleted", { isDeleted: false });

        if (jwtAudience !== TMS_AUDIENCE) {
            tenantQuery
                .andWhere(`EXISTS (
                    SELECT 1 FROM "tms"."TenantSharedService" tss 
                    INNER JOIN "tms"."SharedService" ss ON tss.shared_service_id = ss.id 
                    WHERE tss.tenant_id = t.id 
                    AND ss.client_identifier = :jwtAudience 
                    AND tss.is_deleted = :tssDeleted 
                    AND ss.is_active = :ssActive
                )`, { jwtAudience, tssDeleted: false, ssActive: true });
        }

        if (expand?.includes("tenantUserRoles")) {
            tenantQuery.leftJoinAndSelect("t.users", "user")
                .leftJoinAndSelect("user.ssoUser", "ssoUser")
                .leftJoinAndSelect("user.roles", "tenantUserRole")
                .leftJoinAndSelect("tenantUserRole.role", "role")
                .andWhere("tenantUserRole.isDeleted = :isDeleted", { isDeleted: false });
        }

        const tenants:Tenant[] = await tenantQuery.getMany()
        return tenants
    }

    public async getUsersForTenant(tenantId:string) {
        const users = await this.manager
            .createQueryBuilder(TenantUser, "tu")
            .innerJoinAndSelect("tu.ssoUser", "su", "tu.sso_id = su.id")            
            .where("tu.tenant_id = :tenantId", { tenantId })
            .andWhere("tu.isDeleted = :isDeleted", { isDeleted: false })
            .getMany();       
        return users
    }

    public async getTenantIfUserDoesNotExistForTenant(ssoUserId:string, tenantId:string) {
        const tenant = await this.manager
        .createQueryBuilder(Tenant, "t")
        .where("t.id = :tenantId", { tenantId })
        .andWhere(qb => {
            const subQuery = qb.subQuery()
                .select("1")
                .from(TenantUser, "tu")
                .innerJoin(SSOUser, "su", "tu.sso_id = su.id")
                .where("tu.tenant_id = t.id")
                .andWhere("su.ssoUserId = :ssoUserId", { ssoUserId })
                .getQuery();
            return `NOT EXISTS (${subQuery})`;
        })
        .getOne();
        return tenant
    }

    public async findSoftDeletedTenantUser(ssoUserId:string, tenantId:string, transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager;
        
        const softDeletedUser = await transactionEntityManager
            .createQueryBuilder(TenantUser, "tu")
            .innerJoin("tu.ssoUser", "su")
            .where("tu.tenant_id = :tenantId", { tenantId })
            .andWhere("su.ssoUserId = :ssoUserId", { ssoUserId })
            .andWhere("tu.isDeleted = :isDeleted", { isDeleted: true })
            .getOne();
            
        return softDeletedUser;
    }

    public async findRoles(roleNames:string[],tenantId:string) {
        const whereCondition: any = { name: In(roleNames) };
        if (tenantId) {
            whereCondition["tenant"] = { id: tenantId }
        }      
        const roles:Role [] = await this.manager.find(Role, { where: whereCondition });
        return roles ?? []
    }

    public async setSSOUser(ssoUserId:string, firstName:string, lastName:string, displayName:string,userName:string, email:string, idpType?:string) {
        let ssoUser:SSOUser = await this.manager.findOne(SSOUser,{where:{ssoUserId:ssoUserId}})
        if(!ssoUser) { 
            ssoUser = new SSOUser()
            ssoUser.firstName = firstName
            ssoUser.lastName = lastName
            ssoUser.displayName = displayName
            ssoUser.userName = userName
            ssoUser.ssoUserId = ssoUserId
            ssoUser.email = email || null
            ssoUser.idpType = idpType || 'idir'
            ssoUser.createdBy = ssoUserId
            ssoUser.updatedBy = ssoUserId
        }
        return ssoUser
    }

    public async findTenantRoles() {
        const roles = await this.manager
            .createQueryBuilder(Role, "role")
            .getMany();
        return roles
    }

    public async getTenantRequestById(transactionEntityManager: EntityManager, tenantRequestId: string) {
        return await transactionEntityManager
            .createQueryBuilder(TenantRequest, 'tenantRequest')
            .leftJoinAndSelect('tenantRequest.requestedBy', 'sso')
            .where('tenantRequest.id = :id', { id: tenantRequestId })
            .getOne()
    }

    public async saveTenantRequest(req: Request) {
        let tenantRequestResponse = {}
        await this.manager.transaction(async(transactionEntityManager) => {
            try {
                if (await this.checkIfTenantNameAndMinistryNameExists(req.body.name, req.body.ministryName)) {
                    throw new ConflictError(`A tenant with name '${req.body.name}' and ministry name '${req.body.ministryName}' already exists`);
                }
                const tenantRequest:TenantRequest = new TenantRequest()
                tenantRequest.name = req.body.name
                tenantRequest.ministryName = req.body.ministryName
                tenantRequest.description = req.body.description
                tenantRequest.status = 'NEW'
                tenantRequest.requestedBy = await this.setSSOUser(
                    req.body.user.ssoUserId,
                    req.body.user.firstName,
                    req.body.user.lastName,
                    req.body.user.displayName,
                    req.body.user.userName,
                    req.body.user.email
                )
                tenantRequest.createdBy = req.body.user.ssoUserId
                tenantRequest.updatedBy = req.body.user.ssoUserId

                const savedTenantRequest:TenantRequest = await transactionEntityManager.save(tenantRequest)
                tenantRequestResponse = await this.getTenantRequestById(transactionEntityManager, savedTenantRequest.id)
                    
            } catch (error) {
                logger.error('Create tenant request transaction failure - rolling back inserts ', error)
                throw error
            }
        })

        if (tenantRequestResponse && (tenantRequestResponse as any).createdBy && (tenantRequestResponse as any).createdBy !== 'system') {
            const creator: any = await this.manager.findOne('SSOUser', { where: { ssoUserId: (tenantRequestResponse as any).createdBy } });
            (tenantRequestResponse as any).createdBy = creator?.displayName || (tenantRequestResponse as any).createdBy
        }

        return tenantRequestResponse
    }

    public async updateTenantRequestStatus(req: Request) {
        const requestId: string = req.params.requestId;
        const { status, rejectionReason } = req.body;
        let response = {};

        await this.manager.transaction(async(transactionEntityManager) => {
            try {
                const tenantRequest:TenantRequest = await this.getTenantRequestById(transactionEntityManager, requestId);
                if (!tenantRequest) {
                    throw new NotFoundError(`Tenant request not found: ${requestId}`);
                }

                if (tenantRequest.status !== 'NEW') {
                    throw new ConflictError(`Cannot update tenant request with status: ${tenantRequest.status}`);
                }

                if (status === 'REJECTED' && !rejectionReason) {
                    throw new ConflictError('Rejection reason is required when rejecting a tenant request');
                }

                if (status === 'APPROVED') {
                    if (await this.checkIfTenantNameAndMinistryNameExists(tenantRequest.name, tenantRequest.ministryName)) {
                        throw new ConflictError(`A tenant with name '${tenantRequest.name}' and ministry name '${tenantRequest.ministryName}' already exists`);
                    }

                    const tenantRequestBody = {
                        body: {
                            name: tenantRequest.name,
                            ministryName: tenantRequest.ministryName,
                            description: tenantRequest.description,
                            user: {
                                ssoUserId: tenantRequest.requestedBy.ssoUserId,
                                firstName: tenantRequest.requestedBy.firstName,
                                lastName: tenantRequest.requestedBy.lastName,
                                displayName: tenantRequest.requestedBy.displayName,
                                userName: tenantRequest.requestedBy.userName,
                                email: tenantRequest.requestedBy.email
                            }
                        }
                    };
                    const savedTenant: Tenant = await this.saveTenant(tenantRequestBody, transactionEntityManager) as Tenant;

                    const basicTenantInfo = {
                        id: savedTenant.id,
                        name: savedTenant.name,
                        ministryName: savedTenant.ministryName,
                        description: savedTenant.description,
                        createdBy: savedTenant.createdBy,
                        updatedBy: savedTenant.updatedBy
                    };
                    response = { tenant: basicTenantInfo }
                }

                let opsAdminSSOUser:SSOUser = await this.setSSOUser(
                    req.decodedJwt?.idir_user_guid || 'system',
                    req.decodedJwt?.given_name || 'System',
                    req.decodedJwt?.family_name || 'User',
                    req.decodedJwt?.display_name || 'System User',
                    req.decodedJwt?.preferred_username || 'system',
                    req.decodedJwt?.email || 'system@gov.bc.ca'
                );

                opsAdminSSOUser = await transactionEntityManager.save(opsAdminSSOUser)

                tenantRequest.status = status;
                tenantRequest.decisionedBy = opsAdminSSOUser;
                tenantRequest.decisionedAt = new Date();
                tenantRequest.rejectionReason = status === 'REJECTED' ? rejectionReason : null;
                tenantRequest.updatedBy = req.decodedJwt?.idir_user_guid || 'system';

                const updatedRequest = await transactionEntityManager.save(tenantRequest);

                const tenantRequestResponse = {
                    ...updatedRequest,
                };
                response = { ...response, tenantRequest: tenantRequestResponse };

            } catch (error) {
                logger.error('Update tenant request status transaction failure - rolling back changes', error);
                throw error;
            }
        });

        return response;
    }

    public async getTenantRequests(status?: string) {
        const queryBuilder = this.manager
            .createQueryBuilder(TenantRequest, 'tenantRequest')
            .leftJoinAndSelect('tenantRequest.requestedBy', 'requestedBy')
            .leftJoinAndSelect('tenantRequest.decisionedBy', 'decisionedBy')
            .orderBy('tenantRequest.requestedAt', 'DESC');

        if (status) {
            queryBuilder.where('tenantRequest.status = :status', { status })
        }

        const tenantRequests:TenantRequest[] = await queryBuilder.getMany()

        tenantRequests.forEach(request => {
            if (request.requestedBy && request.requestedBy.displayName) {
                request.createdBy = request.requestedBy.displayName
            } else {
                request.createdBy = 'system'
            }
        });

        return tenantRequests
    }


    public async getTenantUserBySsoId(ssoUserId: string, tenantId: string, transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager
        
        const tenantUser:TenantUser = await transactionEntityManager
            .createQueryBuilder(TenantUser, 'tenantUser')
            .leftJoinAndSelect('tenantUser.ssoUser', 'ssoUser')
            .where('tenantUser.tenant.id = :tenantId', { tenantId })
            .andWhere('ssoUser.ssoUserId = :ssoUserId', { ssoUserId })
            .andWhere('tenantUser.isDeleted = :isDeleted', { isDeleted: false })
            .getOne();

        return tenantUser
    }

    public async assignDefaultRoleToUser(tenantUserId: string, tenantId: string, transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager
        
        const serviceUserRole:Role[] = await this.findRoles([TMSConstants.SERVICE_USER], null)
        if (serviceUserRole.length === 0) {
            throw new NotFoundError('SERVICE_USER role not found')
        }

        await this.assignUserRoles(tenantId, tenantUserId, [serviceUserRole[0].id], transactionEntityManager)
    }

    public async saveSharedService(req: Request) {
        const { name, clientIdentifier, description, isActive, roles } = req.body
        let sharedServiceResponse = {}
        await this.manager.transaction(async(transactionEntityManager) => {
            try {
                if(await this.checkIfSharedServiceNameExists(name)) {
                    throw new ConflictError(`A shared service with name '${name}' already exists`)
                }

                if(await this.checkIfSharedServiceClientIdentifierExists(clientIdentifier)) {
                    throw new ConflictError(`A shared service with client identifier '${clientIdentifier}' already exists`)
                }

                const sharedService:SharedService = new SharedService()
                sharedService.name = name
                sharedService.clientIdentifier = clientIdentifier
                sharedService.description = description
                sharedService.isActive = isActive !== undefined ? isActive : true
                sharedService.createdBy = req.decodedJwt?.idir_user_guid || 'system'
                sharedService.updatedBy = req.decodedJwt?.idir_user_guid || 'system'

                const savedSharedService:SharedService = await transactionEntityManager.save(sharedService)

                const sharedServiceRoles:SharedServiceRole[] = []
                for(const role of roles) {
                    const sharedServiceRole:SharedServiceRole = new SharedServiceRole()
                    sharedServiceRole.name = role.name
                    sharedServiceRole.description = role.description
                    sharedServiceRole.allowedIdentityProviders = (role.allowedIdentityProviders && role.allowedIdentityProviders.length > 0) 
                        ? role.allowedIdentityProviders 
                        : null
                    sharedServiceRole.sharedService = savedSharedService
                    sharedServiceRole.createdBy = req.decodedJwt?.idir_user_guid || 'system'
                    sharedServiceRole.updatedBy = req.decodedJwt?.idir_user_guid || 'system'
                    sharedServiceRoles.push(sharedServiceRole)
                }
                await transactionEntityManager.save(sharedServiceRoles)

                sharedServiceResponse = await this.getSharedServiceWithRoles(savedSharedService.id, transactionEntityManager)
            } catch(error) {
                logger.error('Create shared service transaction failure - rolling back inserts ', error);
                throw error
            }
        });

        return sharedServiceResponse
    }

    public async getSharedServiceWithRoles(sharedServiceId: string, transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager
        return await transactionEntityManager
            .createQueryBuilder(SharedService, 'sharedService')
            .leftJoinAndSelect('sharedService.roles','roles')
            .where('sharedService.id = :id', { id: sharedServiceId })
            .andWhere('roles.isDeleted = :isDeleted', { isDeleted: false })
            .getOne();
    }

    public async addSharedServiceRoles(req: Request) {
        const sharedServiceId:string = req.params.sharedServiceId
        const { roles } = req.body
        const ssoUserId:string = req.decodedJwt?.idir_user_guid || 'system'
        
        await this.manager.transaction(async(transactionEntityManager) => {

            const sharedService:SharedService = await transactionEntityManager
                .createQueryBuilder(SharedService, 'ss')
                .where('ss.id = :id', { id: sharedServiceId })
                .andWhere('ss.isActive = :isActive', { isActive: true })
                .getOne();
                
            if (!sharedService) {
                throw new NotFoundError(`Active shared service not found: ${sharedServiceId}`)
            }
            
            for (const role of roles) {
                const existingRole:SharedServiceRole = await transactionEntityManager
                    .createQueryBuilder(SharedServiceRole, 'ssr')
                    .where('ssr.sharedService.id = :sharedServiceId', { sharedServiceId })
                    .andWhere('ssr.name = :name', { name: role.name })
                    .andWhere('ssr.isDeleted = :isDeleted', { isDeleted: false })
                    .getOne();
                    
                if (existingRole) {
                    throw new ConflictError(`Role '${role.name}' already exists for this shared service`);
                }
            }
            
            const sharedServiceRoles: SharedServiceRole[] = []
            for (const role of roles) {
                const sharedServiceRole:SharedServiceRole = new SharedServiceRole()
                sharedServiceRole.name = role.name
                sharedServiceRole.description = role.description
                sharedServiceRole.allowedIdentityProviders = (role.allowedIdentityProviders && role.allowedIdentityProviders.length > 0) 
                    ? role.allowedIdentityProviders 
                    : null
                sharedServiceRole.sharedService = sharedService
                sharedServiceRole.isDeleted = false
                sharedServiceRole.createdBy = ssoUserId
                sharedServiceRole.updatedBy = ssoUserId
                sharedServiceRoles.push(sharedServiceRole)
            }
            
            await transactionEntityManager.save(sharedServiceRoles)
        });
        
        return await this.getSharedServiceWithRoles(sharedServiceId)
    }

    public async checkIfSharedServiceNameExists(name: string, transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager
        const sharedServiceExists = await transactionEntityManager
            .createQueryBuilder()
            .from(SharedService, "ss")
            .where("ss.name = :name", { name })
            .getExists();
        return sharedServiceExists
    }

    public async checkIfSharedServiceClientIdentifierExists(clientIdentifier: string, transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager
        const sharedServiceExists = await transactionEntityManager
            .createQueryBuilder()
            .from(SharedService, "ss")
            .where("ss.clientIdentifier = :clientIdentifier", { clientIdentifier })
            .getExists();
        return sharedServiceExists
    }

    public async associateSharedServiceToTenant(req: Request) {
        const tenantId: string = req.params.tenantId
        const sharedServiceId: string = req.body.sharedServiceId
        const ssoUserId: string = req.decodedJwt?.idir_user_guid || 'system'
        
        await this.manager.transaction(async(transactionEntityManager) => {
            try {
                // REDUNDANT: checkTenantAccess middleware already validates tenant exists and user has access
                // if (!await this.checkIfTenantExists(tenantId, transactionEntityManager)) {
                //     throw new NotFoundError(`Tenant not found: ${tenantId}`)
                // }

                const sharedService:SharedService = await transactionEntityManager
                    .createQueryBuilder(SharedService, 'sharedService')
                    .where('sharedService.id = :id', { id: sharedServiceId })
                    .getOne();
                
                if (!sharedService) {
                    throw new NotFoundError(`Shared service not found: ${sharedServiceId}`)
                }

                if (!sharedService.isActive) {
                    throw new ConflictError(`Cannot associate inactive shared service '${sharedService.name}' to tenant`)
                }

                const existingAssociation:TenantSharedService = await transactionEntityManager
                    .createQueryBuilder(TenantSharedService, 'tss')
                    .where('tss.tenant.id = :tenantId', { tenantId })
                    .andWhere('tss.sharedService.id = :sharedServiceId', { sharedServiceId })
                    .andWhere('tss.isDeleted = :isDeleted', { isDeleted: false })
                    .getOne();

                if (existingAssociation) {
                    throw new ConflictError(`Shared service '${sharedService.name}' is already associated with this tenant`)
                }

                const tenant:Tenant = await transactionEntityManager
                    .createQueryBuilder(Tenant, 'tenant')
                    .where('tenant.id = :id', { id: tenantId })
                    .getOne();

                const tenantSharedService: TenantSharedService = new TenantSharedService()
                tenantSharedService.tenant = tenant
                tenantSharedService.sharedService = sharedService
                tenantSharedService.isDeleted = false
                tenantSharedService.createdBy = ssoUserId
                tenantSharedService.updatedBy = ssoUserId

                await transactionEntityManager.save(tenantSharedService)

            } catch (error) {
                logger.error('Associate shared service to tenant transaction failure - rolling back inserts', error)
                throw error
            }
        });
    }

    public async getAllActiveSharedServices() {
        return await this.manager
            .createQueryBuilder(SharedService, 'sharedService')
            .leftJoinAndSelect('sharedService.roles', 'roles')
            .where('sharedService.isActive = :isActive', { isActive: true })
            .andWhere('roles.isDeleted = :isDeleted', { isDeleted: false })
            .orderBy('sharedService.name', 'ASC')
            .getMany();
    }

    public async getSharedServicesForTenant(tenantId: string) {
        return await this.manager
            .createQueryBuilder(TenantSharedService, 'tss')
            .leftJoinAndSelect('tss.sharedService', 'sharedService')
            .leftJoinAndSelect('sharedService.roles', 'roles')
            .where('tss.tenant.id = :tenantId', { tenantId })
            .andWhere('tss.isDeleted = :isDeleted', { isDeleted: false })
            .andWhere('roles.isDeleted = :rolesDeleted', { rolesDeleted: false })
            .orderBy('sharedService.name', 'ASC')
            .getMany()
            .then(tenantSharedServices => 
                tenantSharedServices.map(tss => tss.sharedService)
            );
    }

    public async checkIfTenantHasSharedServiceAccess(tenantId: string, clientIdentifier: string, transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager;
        const hasAccess = await transactionEntityManager
            .createQueryBuilder()
            .from(TenantSharedService, "tss")
            .innerJoin("tss.sharedService", "ss")
            .where("tss.tenant.id = :tenantId", { tenantId })
            .andWhere("ss.clientIdentifier = :clientIdentifier", { clientIdentifier })
            .andWhere("ss.isActive = :isActive", { isActive: true })
            .andWhere("tss.isDeleted = :isDeleted", { isDeleted: false })
            .getExists();
        return hasAccess
    }

    public async removeTenantUser(req: Request) {
        const tenantId: string = req.params.tenantId
        const tenantUserId: string = req.params.tenantUserId
        const deletedBy: string = req.decodedJwt?.idir_user_guid || 'system'
        
        await this.manager.transaction(async(transactionEntityManager) => {
            try {
                const tenantUser: TenantUser = await transactionEntityManager
                    .createQueryBuilder(TenantUser, 'tu')
                    .leftJoinAndSelect('tu.roles', 'tur')
                    .leftJoinAndSelect('tur.role', 'role')
                    .where('tu.id = :tenantUserId', { tenantUserId })
                    .andWhere('tu.tenant.id = :tenantId', { tenantId })
                    .andWhere('tu.isDeleted = :isDeleted', { isDeleted: false })
                    .getOne();

                if (!tenantUser) {
                    throw new NotFoundError(`Tenant user not found or already deleted: ${tenantUserId}`)
                }

                const tenantOwnerRoles = tenantUser.roles?.filter(tur => 
                    tur.role.name === TMSConstants.TENANT_OWNER && !tur.isDeleted
                ) || [];

                if (tenantOwnerRoles.length > 0) {
                    const otherTenantOwnersCount:number = await transactionEntityManager
                        .createQueryBuilder(TenantUserRole, 'tur')
                        .innerJoin('tur.tenantUser', 'tu')
                        .innerJoin('tur.role', 'role')
                        .where('tu.tenant.id = :tenantId', { tenantId })
                        .andWhere('role.name = :roleName', { roleName: TMSConstants.TENANT_OWNER })
                        .andWhere('tur.isDeleted = :isDeleted', { isDeleted: false })
                        .andWhere('tu.isDeleted = :isDeleted', { isDeleted: false })
                        .andWhere('tu.id != :tenantUserId', { tenantUserId })
                        .getCount();

                    if (otherTenantOwnersCount === 0) {
                        throw new ConflictError('Cannot remove the last tenant owner. At least one tenant owner must remain.')
                    }
                }

                await transactionEntityManager
                    .createQueryBuilder()
                    .update(TenantUserRole)
                    .set({
                        isDeleted: true,
                        updatedBy: deletedBy
                    })
                    .where('tenantUser.id = :tenantUserId', { tenantUserId })
                    .andWhere('isDeleted = :isDeleted', { isDeleted: false })
                    .execute();

                await transactionEntityManager
                    .createQueryBuilder()
                    .update('GroupUser')
                    .set({
                        isDeleted: true,
                        updatedBy: deletedBy
                    })
                    .where('tenantUser.id = :tenantUserId', { tenantUserId })
                    .andWhere('isDeleted = :isDeleted', { isDeleted: false })
                    .execute();

                const userGroups = await transactionEntityManager
                    .createQueryBuilder('GroupUser', 'gu')
                    .leftJoinAndSelect('gu.group', 'group')
                    .where('gu.tenantUser.id = :tenantUserId', { tenantUserId })
                    .andWhere('gu.isDeleted = :isDeleted', { isDeleted: false })
                    .getMany();

                const groupIds = userGroups.map(gu => gu.group.id)

                if (groupIds.length > 0) {
                    await transactionEntityManager
                        .createQueryBuilder()
                        .update('GroupSharedServiceRole')
                        .set({
                            isDeleted: true,
                            updatedBy: deletedBy
                        })
                        .where('group.id IN (:...groupIds)', { groupIds })
                        .andWhere('isDeleted = :isDeleted', { isDeleted: false })
                        .execute();
                }

                await transactionEntityManager
                    .createQueryBuilder()
                    .update(TenantUser)
                    .set({
                        isDeleted: true,
                        updatedBy: deletedBy
                    })
                    .where('id = :tenantUserId', { tenantUserId })
                    .execute();

            } catch (error) {
                logger.error('Remove tenant user transaction failure - rolling back changes', error);
                throw error
            }
        });
    }


}

