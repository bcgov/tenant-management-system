import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type App, createApp } from 'vue'

import { handleInitError, initializeApp } from '@/main'
import { ConfigError, loadConfig } from '@/services/config.service'

const mockApp: Partial<App<Element>> = {
  use: vi.fn().mockReturnThis(),
  mount: vi.fn(),
}

const mockAuthStore = {
  initKeycloak: vi.fn(async () => undefined),
}

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
  return {
    ...actual,
    createApp: vi.fn(() => mockApp),
  }
})

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => mockAuthStore,
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('initializeApp', () => {
  it('creates the app, initializes auth, and mounts', async () => {
    await initializeApp()

    expect(createApp).toHaveBeenCalledTimes(1)
    expect(mockApp.use).toHaveBeenCalled()
    expect(mockAuthStore.initKeycloak).toHaveBeenCalledTimes(1)
    expect(mockApp.mount).toHaveBeenCalledWith('#app')
  })

  it('throws when loadConfig fails', async () => {
    vi.mocked(loadConfig).mockRejectedValueOnce(new ConfigError('fail'))

    await expect(initializeApp()).rejects.toBeInstanceOf(ConfigError)
  })

  it('throws when initKeycloak fails', async () => {
    mockAuthStore.initKeycloak.mockRejectedValueOnce(
      new Error('Keycloak failed'),
    )

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
