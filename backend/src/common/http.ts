export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`Request failed with status code ${status}`)
  }

  get apiMessage(): string | undefined {
    if (!this.body || typeof this.body !== 'object') {
      return undefined
    }
    const message = (this.body as { message?: unknown }).message
    return typeof message === 'string' ? message : undefined
  }
}

export interface JsonRequest {
  method?: string
  headers?: Record<string, string>
  body?: URLSearchParams | string
  timeoutMs?: number
}

const readBody = async (response: Response) => {
  const text = await response.text()
  if (!text) {
    return null
  }
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

export const requestJson = async (url: string, request: JsonRequest = {}) => {
  const response = await fetch(url, {
    method: request.method,
    headers: { Accept: 'application/json', ...request.headers },
    body: request.body,
    signal: request.timeoutMs
      ? AbortSignal.timeout(request.timeoutMs)
      : undefined,
  })
  const body = await readBody(response)
  if (!response.ok) {
    throw new HttpError(response.status, body)
  }
  return body
}
