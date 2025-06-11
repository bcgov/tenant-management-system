import { DataSource } from 'typeorm'

const config = require('../ormconfig.ts')

const AppDataSource = new DataSource({
    ...config,
})

export const connection = AppDataSource

AppDataSource.initialize()
    .then(async () => {
        console.log(`Connected to database: ${config.host}`);
        
        // Ensure the schema exists
        await AppDataSource.query(`CREATE SCHEMA IF NOT EXISTS "${config.schema}"`);
        
        // Set the search path to always use tms schema first
        await AppDataSource.query(`SET search_path TO "${config.schema}", public`);
        
        console.log(`Using schema: ${config.schema}`);
    })
    .catch((err) => {
        console.error("Error during Data Source initialization", err);
    });