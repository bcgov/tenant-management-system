import path from 'node:path'
import { config, loadConfig } from './services/config.service'

// Load the configuration when running for migrations. When running as part of
// the app this does nothing as main.ts has already loaded the configuration.
loadConfig()

const dbConfig = {
  type: 'postgres',
  host: config.postgres.host,
  port: config.postgres.port,
  username: config.postgres.user,
  password: config.postgres.password,
  database: config.postgres.database,
  schema: 'tms',
  synchronize: false,
  logging: true,
  entities: [path.join(__dirname, 'entities/**/*.{js,ts}')],
  migrations: [path.join(__dirname, 'migrations/**/*.{js,ts}')],
  subscribers: [path.join(__dirname, 'subscriber/**/*.{js,ts}')],
  cli: {
    entitiesDir: 'src/entities',
    migrationsDir: 'src/migration',
    subscribersDir: 'src/subscriber',
  },
}

module.exports = dbConfig
