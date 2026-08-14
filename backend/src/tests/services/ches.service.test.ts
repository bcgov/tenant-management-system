import axios from 'axios'
import { ChesService } from '../../services/ches.service'
import { config } from '../../services/config.service'

jest.mock('axios')

const mockAxios = axios as jest.Mocked<typeof axios>

describe('ChesService', () => {
  let service: ChesService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new ChesService()
    config.ches = {
      adminNotificationEmail: 'cstar.admin@gov.bc.ca',
      apiUrl: 'https://ches.example/api/v1/email',
      clientId: 'client',
      clientSecret: 'secret',
      tokenUrl: 'https://token.example/token',
    }
  })

  function mockTokenThenSend() {
    mockAxios.post
      .mockResolvedValueOnce({
        data: { access_token: 'token-1', expires_in: 300 },
      })
      .mockResolvedValueOnce({
        data: { messages: [{ msgId: 'msg-1' }], txId: 'tx-1' },
      })
  }

  it('reports configured only when every CHES setting is present', () => {
    expect(service.isConfigured()).toBe(true)

    config.ches.clientSecret = undefined

    expect(service.isConfigured()).toBe(false)
  })

  it('tells CHES the body is plain text', async () => {
    mockTokenThenSend()

    await service.sendEmail({ to: ['a@gov.bc.ca'], subject: 's', body: 'b' })

    expect(mockAxios.post.mock.calls[1][1]).toEqual(
      expect.objectContaining({ bodyType: 'text' }),
    )
  })

  it('returns the CHES message and transaction ids', async () => {
    mockTokenThenSend()

    const result = await service.sendEmail({
      to: ['cstar.admin@gov.bc.ca'],
      subject: 'New CSTAR tenant request: My Tenant',
      body: '<p>hello</p>',
    })

    expect(result).toEqual({ msgId: 'msg-1', txId: 'tx-1' })
  })

  it('reuses a cached token instead of fetching one per email', async () => {
    mockTokenThenSend()
    mockAxios.post.mockResolvedValue({
      data: { messages: [{ msgId: 'msg-2' }], txId: 'tx-2' },
    })

    await service.sendEmail({ to: ['a@gov.bc.ca'], subject: 's', body: 'b' })
    await service.sendEmail({ to: ['a@gov.bc.ca'], subject: 's', body: 'b' })

    const tokenCalls = mockAxios.post.mock.calls.filter(
      (call) => call[0] === 'https://token.example/token',
    )

    expect(tokenCalls).toHaveLength(1)
  })

  it('sends the email with a bounded timeout so it cannot stall the request', async () => {
    mockTokenThenSend()

    await service.sendEmail({ to: ['a@gov.bc.ca'], subject: 's', body: 'b' })

    const sendCall = mockAxios.post.mock.calls[1]

    expect(sendCall[2]).toEqual(
      expect.objectContaining({ timeout: expect.any(Number) }),
    )
    expect((sendCall[2] as { timeout: number }).timeout).toBeLessThanOrEqual(
      5000,
    )
  })

  it('reports a clear error when the token cannot be obtained', async () => {
    mockAxios.post.mockRejectedValueOnce(new Error('bad credentials'))

    await expect(
      service.sendEmail({ to: ['a@gov.bc.ca'], subject: 's', body: 'b' }),
    ).rejects.toThrow('Failed to obtain CHES access token: bad credentials')
  })
})
