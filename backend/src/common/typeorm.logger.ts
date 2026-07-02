import { Logger, QueryRunner } from 'typeorm'
import logger from './logger'

export class TypeOrmLogger implements Logger {
  public logQuery(query: string, _parameters?: unknown[]) {
    logger.debug('Database query', { query })
  }

  public logQueryError(error: string | Error, query: string) {
    logger.error('Database query failed', {
      error: error instanceof Error ? error.message : error,
      query,
    })
  }

  public logQuerySlow(time: number, _query: string) {
    logger.error('Slow database query', { time })
  }

  public logSchemaBuild(message: string) {
    logger.debug('Database schema update', { message })
  }

  public logMigration(message: string) {
    logger.debug('Database migration', { message })
  }

  public log(
    level: 'log' | 'info' | 'warn',
    message: unknown,
    _queryRunner?: QueryRunner,
  ) {
    const text = String(message)
    if (level === 'warn') {
      logger.debug(text)
      return
    }
    logger.debug(text)
  }
}
