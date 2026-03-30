import App from './app'
import logger from './common/logger'
import { config } from './services/config.service'

const app = new App().app
const port = config.port
app.listen(port, () => {
  logger.info(`TMS API is now available on port: ${port}`)
  logger.info(`TMS API docs available at http://localhost:${port}/docs`)
})
