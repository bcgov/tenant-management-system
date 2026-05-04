import axios, { AxiosHeaders, type AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeUser } from '@/__tests__/__factories__'
import { createMockAuthStore } from '@/__tests__/__helpers__/useAuthStore.mock'

import { SessionExpiredError } from '@/errors/SessionExpiredError'
import { authenticatedAxios } from '@/services/authenticated.axios'
import * as logApiErrorModule from '@/services/utils'

vi.mock('@/services/config.service', () => ({
  config: { api: { baseUrl: 'https://api.example.com' } },
}))

let currentAuthStore = createMockAuthStore()

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => currentAuthStore,
}))

beforeEach(() => {
  vi.clearAllMocks()
  currentAuthStore = createMockAuthStore()
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

describe('request interceptor (expired)', () => {
  it('throws SessionExpiredError if session is already expired', async () => {
    currentAuthStore = createMockAuthStore({
      user: null,
      isSessionExpired: true,
    })

    await expect(
      getSuccessInterceptor()({ headers: new AxiosHeaders() }),
    ).rejects.toBeInstanceOf(SessionExpiredError)
  })

  it('throws SessionExpiredError if token refresh causes expiry', async () => {
    currentAuthStore = createMockAuthStore({
      user: makeUser(),
      ensureFreshToken: vi.fn().mockImplementation(() => {
        vi.spyOn(currentAuthStore, 'isSessionExpired', 'get').mockReturnValue(
          true,
        )
      }),
    })

    await expect(
      getSuccessInterceptor()({ headers: new AxiosHeaders() }),
    ).rejects.toBeInstanceOf(SessionExpiredError)
  })
})

describe('request interceptor (success)', () => {
  it('sets baseURL from config', async () => {
    const cfg = await getSuccessInterceptor()({ headers: new AxiosHeaders() })

    expect(cfg.baseURL).toBe('https://api.example.com')
  })

  it('does not set Authorization when not authenticated', async () => {
    currentAuthStore = createMockAuthStore({
      user: null,
    })
    const cfg = await getSuccessInterceptor()({ headers: new AxiosHeaders() })

    expect(cfg.headers.Authorization).toBeUndefined()
    expect(currentAuthStore.ensureFreshToken).not.toHaveBeenCalled()
  })

  it('sets Authorization header and ensures fresh token when authenticated', async () => {
    currentAuthStore = createMockAuthStore({
      getAccessToken: vi.fn().mockReturnValue('my-token'),
      user: makeUser(),
    })

    const cfg = await getSuccessInterceptor()({ headers: new AxiosHeaders() })

    expect(currentAuthStore.ensureFreshToken).toHaveBeenCalledOnce()
    expect(cfg.headers.Authorization).toBe('Bearer my-token')
  })
})

function getResponseInterceptor() {
  const instance = authenticatedAxios()
  const handler = instance.interceptors.response.handlers?.[0]

  if (!handler?.rejected) {
    throw new Error('Response interceptor not found')
  }

  return { success: handler.fulfilled, error: handler.rejected }
}

describe('response interceptor', () => {
  it('passes through successful responses unchanged', () => {
    const { success } = getResponseInterceptor()
    const response = { data: { foo: 'bar' } } as AxiosResponse

    expect(success(response)).toBe(response)
  })

  it('logs all errors', () => {
    const logSpy = vi.spyOn(logApiErrorModule, 'logApiError')
    const { error } = getResponseInterceptor()
    const err = new Error('something broke')

    error(err).catch(() => {})

    expect(logSpy).toHaveBeenCalledWith('API request failed', err)
  })

  it('returns a never-resolving promise for SessionExpiredError', async () => {
    const { error } = getResponseInterceptor()

    const result = error(new SessionExpiredError())

    // Verify it's a promise that doesn't reject
    await expect(
      Promise.race([result, Promise.resolve('sentinel')]),
    ).resolves.toBe('sentinel')
  })

  it('rejects with the original error for non-session errors', async () => {
    const { error } = getResponseInterceptor()
    const err = new Error('network failure')

    await expect(error(err)).rejects.toBe(err)
  })
})
