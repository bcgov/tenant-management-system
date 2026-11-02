import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockAuthStore } from '@/__tests__/__helpers__/useAuthStore.mock'

import { SessionExpiredError } from '@/errors/SessionExpiredError'
import { ApiError, authenticatedFetch } from '@/services/api'
import { config } from '@/services/config.service'
import { logApiError } from '@/services/utils'

let currentAuthStore = createMockAuthStore()

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => currentAuthStore,
}))

vi.mock('@/services/config.service', () => ({
  config: { api: { baseUrl: 'https://api.example.com' } },
}))

vi.mock('@/services/utils', () => ({
  logApiError: vi.fn(),
}))

function mockFetchResponse(
  body: unknown,
  {
    status = 200,
    contentType = 'application/json',
  }: { status?: number; contentType?: string | null } = {},
) {
  const headers = new Headers()
  if (contentType) {
    headers.set('content-type', contentType)
  }

  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      headers,
      json: vi.fn().mockResolvedValue(body),
    }),
  )
}

function mockFetchFailure(error: Error) {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error))
}

function mockFetchMalformedJson(status: number) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
      ok: status >= 200 && status < 300,
      status,
    }),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('authentication', () => {
  it('attaches a bearer token when a user is authenticated', async () => {
    currentAuthStore = createMockAuthStore({
      getAccessToken: vi.fn().mockReturnValue('test-token'),
    })
    mockFetchResponse({ data: { tenant: {} } })

    await authenticatedFetch().get('/tenants/1')

    expect(currentAuthStore.ensureFreshToken).toHaveBeenCalledOnce()
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    )
  })

  it('omits the authorization header when no user is authenticated', async () => {
    currentAuthStore = createMockAuthStore({ user: null })
    mockFetchResponse({ data: {} })

    await authenticatedFetch().get('/tenants/1')

    expect(currentAuthStore.ensureFreshToken).not.toHaveBeenCalled()
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.not.objectContaining({
          Authorization: expect.any(String),
        }),
      }),
    )
  })

  it('includes content-type application/json when there is a body', async () => {
    currentAuthStore = createMockAuthStore({ user: null })
    mockFetchResponse({ data: {} })

    await authenticatedFetch().post('/tenants', { name: 'Test' })

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    )
  })

  it('omits content-type when there is no body', async () => {
    currentAuthStore = createMockAuthStore({ user: null })
    mockFetchResponse({ data: {} })

    await authenticatedFetch().get('/tenants/1')

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.not.objectContaining({
          'Content-Type': expect.any(String),
        }),
      }),
    )
  })
})

describe('URL construction', () => {
  beforeEach(() => {
    currentAuthStore = createMockAuthStore({ user: null })
  })

  it('prepends the base URL to the path', async () => {
    mockFetchResponse({ data: {} })

    await authenticatedFetch().get('/tenants/1')

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/tenants/1',
      expect.any(Object),
    )
  })

  it('appends query params from options', async () => {
    mockFetchResponse({ data: {} })

    await authenticatedFetch().get('/tenants', {
      params: { expand: 'tenantUserRoles' },
    })

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/tenants?expand=tenantUserRoles',
      expect.any(Object),
    )
  })

  describe('with a relative base URL', () => {
    const originalBaseUrl = config.api.baseUrl

    beforeEach(() => {
      config.api.baseUrl = '/api/v1'
    })

    afterEach(() => {
      config.api.baseUrl = originalBaseUrl
    })

    it('resolves the path against window.location.origin', async () => {
      mockFetchResponse({ data: {} })

      await authenticatedFetch().get('/tenants/1')

      expect(fetch).toHaveBeenCalledWith(
        `${window.location.origin}/api/v1/tenants/1`,
        expect.any(Object),
      )
    })

    it('appends query params to a relative base URL', async () => {
      mockFetchResponse({ data: {} })

      await authenticatedFetch().get('/tenants', {
        params: { expand: 'tenantUserRoles' },
      })

      expect(fetch).toHaveBeenCalledWith(
        `${window.location.origin}/api/v1/tenants?expand=tenantUserRoles`,
        expect.any(Object),
      )
    })
  })
})

describe('HTTP methods', () => {
  beforeEach(() => {
    currentAuthStore = createMockAuthStore({ user: null })
  })

  it('sends DELETE with no body', async () => {
    mockFetchResponse(null, { status: 204, contentType: null })

    await authenticatedFetch().delete('/tenants/1/users/2')

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'DELETE', body: undefined }),
    )
  })

  it('sends GET with no body', async () => {
    mockFetchResponse({ data: {} })

    await authenticatedFetch().get('/tenants/1')

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'GET', body: undefined }),
    )
  })

  it('sends PATCH with a JSON-serialised body', async () => {
    mockFetchResponse({ data: {} })

    await authenticatedFetch().patch('/tenants/1', { name: 'Updated' })

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated' }),
      }),
    )
  })

  it('sends POST with a JSON-serialised body', async () => {
    mockFetchResponse({ data: {} })

    await authenticatedFetch().post('/tenants', { name: 'Test' })

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
      }),
    )
  })

  it('sends PUT with a JSON-serialised body', async () => {
    mockFetchResponse({ data: {} })

    await authenticatedFetch().put('/tenants/1', { name: 'Updated' })

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated' }),
      }),
    )
  })
})

