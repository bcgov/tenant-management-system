import cors from 'cors'
import express from 'express'
import { Routes } from './routes/routes'
import rTracer from 'cls-rtracer'
import { requestLoggingMiddleware } from './common/logger.mw'
import { checkJwt, jwtErrorHandler } from './common/auth.mw'
import logger from './common/logger'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'
import path from 'path'
require('dotenv').config()

export default class App {
  public app: express.Application
  public routes: Routes = new Routes()

  constructor() {
    this.app = express()
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'];
   
    this.app.use(rTracer.expressMiddleware())
    this.app.use(requestLoggingMiddleware)

    this.app.use(cors({
      origin: function(origin, callback) {
        if (!origin) return callback(null, true)
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          return callback(null, true)
        } else {
          const msg = `CORS Error: This site ${origin} does not have access`
          logger.error(msg, { origin })
          return callback(new Error(msg), false)
        }
      }
    }))
    
    this.config()

    const swaggerDocument = YAML.load(path.join(__dirname, "docs", "openapi.yaml"))
    this.app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))

    this.app.use(checkJwt)
    this.app.use(jwtErrorHandler)
    this.routes.routes(this.app)
  }

  private config(): void {
    this.app.use(express.json())
    this.app.use(express.urlencoded({ extended: false }))
  }
}
