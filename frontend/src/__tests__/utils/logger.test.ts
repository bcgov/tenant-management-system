import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('Logger', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  describe('in development environment', () => {
    beforeEach(() => {
      vi.stubEnv('DEV', true)
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

    describe('warning', () => {
      it('should log warning message', async () => {
        const { logger } = await import('@/utils/logger')
        logger.warning('Test warning message')

        expect(consoleWarnSpy).toHaveBeenCalledWith('Test warning message')
        expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      })

      it('should log warning message with error object', async () => {
        const { logger } = await import('@/utils/logger')
        const error = new Error('Test warning message')
        logger.warning('Test warning message', error)

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'Test warning message',
          error,
        )
        expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('in production environment', () => {
    beforeEach(() => {
      vi.stubEnv('DEV', false)
    })

    it('should not log error messages', async () => {
      const { logger } = await import('@/utils/logger')
      logger.error('Test error message')
      logger.error('Test error message', new Error('Test'))

      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('should not log warning messages', async () => {
      const { logger } = await import('@/utils/logger')
      logger.warning('Test warning message')

      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })
  })

  describe('logger object structure', () => {
    beforeEach(() => {
      vi.stubEnv('DEV', true)
    })

    it('should expose expected methods', async () => {
      const { logger } = await import('@/utils/logger')
      expect(logger).toHaveProperty('error')
      expect(logger).toHaveProperty('warning')
      expect(typeof logger.error).toBe('function')
      expect(typeof logger.warning).toBe('function')
    })
  })
})
