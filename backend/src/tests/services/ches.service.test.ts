import { ChesService } from '../../services/ches.service'
import { config } from '../../services/config.service'

const TOKEN_URL = 'https://token.example/token'
const EMAIL_URL = 'https://ches.example/api/v1/email'
const EMAIL = { to: ['a@gov.bc.ca'], subject: 's', body: 'b' }

type Reply = Error | { status?: number; body: unknown }

let fetchMock: jest.SpiedFunction<typeof fetch>

async function toResponse(reply: Reply) {
  if (reply instanceof Error) {
    throw reply
  }
  return new Response(JSON.stringify(reply.body), {
    status: reply.status ?? 200,
  })
}

function mockChes(replies: { token?: Reply; email?: Reply }) {
  const token = replies.token ?? {
    body: { access_token: 'token-1', expires_in: 300 },
  }
  const email = replies.email ?? {
    body: { messages: [{ msgId: 'msg-1' }], txId: 'tx-1' },
  }
  fetchMock.mockImplementation((input) =>
    toResponse(input.toString() === TOKEN_URL ? token : email),
  )
}

const callsTo = (url: string) =>
  fetchMock.mock.calls.filter(([input]) => input.toString() === url)

describe('ChesService', () => {
  let service: ChesService

  beforeEach(() => {
    jest.clearAllMocks()
    fetchMock = jest.spyOn(global, 'fetch')
    service = new ChesService()
    config.ches = {
      adminNotificationEmail: 'cstar.admin@gov.bc.ca',
      apiUrl: EMAIL_URL,
      clientId: 'client',
      clientSecret: 'secret',
      tokenUrl: TOKEN_URL,
    }
  })

  afterEach(() => {
    fetchMock.mockRestore()
  })

  it('reports configured only when every CHES setting is present', () => {
    expect(service.isConfigured()).toBe(true)

    config.ches.clientSecret = undefined

    expect(service.isConfigured()).toBe(false)
  })

  it('asks for the token with the client credentials', async () => {
    mockChes({})

    await service.sendEmail(EMAIL)

    const [, init] = callsTo(TOKEN_URL)[0]
    const body = init?.body as URLSearchParams
    expect(init?.method).toBe('POST')
    expect(body.get('grant_type')).toBe('client_credentials')
    expect(body.get('client_id')).toBe('client')
  })

  it('tells CHES the body is plain text', async () => {
    mockChes({})

    await service.sendEmail(EMAIL)

    const [, init] = callsTo(EMAIL_URL)[0]
    expect(init?.method).toBe('POST')
    expect(init?.headers).toEqual({
      Accept: 'application/json',
      Authorization: 'Bearer token-1',
      'Content-Type': 'application/json',
    })
    expect(JSON.parse(init?.body as string)).toEqual(
      expect.objectContaining({ bodyType: 'text', to: ['a@gov.bc.ca'] }),
    )
  })

  it('returns the CHES message and transaction ids', async () => {
    mockChes({})

    const result = await service.sendEmail({
      to: ['cstar.admin@gov.bc.ca'],
      subject: 'New CSTAR tenant request: My Tenant',
      body: '<p>hello</p>',
    })

    expect(result).toEqual({ msgId: 'msg-1', txId: 'tx-1' })
  })

  it('returns empty ids when CHES sends back no details', async () => {
    mockChes({ email: { body: {} } })

    const result = await service.sendEmail(EMAIL)

    expect(result).toEqual({ msgId: undefined, txId: undefined })
  })

  it('reuses a cached token instead of fetching one per email', async () => {
    mockChes({})

    await service.sendEmail(EMAIL)
    await service.sendEmail(EMAIL)

    expect(callsTo(TOKEN_URL)).toHaveLength(1)
    expect(callsTo(EMAIL_URL)).toHaveLength(2)
  })

  it('fetches a new token every time when CHES gives no expiry', async () => {
    mockChes({ token: { body: { access_token: 'token-1' } } })

    await service.sendEmail(EMAIL)
    await service.sendEmail(EMAIL)

    expect(callsTo(TOKEN_URL)).toHaveLength(2)
  })

  it('sends the email with a bounded timeout so it cannot stall the request', async () => {
    mockChes({})

    await service.sendEmail(EMAIL)

    const [, init] = callsTo(EMAIL_URL)[0]
    expect(init?.signal).toBeInstanceOf(AbortSignal)
  })

  it('reports a clear error when the token cannot be obtained', async () => {
    mockChes({ token: new Error('bad credentials') })

    await expect(service.sendEmail(EMAIL)).rejects.toThrow(
      'Failed to obtain CHES access token: bad credentials',
    )
  })

  it('reports a clear error when CHES refuses the token request', async () => {
    mockChes({ token: { status: 401, body: { error: 'invalid_client' } } })

    await expect(service.sendEmail(EMAIL)).rejects.toThrow(
      'Failed to obtain CHES access token: Request failed with status code 401',
    )
  })

  it('fails when CHES rejects the email', async () => {
    mockChes({ email: { status: 422, body: { detail: 'bad address' } } })

    await expect(service.sendEmail(EMAIL)).rejects.toThrow(
      'Request failed with status code 422',
    )
  })
})
