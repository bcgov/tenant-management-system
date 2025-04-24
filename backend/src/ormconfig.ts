import * as dotenv from "dotenv";
dotenv.config();

const isTestEnv = process.env.NODE_ENV === "test"
 
  const dbConfig = {
    type: 'postgres',
    host: isTestEnv? 'localhost' : process.env.DB_HOST,
    port: isTestEnv? 54321: process.env.DB_PORT,
    username: isTestEnv? 'testuser': process.env.DB_USER,
    password: isTestEnv? 'testpassword': process.env.DB_PASSWORD,
    database: isTestEnv? 'testdb': process.env.DB_DATABASE,
    synchronize: false,
    logging: isTestEnv,
    entities: [
      'src/entities/**/*.ts'
    ],
    migrations: [
      './src/migrations/*.ts'
    ],
    subscribers: [
      'src/subscriber/**/*.ts'
    ],
    cli: {
      entitiesDir: 'src/entities',
      migrationsDir: 'src/migration',
      subscribersDir: 'src/subscriber'
    }
 }

module.exports = dbConfig