import type { Application, Request, Response, NextFunction } from 'express'
import { RoutesConstants } from '../common/routes.constants'
import { TMSController } from '../controllers/tms.controller'
import { TMController } from '../controllers/tm.controller'
import { validate, ValidationError } from 'express-validation'
import validator from '../common/tms.validator'
import { UnauthorizedError } from 'express-jwt'

require('dotenv').config()

export class Routes {
  public tmsController: TMSController = new TMSController()
  public tmController: TMController = new TMController()

  public routes(app: Application) {
    // Proxy swagger docs endpoints to /v1/docs for access through frontend
    // Frontend proxies /api/v1/docs -> /v1/docs on backend
    app.get('/v1/docs', (req: Request, res: Response) => {
      res.redirect('/docs')
    })

    // Proxy swagger assets to /v1/swagger-resources for proper loading
    app.get('/v1/swagger-resources/*', (req: Request, res: Response) => {
      const path = req.path.replace('/v1/swagger-resources', '')
      res.redirect(`/swagger-resources${path}`)
    })

    app
      .route(RoutesConstants.HEALTH)
      .get((req: Request, res: Response) => this.tmsController.health(req, res))
    app
      .route(RoutesConstants.CREATE_TENANTS)
      .post(
        validate(validator.createTenant, {}, {}),
        (req: Request, res: Response) =>
          this.tmsController.createTenant(req, res),
      )
    app
      .route(RoutesConstants.ADD_TENANT_USERS)
      .post(
        validate(validator.addTenantUser, {}, {}),
        (req: Request, res: Response) =>
          this.tmsController.addTenantUser(req, res),
      )
    app
      .route(RoutesConstants.REMOVE_TENANT_USER)
      .delete(
        validate(validator.removeTenantUser, {}, {}),
        (req: Request, res: Response) =>
          this.tmsController.removeTenantUser(req, res),
      )
    app
      .route(RoutesConstants.GET_USER_TENANTS)
      .get(
        validate(validator.getUserTenants, {}, {}),
        (req: Request, res: Response) =>
          this.tmsController.getTenantsForUser(req, res),
      )
    app
      .route(RoutesConstants.GET_TENANT_USERS)
      .get(
        validate(validator.getTenantUsers, {}, {}),
        (req: Request, res: Response) =>
          this.tmsController.getUsersForTenant(req, res),
      )
    //app.route(RoutesConstants.CREATE_TENANT_ROLES).post(checkJwt(),  validate(validator.createTenantRoles,{},{}), checkTenantAccess([TMSConstants.TENANT_OWNER, TMSConstants.USER_ADMIN]),(req:Request,res:Response) => this.tmsController.createRoles(req,res))
    app
      .route(RoutesConstants.ASSIGN_USER_ROLES)
      .post(
        validate(validator.assignUserRoles, {}, {}),
        (req: Request, res: Response) =>
          this.tmsController.assignUserRoles(req, res),
      )
    app
      .route(RoutesConstants.GET_TMS_ROLES)
      .get((req: Request, res: Response) =>
        this.tmsController.getTenantRoles(req, res),
      )
    app
      .route(RoutesConstants.GET_USER_ROLES)
      .get(
        validate(validator.getUserRoles, {}, {}),
        (req: Request, res: Response) =>
          this.tmsController.getUserRoles(req, res),
      )
    app
      .route(RoutesConstants.UNASSIGN_USER_ROLES)
      .delete(
        validate(validator.unassignUserRoles, {}, {}),
        (req: Request, res: Response) =>
          this.tmsController.unassignUserRoles(req, res),
      )
    app
      .route(RoutesConstants.SEARCH_BC_GOV_IDIR_USERS)
      .get(
        validate(validator.searchBCGOVSSOUsers, {}, {}),
        (req: Request, res: Response) =>
          this.tmsController.searchBCGOVSSOUsers(req, res),
      )
    app
      .route(RoutesConstants.SEARCH_BC_GOV_BCEID_USERS)
      .get(
        validate(validator.searchBCGOVSSOBceidUsers, {}, {}),
        (req: Request, res: Response) =>
          this.tmsController.searchBCGOVSSOBceidUsers(req, res),
      )
    app
      .route(RoutesConstants.GET_TENANT)
      .get(
        validate(validator.getTenant, {}, {}),
        (req: Request, res: Response) => this.tmsController.getTenant(req, res),
      )
    app
      .route(RoutesConstants.GET_ROLES_FOR_SSO_USER)
      .get(
        validate(validator.getRolesForSSOUser, {}, {}),
        (req: Request, res: Response) =>
          this.tmsController.getRolesForSSOUser(req, res),
      )
    app
      .route(RoutesConstants.UPDATE_TENANT)
      .put(
        validate(validator.updateTenant, {}, {}),
        (req: Request, res: Response) =>
          this.tmsController.updateTenant(req, res),
      )
    app
      .route(RoutesConstants.CREATE_TENANT_REQUEST)
      .post(
        validate(validator.createTenantRequest, {}, {}),
        (req: Request, res: Response) =>
          this.tmsController.createTenantRequest(req, res),
      )
    app
      .route(RoutesConstants.UPDATE_TENANT_REQUEST_STATUS)
      .patch(
        validate(validator.updateTenantRequestStatus, {}, {}),
        (req: Request, res: Response) =>
          this.tmsController.updateTenantRequestStatus(req, res),
      )
    app
      .route(RoutesConstants.GET_TENANT_REQUESTS)
      .get(
        validate(validator.getTenantRequests, {}, {}),
        (req: Request, res: Response) =>
          this.tmsController.getTenantRequests(req, res),
      )

    app
      .route(RoutesConstants.CREATE_GROUP)
      .post(
        validate(validator.createGroup, {}, {}),
        (req: Request, res: Response) =>
          this.tmController.createGroup(req, res),
      )
    app
      .route(RoutesConstants.UPDATE_GROUP)
      .put(
        validate(validator.updateGroup, {}, {}),
        (req: Request, res: Response) =>
          this.tmController.updateGroup(req, res),
      )
    app
      .route(RoutesConstants.ADD_GROUP_USER)
      .post(
        validate(validator.addGroupUser, {}, {}),
        (req: Request, res: Response) =>
          this.tmController.addGroupUser(req, res),
      )
    app
      .route(RoutesConstants.REMOVE_GROUP_USER)
      .delete(
        validate(validator.removeGroupUser, {}, {}),
        (req: Request, res: Response) =>
          this.tmController.removeGroupUser(req, res),
      )
    app
      .route(RoutesConstants.GET_GROUP)
      .get(
        validate(validator.getGroup, {}, {}),
        (req: Request, res: Response) => this.tmController.getGroup(req, res),
      )
    app
      .route(RoutesConstants.GET_TENANT_GROUPS)
      .get(
        validate(validator.getTenantGroups, {}, {}),
        (req: Request, res: Response) =>
          this.tmController.getTenantGroups(req, res),
      )

    app
      .route(RoutesConstants.CREATE_SHARED_SERVICE)
      .post(
        validate(validator.createSharedService, {}, {}),
        (req: Request, res: Response) =>
          this.tmsController.createSharedService(req, res),
      )
    app
      .route(RoutesConstants.ADD_SHARED_SERVICE_ROLES)
      .post(
        validate(validator.addSharedServiceRoles, {}, {}),
        (req: Request, res: Response) =>
          this.tmsController.addSharedServiceRoles(req, res),
      )
    app
      .route(RoutesConstants.GET_ALL_ACTIVE_SHARED_SERVICES)
      .get((req: Request, res: Response) =>
        this.tmsController.getAllActiveSharedServices(req, res),
      )
    app
      .route(RoutesConstants.GET_SHARED_SERVICE_ROLES_FOR_GROUP)
      .get(
        validate(validator.getSharedServiceRolesForGroup, {}, {}),
        (req: Request, res: Response) =>
          this.tmController.getSharedServiceRolesForGroup(req, res),
      )
    app
      .route(RoutesConstants.UPDATE_SHARED_SERVICE_ROLES_FOR_GROUP)
      .put(
        validate(validator.updateSharedServiceRolesForGroup, {}, {}),
        (req: Request, res: Response) =>
          this.tmController.updateSharedServiceRolesForGroup(req, res),
      )
    app
      .route(RoutesConstants.ASSOCIATE_SHARED_SERVICE_TO_TENANT)
      .post(
        validate(validator.associateSharedServiceToTenant, {}, {}),
        (req: Request, res: Response) =>
          this.tmsController.associateSharedServiceToTenant(req, res),
      )
    app
      .route(RoutesConstants.GET_SHARED_SERVICES_FOR_TENANT)
      .get(
        validate(validator.getSharedServicesForTenant, {}, {}),
        (req: Request, res: Response) =>
          this.tmsController.getSharedServicesForTenant(req, res),
      )
    app
      .route(RoutesConstants.GET_EFFECTIVE_SHARED_SERVICE_ROLES)
      .get(
        validate(validator.getEffectiveSharedServiceRoles, {}, {}),
        (req: Request, res: Response) =>
          this.tmController.getEffectiveSharedServiceRoles(req, res),
      )
    app
      .route(RoutesConstants.GET_USER_GROUPS_WITH_SHARED_SERVICE_ROLES)
      .get(
        validate(validator.getUserGroupsWithSharedServiceRoles, {}, {}),
        (req: Request, res: Response) =>
          this.tmController.getUserGroupsWithSharedServiceRoles(req, res),
      )
    app
      .route(RoutesConstants.GET_TENANT_USER)
      .get(
        validate(validator.getTenantUser, {}, {}),
        (req: Request, res: Response) =>
          this.tmsController.getTenantUser(req, res),
      )

    const errorHandler = (
      error: Error,
      req: Request,
      res: Response,
      next: NextFunction,
    ): void => {
      if (error instanceof ValidationError) {
        res.status(error.statusCode).json(error)
        return
      }
      if (error instanceof UnauthorizedError) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }
      console.log(error.message)
      res.status(500).json({ error: 'Internal Server Error' })
    }
    app.use(errorHandler)
  }
}
