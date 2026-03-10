import App from './app'
import logger from './common/logger'
require('dotenv').config()

const app = new App().app
const PORT = process.env.PORT || 4144

app.listen(PORT, () => {
  logger.info('TMS API is now available on port: ' + PORT)
  logger.info(`TMS API docs available at http://localhost:${PORT}/docs`)
})
