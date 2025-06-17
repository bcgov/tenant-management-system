import { Tenant } from '../entities/Tenant'
import { TenantUser } from '../entities/TenantUser'
import { SSOUser } from '../entities/SSOUser'
import { Role } from '../entities/Role'
import { EntityManager } from 'typeorm'
import { In } from 'typeorm'
import { Request} from 'express'
import { TMSConstants } from '../common/tms.constants'
import { TenantUserRole } from '../entities/TenantUserRole'
import { NotFoundError } from '../errors/NotFoundError'
import { ConflictError } from '../errors/ConflictError'
import logger from '../common/logger'
import { TenantRequest } from '../entities/TenantRequest'

export class TMSRepository {

    constructor (private manager: EntityManager) {
        this.manager = manager
    }

    public async saveTenant(req:Request) {
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

                if (!await this.checkIfTenantExists(tenantId, transactionEntityManager)) {
                    throw new NotFoundError(`Tenant not found: ${tenantId}`)
                }

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

                tenantResponse = await transactionEntityManager
                    .createQueryBuilder(Tenant, 'tenant')
                    .where('tenant.id = :id', { id: tenantId })
                    .getOne();

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
            
            if(!await this.checkIfTenantExists(tenantId)) {  
                throw new NotFoundError("Tenant Not Found: "+tenantId)
            } 
        
            const tenant:Tenant = await this.getTenantIfUserDoesNotExistForTenant(ssoUserId,tenantId)
    
            if(!tenant) {
                throw new ConflictError("User is already added to this tenant: "+tenantId)
            }
    
            const tenantUser:TenantUser = new TenantUser()
            tenantUser.tenant = tenant
            const user = req.body.user
            const ssoUser:SSOUser = await this.setSSOUser(user.ssoUserId,user.firstName,user.lastName,user.displayName,
                user.userName,user.email)       
            tenantUser.ssoUser = ssoUser
    
            const savedTenantUser:TenantUser = await transactionEntityManager.save(tenantUser)

            
            const roleAssignments = await this.assignUserRoles(tenantId, savedTenantUser.id, req.body.roles, transactionEntityManager)
                   
                delete savedTenantUser.tenant
                response = {savedTenantUser,roleAssignments}
            
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
            .andWhere("tenantUserRole.is_deleted = :isDeleted", { isDeleted: false })
            .getOne();
        
        return tenantUser?.roles?.map(tur => tur.role) || [];
    }

