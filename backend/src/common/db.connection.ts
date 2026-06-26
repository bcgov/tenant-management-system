import { DataSource } from 'typeorm'
import logger from './logger'

const config = require('../ormconfig')

const AppDataSource = new DataSource({
  ...config,
})

export const connection = AppDataSource

AppDataSource.initialize()
  .then(async () => {
    logger.info('Connected to database', { host: config.host })

    // Create the extension for calling uuid_generate_v4() in the migrations.
    // Note that this extension is not needed because modern PostgreSQL has the
    // preferred gen_random_uuid() function. We should ideally switch to this
    // new function.
    await AppDataSource.query(
      'CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public',
    )

    // Ensure the schema exists
    await AppDataSource.query(`CREATE SCHEMA IF NOT EXISTS "${config.schema}"`)

    // Set the search path to always use tms schema first
    await AppDataSource.query(`SET search_path TO "${config.schema}", public`)

    logger.info('Database schema configured', { schema: config.schema })
  })
  .catch((error: unknown) => {
    logger.error('Database initialization failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
  })
