import { config } from '@/services/config.service'
import { useAuthStore } from '@/stores/useAuthStore'

export type ApiEnvelope<K extends string, T> = { data: Record<K, T> }

// Workaround for inconsistencies in the API response data structure.
export type ApiEnvelopeUnkeyed<T> = { data: T }

type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT'

interface RequestOptions {
  params?: Record<string, string>
}

interface FetchInstance {
  delete<T = unknown>(url: string): Promise<{ data: T }>
  get<T = unknown>(url: string, options?: RequestOptions): Promise<{ data: T }>
  patch<T = unknown>(url: string, body?: unknown): Promise<{ data: T }>
  post<T = unknown>(url: string, body?: unknown): Promise<{ data: T }>
  put<T = unknown>(url: string, body?: unknown): Promise<{ data: T }>
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly response: { data: Record<string, unknown> },
  ) {
    super(`API error: ${status}`)
    this.name = 'ApiError'
  }
}

async function buildHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const authStore = useAuthStore()
  if (authStore.isAuthenticated) {
    await authStore.ensureFreshToken()
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
): Promise<{ data: T }> {
  const url = new URL(`${config.api.baseUrl}${path}`)

  if (options?.params) {
    for (const [key, value] of Object.entries(options.params)) {
      url.searchParams.set(key, value)
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url.toString(), {
      method,
      headers: await buildHeaders(),
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })

    const data = response.headers
      .get('content-type')
      ?.includes('application/json')
      ? await response.json()
      : null

    if (!response.ok) {
      throw new ApiError(response.status, { data })
    }

    return { data }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`)
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Creates a typed fetch client with authentication and a configurable timeout.
 * Mirrors the Axios instance API surface consumed by services.
 *
 * @param [timeout=60000] Milliseconds before the request is aborted.
 * @returns A fetch-backed client with get / post / put / delete methods.
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
