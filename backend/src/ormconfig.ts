import * as dotenv from "dotenv";
dotenv.config();
 
const dbConfig = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'mysecretpassword',
  database: process.env.POSTGRES_DATABASE || 'postgres',
  synchronize: false,
  logging: true,
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