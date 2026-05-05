import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'

import { handleInitError, initializeApp } from '@/main'
import { ConfigError, loadConfig } from '@/services/config.service'

const mockApp = {
  config: { errorHandler: undefined as unknown },
  mount: vi.fn(),
  use: vi.fn().mockReturnThis(),
}

const mockAuthStore = {
  ensureFreshToken: vi.fn(),
  init: vi.fn(async () => undefined),
}

const mockNotification = vi.hoisted(() => ({ error: vi.fn() }))

vi.mock('@/composables/useNotification', () => ({
  useNotification: () => mockNotification,
}))

const mockLogger = vi.hoisted(() => ({ error: vi.fn() }))

vi.mock('@/utils/logger', () => ({
  logger: mockLogger,
}))

vi.mock('@/services/config.service', () => ({
  ConfigError: class ConfigError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'ConfigError'
    }
  },
  loadConfig: vi.fn(async () => undefined),
}))

vi.mock('vue', async () => {
  const actual = await vi.importActual<typeof import('vue')>('vue')
  return { ...actual, createApp: vi.fn(() => mockApp) }
})

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => mockAuthStore,
}))

describe('initializeApp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = '<div id="app"></div>'
    mockAuthStore.ensureFreshToken = vi.fn()
  })

  it('creates the app, initializes auth, and mounts', async () => {
    await initializeApp()

    globalThis.dispatchEvent(new MouseEvent('click'))
    globalThis.dispatchEvent(new KeyboardEvent('keydown'))

    expect(createApp).toHaveBeenCalledTimes(1)
    expect(mockApp.use).toHaveBeenCalled()
    expect(mockAuthStore.init).toHaveBeenCalledTimes(1) // Matches refactored name
    expect(mockApp.mount).toHaveBeenCalledWith('#app')
    expect(mockAuthStore.ensureFreshToken).toHaveBeenCalledTimes(2)
  })

  it('throws when loadConfig fails', async () => {
    vi.mocked(loadConfig).mockRejectedValueOnce(new ConfigError('fail'))
    await expect(initializeApp()).rejects.toBeInstanceOf(ConfigError)
  })

  it('throws when authStore.init fails', async () => {
    mockAuthStore.init.mockRejectedValueOnce(new Error('Keycloak failed'))
    await expect(initializeApp()).rejects.toThrow('Keycloak failed')
  })
})

describe('handleInitError', () => {
  it('renders a Configuration Error for ConfigError', () => {
    handleInitError(new ConfigError('fail'))
    expect(document.body.innerHTML).toContain('Configuration Error')
  })

  it('renders an Authentication Error for Keycloak errors', () => {
    handleInitError(new Error('Keycloak failed'))
    expect(document.body.innerHTML).toContain('Authentication Error')
  })

  it('renders a generic error for unknown errors', () => {
    handleInitError(new Error('something else'))
    expect(document.body.innerHTML).toContain('Application Error')
  })
})

describe('app error handler', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await initializeApp()
  })

  it('logs and notifies for unexpected errors', () => {
    const handler = mockApp.config.errorHandler as Function

    handler(new Error('something broke'))

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Application Error',
      expect.any(Error),
    )
    expect(mockNotification.error).toHaveBeenCalledWith(
      'An unexpected error occurred',
    )
  })
})
