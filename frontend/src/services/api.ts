import { SessionExpiredError } from '@/errors/SessionExpiredError'
import { config } from '@/services/config.service'
import { logApiError } from '@/services/utils'
import { useAuthStore } from '@/stores/useAuthStore'

export type ApiEnvelope<K extends string, T> = { data: Record<K, T> }

// Workaround type for inconsistencies in the API response data structure.
export type ApiEnvelopeUnkeyed<T> = { data: T }

type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT'

interface RequestOptions {
  params?: Record<string, string>
}

interface FetchInstance {
  delete<T = unknown>(url: string): Promise<T>
  get<T = unknown>(url: string, options?: RequestOptions): Promise<T>
  patch<T = unknown>(url: string, body?: unknown): Promise<T>
  post<T = unknown>(url: string, body?: unknown): Promise<T>
  put<T = unknown>(url: string, body?: unknown): Promise<T>
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly data: Record<string, unknown> | null,
  ) {
    super(`API error: ${status}`)
    this.name = 'ApiError'
  }
}

async function parseBody(response: Response): Promise<unknown> {
  if (!response.headers.get('content-type')?.includes('application/json')) {
    return null
  }

  try {
    return await response.json()
  } catch {
    return null
  }
}

async function buildHeaders(hasBody: boolean): Promise<HeadersInit> {
  const authStore = useAuthStore()

  // If the user session is already expired, do not make the request.
  if (authStore.isSessionExpired) {
    throw new SessionExpiredError()
  }

  const headers: Record<string, string> = {}

  if (hasBody) {
    headers['Content-Type'] = 'application/json'
  }

  if (authStore.isAuthenticated) {
    await authStore.ensureFreshToken()

    // If the refresh failed due to an expired refresh token, do not make the
    // request.
    if (authStore.isSessionExpired) {
      throw new SessionExpiredError()
    }

    headers['Authorization'] = `Bearer ${authStore.getAccessToken()}`
  }

  return headers
}

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  options?: RequestOptions,
  timeout = 60_000,
): Promise<T> {
  const url = new URL(`${config.api.baseUrl}${path}`, window.location.origin)

  if (options?.params) {
    for (const [key, value] of Object.entries(options.params)) {
      url.searchParams.set(key, value)
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url.toString(), {
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: await buildHeaders(body !== undefined),
      method,
      signal: controller.signal,
    })

    const data = await parseBody(response)

    if (!response.ok) {
      throw new ApiError(response.status, data as ApiError['data'])
    }

    return data as T
  } catch (error) {
    // Swallow session expiration, as the app handles it globally by redirecting
    // to the expired session page.
    if (error instanceof SessionExpiredError) {
      logApiError('API request failed', error)

      return new Promise<T>(() => {})
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`, { cause: error })
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Creates a typed fetch client with authentication, JSON handling, and a
 * configurable timeout. Methods resolve with the parsed response body and throw
 * ApiError on non-2xx responses.
 *
 * @param [timeout=60000] Milliseconds before the request is aborted.
 * @returns A client with delete / get / patch / post / put methods.
 */
export function authenticatedFetch(timeout = 60_000): FetchInstance {
  return {
    delete: (url) => request('DELETE', url, undefined, undefined, timeout),
    get: (url, options) => request('GET', url, undefined, options, timeout),
    patch: (url, body) => request('PATCH', url, body, undefined, timeout),
    post: (url, body) => request('POST', url, body, undefined, timeout),
    put: (url, body) => request('PUT', url, body, undefined, timeout),
  }
}
