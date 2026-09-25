import { Application, Request, Response } from 'express'
import { validate } from 'express-validation'
import { config } from '../services/config.service'
import logger from '../common/logger'
import { checkPocKey } from './poc-key.mw'
import { pocController } from './poc.controller'
import pocValidator from './poc.validator'

const POC_TENANTS = '/v1/poc/tenants'
const POC_ROLES = '/v1/poc/roles'
const POC_GROUPS = '/v1/poc/groups'

export const registerPocRoutes = (app: Application) => {
  if (!config.pocApiKey) {
    return
  }

  logger.info('POC routes enabled')

  app
    .route(POC_TENANTS)
    .get(
      checkPocKey,
      validate(pocValidator.getTenants, {}, {}),
      (req: Request, res: Response) => pocController.getTenants(req, res),
    )
  app
    .route(POC_ROLES)
    .get(
      checkPocKey,
      validate(pocValidator.getRoles, {}, {}),
      (req: Request, res: Response) => pocController.getRoles(req, res),
    )
  app
    .route(POC_GROUPS)
    .get(
      checkPocKey,
      validate(pocValidator.getGroups, {}, {}),
      (req: Request, res: Response) => pocController.getGroups(req, res),
    )
}
