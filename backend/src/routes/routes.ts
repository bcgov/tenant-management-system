import { Request, Response } from 'express'
import { RoutesConstants } from '../common/routes.constants'
import {TMSController} from '../controllers/tms.controller'
import {TMController} from '../controllers/tm.controller'
import { validate, ValidationError } from 'express-validation'
import validator from '../common/tms.validator'
import { checkJwt } from '../common/auth.mw'
import { checkTenantAccess } from '../common/tenant-access.mw'
import { UnauthorizedError } from 'express-jwt'
import { TMSConstants } from '../common/tms.constants'
import { checkOperationsAdmin } from '../common/operations-admin.mw'

require('dotenv').config()

export class Routes {

    public tmsController:TMSController = new TMSController()
    public tmController:TMController = new TMController()

    public routes (app:any) {
        app.route(RoutesConstants.HEALTH).get((req:Request, res:Response) => this.tmsController.health(req, res))
        app.route(RoutesConstants.CREATE_TENANTS).post(checkJwt(), validate(validator.createTenant,{},{}),(req:Request,res:Response) => this.tmsController.createTenant(req,res))
        app.route(RoutesConstants.ADD_TENANT_USERS).post(checkJwt(), validate(validator.addTenantUser,{},{}), checkTenantAccess([TMSConstants.TENANT_OWNER, TMSConstants.USER_ADMIN]),(req:Request,res:Response) => this.tmsController.addTenantUser(req,res))
        app.route(RoutesConstants.GET_USER_TENANTS).get(checkJwt({ sharedServiceAccess: true }),  validate(validator.getUserTenants,{},{}),(req:Request,res:Response) => this.tmsController.getTenantsForUser(req,res))
        app.route(RoutesConstants.GET_TENANT_USERS).get(checkJwt(),  validate(validator.getTenantUsers,{},{}), checkTenantAccess([]),(req:Request,res:Response) => this.tmsController.getUsersForTenant(req,res))
        //app.route(RoutesConstants.CREATE_TENANT_ROLES).post(checkJwt(),  validate(validator.createTenantRoles,{},{}), checkTenantAccess([TMSConstants.TENANT_OWNER, TMSConstants.USER_ADMIN]),(req:Request,res:Response) => this.tmsController.createRoles(req,res))
        app.route(RoutesConstants.ASSIGN_USER_ROLES).post(checkJwt(),  validate(validator.assignUserRoles,{},{}), checkTenantAccess([TMSConstants.TENANT_OWNER, TMSConstants.USER_ADMIN]),(req:Request,res:Response) => this.tmsController.assignUserRoles(req,res))
        app.route(RoutesConstants.GET_TMS_ROLES).get(checkJwt(), (req:Request,res:Response) => this.tmsController.getTenantRoles(req,res))
        app.route(RoutesConstants.GET_USER_ROLES).get(checkJwt(),  validate(validator.getUserRoles,{},{}),(req:Request,res:Response) => this.tmsController.getUserRoles(req,res))
        app.route(RoutesConstants.UNASSIGN_USER_ROLES).delete(checkJwt(),  validate(validator.unassignUserRoles,{},{}), checkTenantAccess([TMSConstants.TENANT_OWNER, TMSConstants.USER_ADMIN]),(req:Request,res:Response) => this.tmsController.unassignUserRoles(req,res))
        app.route(RoutesConstants.SEARCH_BC_GOV_IDIR_USERS).get(checkJwt(), validate(validator.searchBCGOVSSOUsers,{},{}),(req:Request,res:Response) => this.tmsController.searchBCGOVSSOUsers(req,res))
        app.route(RoutesConstants.GET_TENANT).get(checkJwt(),  validate(validator.getTenant,{},{}), checkTenantAccess([]),(req:Request,res:Response) => this.tmsController.getTenant(req,res))
        app.route(RoutesConstants.GET_ROLES_FOR_SSO_USER).get(checkJwt( {sharedServiceAccess: true}),  validate(validator.getRolesForSSOUser,{},{}),(req:Request,res:Response) => this.tmsController.getRolesForSSOUser(req,res))
        app.route(RoutesConstants.UPDATE_TENANT).put(checkJwt(), validate(validator.updateTenant,{},{}), checkTenantAccess([TMSConstants.TENANT_OWNER]),(req:Request,res:Response) => this.tmsController.updateTenant(req,res))
        app.route(RoutesConstants.CREATE_TENANT_REQUEST).post(checkJwt(), validate(validator.createTenantRequest,{},{}),(req:Request,res:Response) => this.tmsController.createTenantRequest(req,res))
        app.route(RoutesConstants.UPDATE_TENANT_REQUEST_STATUS).patch(checkJwt(), checkOperationsAdmin, validate(validator.updateTenantRequestStatus,{},{}),(req:Request,res:Response) => this.tmsController.updateTenantRequestStatus(req,res))
        app.route(RoutesConstants.GET_TENANT_REQUESTS).get(checkJwt(), checkOperationsAdmin, validate(validator.getTenantRequests,{},{}),(req:Request,res:Response) => this.tmsController.getTenantRequests(req,res))
        
        app.route(RoutesConstants.CREATE_GROUP).post(checkJwt(), validate(validator.createGroup,{},{}), checkTenantAccess([TMSConstants.TENANT_OWNER, TMSConstants.USER_ADMIN]),(req:Request,res:Response) => this.tmController.createGroup(req,res))
        app.route(RoutesConstants.UPDATE_GROUP).put(checkJwt(), validate(validator.updateGroup,{},{}), checkTenantAccess([TMSConstants.TENANT_OWNER, TMSConstants.USER_ADMIN]),(req:Request,res:Response) => this.tmController.updateGroup(req,res))
        app.route(RoutesConstants.ADD_GROUP_USER).post(checkJwt(), validate(validator.addGroupUser,{},{}), checkTenantAccess([TMSConstants.TENANT_OWNER, TMSConstants.USER_ADMIN]),(req:Request,res:Response) => this.tmController.addGroupUser(req,res))
        app.route(RoutesConstants.REMOVE_GROUP_USER).delete(checkJwt(), validate(validator.removeGroupUser,{},{}), checkTenantAccess([TMSConstants.TENANT_OWNER, TMSConstants.USER_ADMIN]),(req:Request,res:Response) => this.tmController.removeGroupUser(req,res))
        app.route(RoutesConstants.GET_GROUP).get(checkJwt(), validate(validator.getGroup,{},{}), checkTenantAccess([]),(req:Request,res:Response) => this.tmController.getGroup(req,res))
        app.route(RoutesConstants.GET_TENANT_GROUPS).get(checkJwt({ sharedServiceAccess: true }), validate(validator.getTenantGroups,{},{}),(req:Request,res:Response) => this.tmController.getTenantGroups(req,res))
        
        app.route(RoutesConstants.CREATE_SHARED_SERVICE).post(checkJwt(), checkOperationsAdmin, validate(validator.createSharedService,{},{}),(req:Request,res:Response) => this.tmsController.createSharedService(req,res))
        app.route(RoutesConstants.ADD_SHARED_SERVICE_ROLES).post(checkJwt(), validate(validator.addSharedServiceRoles,{},{}), checkOperationsAdmin,(req:Request,res:Response) => this.tmsController.addSharedServiceRoles(req,res))
        app.route(RoutesConstants.GET_ALL_ACTIVE_SHARED_SERVICES).get(checkJwt(), (req:Request,res:Response) => this.tmsController.getAllActiveSharedServices(req,res))
        app.route(RoutesConstants.GET_SHARED_SERVICE_ROLES_FOR_GROUP).get(checkJwt({ sharedServiceAccess: true }), validate(validator.getSharedServiceRolesForGroup,{},{}), checkTenantAccess([]),(req:Request,res:Response) => this.tmController.getSharedServiceRolesForGroup(req,res))
        app.route(RoutesConstants.UPDATE_SHARED_SERVICE_ROLES_FOR_GROUP).put(checkJwt(), validate(validator.updateSharedServiceRolesForGroup,{},{}), checkTenantAccess([TMSConstants.TENANT_OWNER, TMSConstants.USER_ADMIN]),(req:Request,res:Response) => this.tmController.updateSharedServiceRolesForGroup(req,res))
        app.route(RoutesConstants.ASSOCIATE_SHARED_SERVICE_TO_TENANT).post(checkJwt(), validate(validator.associateSharedServiceToTenant,{},{}), checkTenantAccess([TMSConstants.TENANT_OWNER]),(req:Request,res:Response) => this.tmsController.associateSharedServiceToTenant(req,res))
        app.route(RoutesConstants.GET_SHARED_SERVICES_FOR_TENANT).get(checkJwt(), validate(validator.getSharedServicesForTenant,{},{}), checkTenantAccess([]),(req:Request,res:Response) => this.tmsController.getSharedServicesForTenant(req,res))
        app.route(RoutesConstants.GET_USER_GROUPS_WITH_SHARED_SERVICE_ROLES).get(checkJwt({ sharedServiceAccess: true }), validate(validator.getUserGroupsWithSharedServiceRoles,{},{}), checkTenantAccess([]),(req:Request,res:Response) => this.tmController.getUserGroupsWithSharedServiceRoles(req,res))

        app.use(function (error: Error, req: any, res: Response<any, Record<string, any>>, next: any) {
            if (error instanceof ValidationError) {
                return res.status(error.statusCode).json(error)
            }
            if (error instanceof UnauthorizedError) {
                return res.status(401).json({ error: 'Unauthorized' })
            }
            console.log(error.message)
            res.status(500).json({ error: 'Internal Server Error' })
        })
    }
}