describe('response handling', () => {
  beforeEach(() => {
    currentAuthStore = createMockAuthStore({ user: null })
  })

  it('returns the parsed JSON body on success', async () => {
    const body = { data: { tenant: { id: '1', name: 'Test' } } }
    mockFetchResponse(body)

    const result = await authenticatedFetch().get('/tenants/1')

    expect(result).toEqual(body)
  })

  it('returns null when the response has no content-type', async () => {
    mockFetchResponse(null, { status: 204, contentType: null })

    const result = await authenticatedFetch().delete('/tenants/1/users/2')

    expect(result).toBeNull()
  })

  it('throws ApiError with status and body on a non-2xx response', async () => {
    const errorBody = { message: 'Not found' }
    mockFetchResponse(errorBody, { status: 404 })

    await expect(authenticatedFetch().get('/tenants/99')).rejects.toSatisfy(
      (error) =>
        error instanceof ApiError &&
        error.status === 404 &&
        error.data === errorBody,
    )
  })

  it('throws ApiError on HTTP 409', async () => {
    const errorBody = { message: 'Already exists' }
    mockFetchResponse(errorBody, { status: 409 })

    await expect(authenticatedFetch().post('/tenants', {})).rejects.toSatisfy(
      (error) => error instanceof ApiError && error.status === 409,
    )
  })

  it('throws ApiError on HTTP 400', async () => {
    const errorBody = { details: { body: [{ message: 'Name is required' }] } }
    mockFetchResponse(errorBody, { status: 400 })

    await expect(authenticatedFetch().post('/tenants', {})).rejects.toSatisfy(
      (error) => error instanceof ApiError && error.status === 400,
    )
  })

  it('throws ApiError with null data when the error body is malformed JSON', async () => {
    mockFetchMalformedJson(502)

    await expect(authenticatedFetch().get('/tenants/1')).rejects.toSatisfy(
      (error) =>
        error instanceof ApiError &&
        error.status === 502 &&
        error.data === null,
    )
  })

  it('throws ApiError with null data when the error body is not JSON', async () => {
    mockFetchResponse('<html>Bad Gateway</html>', {
      status: 502,
      contentType: 'text/html',
    })

    await expect(authenticatedFetch().get('/tenants/1')).rejects.toSatisfy(
      (error) =>
        error instanceof ApiError &&
        error.status === 502 &&
        error.data === null,
    )
  })

  it('rethrows unexpected errors as-is', async () => {
    mockFetchFailure(new Error('Network failure'))

    await expect(authenticatedFetch().get('/tenants/1')).rejects.toThrow(
      'Network failure',
    )
  })
})

describe('timeout', () => {
  beforeEach(() => {
    currentAuthStore = createMockAuthStore({ user: null })
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('aborts the request and throws after the configured timeout', async () => {
    const abortError = new DOMException(
      'The operation was aborted',
      'AbortError',
    )
    mockFetchFailure(abortError)

    const promise = authenticatedFetch(100).get('/tenants/1')
    vi.advanceTimersByTime(100)

    await expect(promise).rejects.toMatchObject({
      message: 'Request timed out after 100ms',
      cause: abortError,
    })
  })

  it('rethrows DOMExceptions that are not aborts', async () => {
    const other = new DOMException('Nope', 'NetworkError')
    mockFetchFailure(other)

    await expect(authenticatedFetch().get('/tenants/1')).rejects.toBe(other)
  })

  it('does not throw a timeout error when the request completes in time', async () => {
    mockFetchResponse({ data: {} })

    const promise = authenticatedFetch(100).get('/tenants/1')
    vi.advanceTimersByTime(50)

    await expect(promise).resolves.toBeDefined()
  })
})

describe('session expiry', () => {
  it('throws SessionExpiredError without calling the API when the session is already expired', async () => {
    currentAuthStore = createMockAuthStore({ isSessionExpired: true })
    mockFetchResponse({ data: {} })

    const promise = authenticatedFetch().get('/tenants/1')

    // Swallowed, so it never settles. Wait for the log, then check.
    await vi.waitFor(() => expect(logApiError).toHaveBeenCalled())

    expect(fetch).not.toHaveBeenCalled()
    expect(currentAuthStore.ensureFreshToken).not.toHaveBeenCalled()
    expect(logApiError).toHaveBeenCalledWith(
      'API request failed',
      expect.any(SessionExpiredError),
    )
    void promise
  })

  it('does not call the API when the token refresh expires the session', async () => {
    let expired = false
    currentAuthStore = createMockAuthStore({
      ensureFreshToken: vi.fn().mockImplementation(async () => {
        expired = true
      }),
    })
    Object.defineProperty(currentAuthStore, 'isSessionExpired', {
      configurable: true,
      get: () => expired,
    })
    mockFetchResponse({ data: {} })

    const promise = authenticatedFetch().get('/tenants/1')

    await vi.waitFor(() => expect(logApiError).toHaveBeenCalled())

    expect(currentAuthStore.ensureFreshToken).toHaveBeenCalledOnce()
    expect(fetch).not.toHaveBeenCalled()
    expect(logApiError).toHaveBeenCalledWith(
      'API request failed',
      expect.any(SessionExpiredError),
    )
    void promise
  })

  it('returns a promise that never settles for a session expiry', async () => {
    currentAuthStore = createMockAuthStore({ isSessionExpired: true })
    mockFetchResponse({ data: {} })

    let settled = false
    authenticatedFetch()
      .get('/tenants/1')
      .then(
        () => (settled = true),
        () => (settled = true),
      )

    await vi.waitFor(() => expect(logApiError).toHaveBeenCalled())
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(settled).toBe(false)
  })

  it('still sends the request when the session is valid after refresh', async () => {
    currentAuthStore = createMockAuthStore({
      getAccessToken: vi.fn().mockReturnValue('fresh-token'),
    })
    mockFetchResponse({ data: {} })

    await authenticatedFetch().get('/tenants/1')

    expect(fetch).toHaveBeenCalledOnce()
    expect(logApiError).not.toHaveBeenCalled()
  })
})
