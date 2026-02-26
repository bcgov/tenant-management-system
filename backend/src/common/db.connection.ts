import { DataSource } from 'typeorm'

const config = require('../ormconfig')

const AppDataSource = new DataSource({
  ...config,
})

export const connection = AppDataSource

AppDataSource.initialize()
  .then(async () => {
    console.log(`Connected to database: ${config.host}`)

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

    console.log(`Using schema: ${config.schema}`)
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err)
  })
