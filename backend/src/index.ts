import App from './app'
import logger from './common/logger'
import { initializeConnection } from './common/db.connection'
import { config } from './services/config.service'

const start = async () => {
  await initializeConnection()

  const app = new App().app
  const port = config.port
  app.listen(port, () => {
    logger.info(`TMS API is now available on port: ${port}`)
    logger.info(`TMS API docs available at http://localhost:${port}/docs`)
  })
}

start().catch((error: unknown) => {
  logger.error('TMS API startup failed', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  })
  process.exitCode = 1
})