    public async assignUserRoles(tenantId: string, tenantUserId: string, roleIds: string[], transactionEntityManager?: EntityManager) {
        transactionEntityManager = transactionEntityManager ? transactionEntityManager : this.manager
        
        try {
            const tenantUserExists:boolean = await this.checkIfTenantUserExistsForTenant(tenantId, tenantUserId,transactionEntityManager);
            if (!tenantUserExists) {
                throw new NotFoundError(`Tenant user not found for tenant: ${tenantId}`)
            }

            const existingRoles:Role[] = await this.getExistingRolesForUser(tenantUserId, transactionEntityManager);

            const existingRoleIds:string[] = existingRoles.map(role => role.id)
            const newRoleIds:string[] = roleIds.filter(roleId => !existingRoleIds.includes(roleId))
            
            if (newRoleIds.length === 0) {
                throw new ConflictError("All roles are already assigned to the user")
            }

            const validRoles:Role[] = await transactionEntityManager
                .createQueryBuilder(Role, "role")
                .where("role.id IN (:...roleIds)", { roleIds: newRoleIds })
                .getMany();

            if (validRoles.length !== newRoleIds.length) {
                throw new NotFoundError("Role(s) not found")
            }

            const tenantUser:TenantUser = await transactionEntityManager.findOne(TenantUser, { where: { id: tenantUserId } })
            const newAssignments:TenantUserRole[] = validRoles.map(role => {
                const tenantUserRole:TenantUserRole = new TenantUserRole()
                tenantUserRole.tenantUser = tenantUser
                tenantUserRole.role = role
                return tenantUserRole
            });

            const savedAssignments:TenantUserRole[] = await transactionEntityManager.save(newAssignments)
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
        if(!await this.checkIfTenantUserExistsForTenant(tenantId,tenantUserId) ) {
            throw new NotFoundError("Tenant or Tenant user not found: Tenant: "+tenantId+" Tenant User: "+tenantUserId)
        }
        else {
            const roles:Role [] = await this.getRolesForUser(tenantUserId)
            return roles
        }
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

            const otherTenantOwnersCount = await this.manager
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
            .andWhere("su.ssoUserId = :ssoUserId", { ssoUserId });

        if (requiredRoles && requiredRoles.length > 0) {
            query
                .innerJoin("tu.roles", "tur")
                .innerJoin("tur.role", "role")
                .andWhere("role.name IN (:...requiredRoles)", { requiredRoles })
                .andWhere("tur.isDeleted = :isDeleted", { isDeleted: false });
        }

        return await query.getExists();
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
          // .andWhere("turoles"
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

    public async getTenantsForUser(ssoUserId:string, expand?: string[]) {
        const tenantQuery = this.manager.createQueryBuilder(Tenant, "t")
            .innerJoin("t.users", "tu")
            .innerJoin("tu.ssoUser", "su")
            .where("su.ssoUserId = :ssoUserId", { ssoUserId });

        if (expand?.includes("tenantUserRoles")) {
            tenantQuery.leftJoinAndSelect("t.users", "user")
                .leftJoinAndSelect("user.ssoUser", "ssoUser")
                .leftJoinAndSelect("user.roles", "tenantUserRole")
                .leftJoinAndSelect("tenantUserRole.role", "role")
                .andWhere("tenantUserRole.isDeleted = :isDeleted", { isDeleted: false });
        }

        const tenants = await tenantQuery.getMany();
        return tenants;
    }

    public async getUsersForTenant(tenantId:string) {
        const users = await this.manager
            .createQueryBuilder(TenantUser, "tu")
            .innerJoinAndSelect("tu.ssoUser", "su", "tu.sso_id = su.id")            
            .where("tu.tenant_id = :tenantId", { tenantId })
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

    public async findRoles(roleNames:string[],tenantId:string) {
        const whereCondition: any = { name: In(roleNames) };
        if (tenantId) {
            whereCondition["tenant"] = { id: tenantId }
        }      
        const roles:Role [] = await this.manager.find(Role, { where: whereCondition });
        return roles ?? []
    }

    private async setSSOUser(ssoUserId:string, firstName:string, lastName:string, displayName:string,userName:string, email:string) {
        let ssoUser:SSOUser = await this.manager.findOne(SSOUser,{where:{ssoUserId:ssoUserId}})
        if(!ssoUser) { 
            ssoUser = new SSOUser()
            ssoUser.firstName = firstName
            ssoUser.lastName = lastName
            ssoUser.displayName = displayName
            ssoUser.userName = userName
            ssoUser.ssoUserId = ssoUserId
            ssoUser.email = email        
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

        return tenantRequestResponse
    }

    public async updateTenantRequestStatus(req: Request) {
        const requestId: string = req.params.requestId;
        const { status, rejectionReason } = req.body;
        let response = {};

        await this.manager.transaction(async(transactionEntityManager) => {
            try {
                const tenantRequest = await this.getTenantRequestById(transactionEntityManager, requestId);
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

                    // Create tenant from request
                    const tenantUser = new TenantUser();
                    const ssoUser = tenantRequest.requestedBy;
                    tenantUser.ssoUser = ssoUser;

                    const tenant = new Tenant();
                    tenant.ministryName = tenantRequest.ministryName;
                    tenant.name = tenantRequest.name;
                    tenant.users = [tenantUser];
                    tenant.description = tenantRequest.description;
                    tenant.createdBy = req.decodedJwt?.idir_user_guid || 'system';
                    tenant.updatedBy = req.decodedJwt?.idir_user_guid || 'system';

                    const savedTenant = await transactionEntityManager.save(tenant);
                    response = { tenant: savedTenant };
                }

                // Update tenant request status
                const decisionMaker = await this.setSSOUser(
                    req.decodedJwt?.idir_user_guid || 'system',
                    req.decodedJwt?.given_name || 'System',
                    req.decodedJwt?.family_name || 'User',
                    req.decodedJwt?.display_name || 'System User',
                    req.decodedJwt?.preferred_username || 'system',
                    req.decodedJwt?.email || 'system@example.com'
                );

                tenantRequest.status = status;
                tenantRequest.decisionedBy = decisionMaker;
                tenantRequest.decisionedAt = new Date();
                tenantRequest.rejectionReason = status === 'REJECTED' ? rejectionReason : null;
                tenantRequest.updatedBy = req.decodedJwt?.idir_user_guid || 'system';

                const updatedRequest = await transactionEntityManager.save(tenantRequest);
                response = { ...response, tenantRequest: updatedRequest };

            } catch (error) {
                logger.error('Update tenant request status transaction failure - rolling back changes', error);
                throw error;
            }
        });

        return response;
    }

}

