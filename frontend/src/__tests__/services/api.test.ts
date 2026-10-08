import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockAuthStore } from '@/__tests__/__helpers__/useAuthStore.mock'

import { ApiError, authenticatedFetch } from '@/services/api'

let currentAuthStore = createMockAuthStore()

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => currentAuthStore,
}))

vi.mock('@/services/config.service', () => ({
  config: { api: { baseUrl: 'https://api.example.com' } },
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

  it('always includes content-type application/json', async () => {
    currentAuthStore = createMockAuthStore({ user: null })
    mockFetchResponse({ data: {} })

    await authenticatedFetch().get('/tenants/1')

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
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

  it('returns parsed JSON wrapped in { data } on success', async () => {
    const body = { data: { tenant: { id: '1', name: 'Test' } } }
    mockFetchResponse(body)

    const result = await authenticatedFetch().get('/tenants/1')

    expect(result).toEqual({ data: body })
  })

  it('returns { data: null } when the response has no content-type', async () => {
    mockFetchResponse(null, { status: 204, contentType: null })

    const result = await authenticatedFetch().delete('/tenants/1/users/2')

    expect(result).toEqual({ data: null })
  })

  it('throws ApiError with status and body on a non-2xx response', async () => {
    const errorBody = { message: 'Not found' }
    mockFetchResponse(errorBody, { status: 404 })

    await expect(authenticatedFetch().get('/tenants/99')).rejects.toSatisfy(
      (error) =>
        error instanceof ApiError &&
        error.status === 404 &&
        error.response.data === errorBody,
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
    mockFetchFailure(
      new DOMException('The operation was aborted', 'AbortError'),
    )

    const promise = authenticatedFetch(100).get('/tenants/1')
    vi.advanceTimersByTime(100)

    await expect(promise).rejects.toThrow('Request timed out after 100ms')
  })

  it('does not throw a timeout error when the request completes in time', async () => {
    mockFetchResponse({ data: {} })

    const promise = authenticatedFetch(100).get('/tenants/1')
    vi.advanceTimersByTime(50)

    await expect(promise).resolves.toBeDefined()
  })
})
