import axios, { AxiosHeaders } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authenticatedAxios } from '@/services/authenticated.axios'

vi.mock('@/services/config.service', () => ({
  config: { api: { baseUrl: 'https://api.example.com' } },
}))

const mockAuthStore = {
  authenticated: false,
  keycloak: null as { token: string } | null,
  loggedOut: false,
  token: '',
  user: null,
}

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => mockAuthStore,
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockAuthStore.authenticated = false
  mockAuthStore.keycloak = null
  mockAuthStore.loggedOut = false
  mockAuthStore.token = ''
  mockAuthStore.user = null
})

function getSuccessInterceptor() {
  const instance = authenticatedAxios()
  const handler = instance.interceptors.request.handlers?.[0]

  if (!handler?.fulfilled) {
    throw new Error('Request interceptor not found')
  }

  return handler.fulfilled
}

function getErrorInterceptor() {
  const instance = authenticatedAxios()
  const handler = instance.interceptors.request.handlers?.[0]

  if (!handler?.rejected) {
    throw new Error('Request error interceptor not found')
  }

  return handler.rejected
}

describe('authenticatedAxios', () => {
  it('creates an instance with the default timeout', () => {
    const spy = vi.spyOn(axios, 'create')

    authenticatedAxios()

    expect(spy).toHaveBeenCalledWith({
      baseURL: 'https://api.example.com',
      timeout: 60000,
    })
  })

  it('creates an instance with a custom timeout', () => {
    const spy = vi.spyOn(axios, 'create')

    authenticatedAxios(5000)

    expect(spy).toHaveBeenCalledWith({
      baseURL: 'https://api.example.com',
      timeout: 5000,
    })
  })
})

describe('request interceptor (success)', () => {
  it('sets baseURL from config', async () => {
    const spy = vi.spyOn(axios, 'create')

    authenticatedAxios()

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'https://api.example.com' }),
    )
  })

  it('does not set Authorization when not authenticated', async () => {
    const cfg = await getSuccessInterceptor()({ headers: new AxiosHeaders() })

    expect(cfg.headers.Authorization).toBeUndefined()
  })

  it('sets Authorization header when authenticated', async () => {
    mockAuthStore.authenticated = true
    mockAuthStore.keycloak = { token: 'my-token' }

    const cfg = await getSuccessInterceptor()({ headers: new AxiosHeaders() })

    expect(cfg.headers.Authorization).toBe('Bearer my-token')
  })
})

describe('request interceptor (error)', () => {
  it('sets auth store state and redirects on network error', async () => {
    const error = await getErrorInterceptor()({ code: 'ERR_NETWORK' }).catch(
      (e: unknown) => e,
    )

    expect(mockAuthStore.loggedOut).toBe(true)
    expect(mockAuthStore.authenticated).toBe(false)
    expect(mockAuthStore.token).toBe('')
    expect(mockAuthStore.user).toBeNull()
    expect((error as Error).message).toMatch(/Network Error/)
  })

  it('returns the error directly if already an Error', async () => {
    const original = new Error('boom')

    const error = await getErrorInterceptor()(original).catch((e: unknown) => e)

    expect(error).toBe(original)
  })

  it('wraps a non-Error in a new Error', async () => {
    const error = await getErrorInterceptor()('something bad').catch(
      (e: unknown) => e,
    )

    expect(error).toBeInstanceOf(Error)
    expect((error as Error & { originalError: unknown }).originalError).toBe(
      'something bad',
    )
  })
})
