import { Request, Response } from 'express'
import { RoutesConstants } from '../common/routes.constants'
import {TMSController} from '../controllers/tms.controller'
import { validate, ValidationError } from 'express-validation'
import validator from '../common/tms.validator'
import { checkJwt } from '../common/auth.mw'
import { UnauthorizedError } from 'express-jwt'

require('dotenv').config()

export class Routes {

    public tmsController:TMSController = new TMSController()

    public routes (app:any) {
        app.route(RoutesConstants.HEALTH).get((req:Request, res:Response) => this.tmsController.health(req, res))
        app.route(RoutesConstants.CREATE_TENANTS).post(checkJwt, validate(validator.createTenant,{},{}),(req:Request,res:Response) => this.tmsController.createTenant(req,res))
        app.route(RoutesConstants.ADD_TENANT_USERS).post(checkJwt, validate(validator.addTenantUser,{},{}),(req:Request,res:Response) => this.tmsController.addTenantUser(req,res))
        app.route(RoutesConstants.GET_USER_TENANTS).get(checkJwt,  validate(validator.getUserTenants,{},{}),(req:Request,res:Response) => this.tmsController.getTenantsForUser(req,res))
        app.route(RoutesConstants.GET_TENANT_USERS).get(checkJwt,  validate(validator.getTenantUsers,{},{}),(req:Request,res:Response) => this.tmsController.getUsersForTenant(req,res))
        app.route(RoutesConstants.CREATE_TENANT_ROLES).post(checkJwt,  validate(validator.createTenantRoles,{},{}),(req:Request,res:Response) => this.tmsController.createRoles(req,res))
        app.route(RoutesConstants.ASSIGN_USER_ROLES).post(checkJwt,  validate(validator.assignUserRoles,{},{}),(req:Request,res:Response) => this.tmsController.assignUserRoles(req,res))
        app.route(RoutesConstants.GET_TENANT_ROLES).get(checkJwt,  validate(validator.getTenantRoles,{},{}),(req:Request,res:Response) => this.tmsController.getTenantRoles(req,res))
        app.route(RoutesConstants.GET_USER_ROLES).get(checkJwt,  validate(validator.getUserRoles,{},{}),(req:Request,res:Response) => this.tmsController.getUserRoles(req,res))
        app.route(RoutesConstants.UNASSIGN_USER_ROLES).delete(checkJwt,  validate(validator.unassignUserRoles,{},{}),(req:Request,res:Response) => this.tmsController.unassignUserRoles(req,res))
        app.route(RoutesConstants.SEARCH_BC_GOV_IDIR_USERS).get(checkJwt,  validate(validator.searchBCGOVSSOUsers,{},{}),(req:Request,res:Response) => this.tmsController.searchBCGOVSSOUsers(req,res))
        app.route(RoutesConstants.GET_TENANT).get(checkJwt,  validate(validator.getTenant,{},{}),(req:Request,res:Response) => this.tmsController.getTenant(req,res))
        app.route(RoutesConstants.GET_ROLES_FOR_SSO_USER).get(checkJwt,  validate(validator.getRolesForSSOUser,{},{}),(req:Request,res:Response) => this.tmsController.getRolesForSSOUser(req,res))

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