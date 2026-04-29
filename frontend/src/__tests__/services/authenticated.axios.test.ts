import axios, { AxiosHeaders } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { type User, type UserId } from '@/models/user.model'
import { authenticatedAxios } from '@/services/authenticated.axios'

vi.mock('@/services/config.service', () => ({
  config: { api: { baseUrl: 'https://api.example.com' } },
}))

const mockAccessToken = vi.fn().mockReturnValue(undefined)
const mockEnsureFreshToken = vi.fn().mockResolvedValue(undefined)

const mockAuthStore = {
  authenticatedUser: null as User | null,
  ensureFreshToken: mockEnsureFreshToken,
  getAccessToken: mockAccessToken,
}

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => mockAuthStore,
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockAuthStore.authenticatedUser = null
  mockAccessToken.mockResolvedValue(undefined)
  mockEnsureFreshToken.mockResolvedValue(undefined)
})

function getSuccessInterceptor() {
  const instance = authenticatedAxios()
  const handler = instance.interceptors.request.handlers?.[0]

  if (!handler?.fulfilled) {
    throw new Error('Request interceptor not found')
  }

  return handler.fulfilled
}

describe('authenticatedAxios', () => {
  it('creates an instance with the default timeout', () => {
    const spy = vi.spyOn(axios, 'create')

    authenticatedAxios()

    expect(spy).toHaveBeenCalledWith({ timeout: 60000 })
  })

  it('creates an instance with a custom timeout', () => {
    const spy = vi.spyOn(axios, 'create')

    authenticatedAxios(5000)

    expect(spy).toHaveBeenCalledWith({ timeout: 5000 })
  })
})

describe('request interceptor (success)', () => {
  it('sets baseURL from config', async () => {
    const cfg = await getSuccessInterceptor()({ headers: new AxiosHeaders() })

    expect(cfg.baseURL).toBe('https://api.example.com')
  })

  it('does not set Authorization when not authenticated', async () => {
    const cfg = await getSuccessInterceptor()({ headers: new AxiosHeaders() })

    expect(cfg.headers.Authorization).toBeUndefined()
    expect(mockEnsureFreshToken).not.toHaveBeenCalled()
  })

  it('sets Authorization header and ensures fresh token when authenticated', async () => {
    mockAuthStore.authenticatedUser = { id: '123' as UserId } as unknown as User
    mockAccessToken.mockReturnValue('my-token')

    const cfg = await getSuccessInterceptor()({ headers: new AxiosHeaders() })

    expect(mockEnsureFreshToken).toHaveBeenCalledOnce()
    expect(cfg.headers.Authorization).toBe('Bearer my-token')
  })
})
