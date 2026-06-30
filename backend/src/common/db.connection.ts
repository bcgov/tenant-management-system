import { DataSource, EntityManager } from 'typeorm'
import logger from './logger'

const config = require('../ormconfig')

const AppDataSource = new DataSource({
  ...config,
})

export const connection = AppDataSource

export const getManager = (): EntityManager => connection.manager

AppDataSource.initialize()
  .then(async () => {
    logger.info('Connected to database', { host: config.host })

    await AppDataSource.query(
      'CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public',
    )

    await AppDataSource.query(`CREATE SCHEMA IF NOT EXISTS "${config.schema}"`)

    await AppDataSource.query(`SET search_path TO "${config.schema}", public`)

    logger.info('Database schema configured', { schema: config.schema })
  })
  .catch((error: unknown) => {
    logger.error('Database initialization failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
  })
