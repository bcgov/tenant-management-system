import * as dotenv from 'dotenv'
import path from 'node:path'

dotenv.config()

const dbConfig = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'mysecretpassword',
  database: process.env.POSTGRES_DATABASE || 'postgres',
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
