import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('Logger', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  let consoleLogSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('in development environment', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development')
    })

    describe('error', () => {
      it('should log error message only', async () => {
        const { logger } = await import('@/utils/logger')
        logger.error('Test error message')

        expect(consoleErrorSpy).toHaveBeenCalledWith('Test error message')
        expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      })

      it('should log error message with error object', async () => {
        const { logger } = await import('@/utils/logger')
        const error = new Error('Test error')
        logger.error('Test error message', error)

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Test error message',
          error,
        )
        expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      })

      it('should handle various error types', async () => {
        const { logger } = await import('@/utils/logger')
        const stringError = 'String error'
        const objectError = { message: 'Object error' }
        const numberError = 404

        logger.error('String error', stringError)
        logger.error('Object error', objectError)
        logger.error('Number error', numberError)

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'String error',
          stringError,
        )
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Object error',
          objectError,
        )
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Number error',
          numberError,
        )
        expect(consoleErrorSpy).toHaveBeenCalledTimes(3)
      })
    })

    describe('info', () => {
      it('should log info message', async () => {
        const { logger } = await import('@/utils/logger')
        logger.info('Test info message')

        expect(consoleLogSpy).toHaveBeenCalledWith('Test info message')
        expect(consoleLogSpy).toHaveBeenCalledTimes(1)
      })
    })

    describe('warning', () => {
      it('should log warning message', async () => {
        const { logger } = await import('@/utils/logger')
        logger.warning('Test warning message')

        expect(consoleWarnSpy).toHaveBeenCalledWith('Test warning message')
        expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('in production environment', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production')
    })

    it('should not log error messages', async () => {
      const { logger } = await import('@/utils/logger')
      logger.error('Test error message')
      logger.error('Test error message', new Error('Test'))

      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('should not log info messages', async () => {
      const { logger } = await import('@/utils/logger')
      logger.info('Test info message')

      expect(consoleLogSpy).not.toHaveBeenCalled()
    })

    it('should not log warning messages', async () => {
      const { logger } = await import('@/utils/logger')
      logger.warning('Test warning message')

      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })
  })

  describe('in test environment', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'test')
    })

    it('should log in test environment (non-production)', async () => {
      const { logger } = await import('@/utils/logger')
      logger.error('Test error')
      logger.info('Test info')
      logger.warning('Test warning')

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('logger object structure', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development')
    })

    it('should expose expected methods', async () => {
      const { logger } = await import('@/utils/logger')
      expect(logger).toHaveProperty('error')
      expect(logger).toHaveProperty('info')
      expect(logger).toHaveProperty('warning')
      expect(typeof logger.error).toBe('function')
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.warning).toBe('function')
    })
  })
})
