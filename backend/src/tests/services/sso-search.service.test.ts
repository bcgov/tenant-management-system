import { Request } from 'express'
import { SSOSearchService } from '../../services/sso-search.service'
import { BadRequestError } from '../../errors/BadRequestError'
import { config } from '../../services/config.service'

function asRequest(query: Record<string, unknown>): Request {
  return { query } as unknown as Request
}

const IDIR_URL = 'http://localhost/sso/dev/idir/users'
const AZURE_IDIR_URL = 'http://localhost/sso/dev/azure-idir/users'

type Reply = Error | { status?: number; body?: unknown; text?: string }

const ok = (body: unknown): Reply => ({ body })

const LAST_NAME = "O'Laney"
let fetchMock: jest.SpiedFunction<typeof fetch>

async function toResponse(reply: Reply) {
  if (reply instanceof Error) {
    throw reply
  }
  const text = reply.text ?? JSON.stringify(reply.body)
  return new Response(text, { status: reply.status ?? 200 })
}

function mockSso(replies: {
  token?: Reply
  azure?: Reply
  idir?: Reply
  bceid?: Reply
}) {
  const token = replies.token ?? ok({ access_token: 'mock-access-token' })
  fetchMock.mockImplementation((input) => {
    const url = input.toString()
    if (url === config.bcgovSsoApi.tokenUrl) {
      return toResponse(token)
    }
    if (url.startsWith(AZURE_IDIR_URL)) {
      return toResponse(replies.azure ?? ok({ data: [] }))
    }
    if (url.startsWith(config.bcgovSsoApi.urlBceid)) {
      return toResponse(replies.bceid ?? ok({ data: [] }))
    }
    return toResponse(replies.idir ?? ok({ data: [] }))
  })
}

const searchCalls = () =>
  fetchMock.mock.calls.filter(([url]) => url !== config.bcgovSsoApi.tokenUrl)

describe('SSOSearchService', () => {
  let service: SSOSearchService

  beforeEach(() => {
    jest.clearAllMocks()
    fetchMock = jest.spyOn(global, 'fetch')
    service = new SSOSearchService()
  })

  afterEach(() => {
    fetchMock.mockRestore()
  })

  describe('searchBCGOVSSOUsers', () => {
    const originalUrl = config.bcgovSsoApi.url

    beforeEach(() => {
      config.bcgovSsoApi.url = IDIR_URL
    })

    afterAll(() => {
      config.bcgovSsoApi.url = originalUrl
    })

    it('fetches a token then searches and returns the raw payload', async () => {
      const mockSearchResults = {
        data: [
          {
            guid: 'F45AFBBD68C51D6F956BA3A1DE1878A1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@gov.bc.ca',
          },
        ],
      }
      mockSso({ idir: ok(mockSearchResults) })

      const result = await service.searchBCGOVSSOUsers(
        asRequest({ email: 'john.doe@gov.bc.ca' }),
      )

      expect(fetchMock).toHaveBeenCalledWith(
        `${IDIR_URL}?email=john.doe%40gov.bc.ca`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: 'Bearer mock-access-token',
          },
        },
      )
      expect(result).toEqual(mockSearchResults)
    })

    it('asks for the token with the client credentials', async () => {
      mockSso({})

      await service.searchBCGOVSSOUsers(asRequest({ email: 'a@gov.bc.ca' }))

      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toBe(config.bcgovSsoApi.tokenUrl)
      expect(init?.method).toBe('POST')
      expect(init?.headers).toEqual({
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      })
      const body = init?.body as URLSearchParams
      expect(body.get('grant_type')).toBe('client_credentials')
      expect(body.get('client_id')).toBe(config.bcgovSsoApi.clientId)
    })

    it('sends every value of a repeated search field and skips empty ones', async () => {
      mockSso({})

      await service.searchBCGOVSSOUsers(
        asRequest({ lastName: ['Doe', 'Smith'], firstName: undefined }),
      )

      expect(searchCalls().map(([url]) => url)).toContain(
        `${IDIR_URL}?lastName=Doe&lastName=Smith`,
      )
    })

    it('deduplicates IDIR users by guid, keeping the most complete record', async () => {
      const mockSearchResults = {
        data: [
          {
            firstName: 'John',
            lastName: '',
            email: '',
            username: 'guid-1@idir',
            attributes: {
              idir_user_guid: ['GUID-1'],
              idir_username: ['JDOE'],
              display_name: ['Doe, John'],
            },
          },
          {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@gov.bc.ca',
            username: 'guid-1@idir',
            attributes: {
              idir_user_guid: ['GUID-1'],
              idir_username: ['JDOE'],
              display_name: ['Doe, John'],
            },
          },
          {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@gov.bc.ca',
            username: 'guid-2@idir',
            attributes: {
              idir_user_guid: ['GUID-2'],
              idir_username: ['JSMITH'],
              display_name: ['Smith, Jane'],
            },
          },
        ],
      }
      mockSso({ idir: ok(mockSearchResults) })

      const result = await service.searchBCGOVSSOUsers(
        asRequest({ email: 'john.doe@gov.bc.ca' }),
      )

      expect(result).toEqual({
        data: [mockSearchResults.data[1], mockSearchResults.data[2]],
      })
    })

    it('passes through users without a guid unchanged', async () => {
      const mockSearchResults = {
        data: [{ firstName: 'No', lastName: 'Guid' }],
      }
      mockSso({ idir: ok(mockSearchResults) })

      const result = await service.searchBCGOVSSOUsers(asRequest({}))

      expect(result).toEqual(mockSearchResults)
    })

    describe('searching both IDIR and Azure IDIR', () => {
      const idirUser = (guid: string, suffix: string, extra = {}) => ({
        firstName: 'Brendon',
        lastName: LAST_NAME,
        email: 'brendon.olaney@gov.bc.ca',
        username: `${guid.toLowerCase()}@${suffix}`,
        attributes: {
          idir_user_guid: [guid],
          idir_username: ['BOLANEY'],
          display_name: ["O'Laney, Brendon CITZ:EX"],
          ...extra,
        },
      })

      it('searches both directories with the same search', async () => {
        mockSso({})

        await service.searchBCGOVSSOUsers(asRequest({ lastName: LAST_NAME }))

        expect(searchCalls().map(([url]) => url)).toEqual([
          `${AZURE_IDIR_URL}?lastName=O%27Laney`,
          `${IDIR_URL}?lastName=O%27Laney`,
        ])
      })

      it('returns users who only exist in Azure IDIR', async () => {
        const azureOnly = idirUser('GUID-AZURE', 'azureidir')
        mockSso({ azure: ok({ data: [azureOnly] }) })

        const result = await service.searchBCGOVSSOUsers(
          asRequest({ lastName: LAST_NAME }),
        )

        expect(result).toEqual({ data: [azureOnly] })
      })

      it('returns one entry for a user found in both, keeping the Azure IDIR record', async () => {
        const azureRecord = idirUser('GUID-1', 'azureidir', {
          user_principal_name: ['Brendon.OLaney@gov.bc.ca'],
        })
        const idirRecord = idirUser('GUID-1', 'idir')
        const idirOnly = { ...idirUser('GUID-2', 'idir'), firstName: 'Anton' }
        mockSso({
          azure: ok({ data: [azureRecord] }),
          idir: ok({ data: [idirRecord, idirOnly] }),
        })

        const result = await service.searchBCGOVSSOUsers(
          asRequest({ lastName: LAST_NAME }),
        )

        expect(result).toEqual({ data: [azureRecord, idirOnly] })
      })

      it('still returns IDIR results when the Azure IDIR search fails', async () => {
        const idirRecord = idirUser('GUID-1', 'idir')
        mockSso({
          azure: { status: 503, text: 'Service Unavailable' },
          idir: ok({ data: [idirRecord] }),
        })

        const result = await service.searchBCGOVSSOUsers(
          asRequest({ lastName: LAST_NAME }),
        )

        expect(result).toEqual({ data: [idirRecord] })
      })

      it('still returns Azure IDIR results when the IDIR search fails', async () => {
        const azureRecord = idirUser('GUID-1', 'azureidir')
        mockSso({
          azure: ok({ data: [azureRecord] }),
          idir: new Error('idir down'),
        })

        const result = await service.searchBCGOVSSOUsers(
          asRequest({ lastName: LAST_NAME }),
        )

        expect(result).toEqual({ data: [azureRecord] })
      })

      it('ignores a directory that sends back an empty reply', async () => {
        const idirRecord = idirUser('GUID-1', 'idir')
        mockSso({
          azure: { text: '' },
          idir: ok({ data: [idirRecord] }),
        })

        const result = await service.searchBCGOVSSOUsers(
          asRequest({ lastName: LAST_NAME }),
        )

        expect(result).toEqual({ data: [idirRecord] })
      })

      it('only searches IDIR when the Azure IDIR address cannot be worked out', async () => {
        config.bcgovSsoApi.url = 'http://localhost/sso'
        mockSso({})

        await service.searchBCGOVSSOUsers(asRequest({ lastName: LAST_NAME }))

        expect(searchCalls().map(([url]) => url)).toEqual([
          'http://localhost/sso?lastName=O%27Laney',
        ])
      })
    })

    it('throws BadRequestError with the API message when the BC Gov SSO API returns a 400', async () => {
      const badRequest = {
        status: 400,
        body: { message: 'Invalid search parameters' },
      }
      mockSso({ azure: badRequest, idir: badRequest })

      const search = service.searchBCGOVSSOUsers(
        asRequest({ email: 'invalid@email' }),
      )

      await expect(search).rejects.toThrow(BadRequestError)
      await expect(search).rejects.toThrow(
        'BC GOV SSO API returned bad request: Invalid search parameters',
      )
    })

    it('throws BadRequestError with the status when a 400 has no message', async () => {
      const badRequest = { status: 400, text: 'Bad Request' }
      mockSso({ azure: badRequest, idir: badRequest })

      await expect(
        service.searchBCGOVSSOUsers(asRequest({ email: 'invalid@email' })),
      ).rejects.toThrow(
        'BC GOV SSO API returned bad request: Request failed with status code 400',
      )
    })

    it('throws a generic error for non-400 API failures', async () => {
      mockSso({
        azure: new Error('network down'),
        idir: new Error('network down'),
      })

      await expect(
        service.searchBCGOVSSOUsers(asRequest({ email: 'test@gov.bc.ca' })),
      ).rejects.toThrow('Error invoking BC GOV SSO API')
    })

    it('propagates a token-fetch failure', async () => {
      mockSso({ token: new Error('token endpoint down') })

      await expect(
        service.searchBCGOVSSOUsers(asRequest({ email: 'test@gov.bc.ca' })),
      ).rejects.toThrow('Failed to obtain access token: token endpoint down')
    })

    it('treats a refused token request as a generic failure', async () => {
      mockSso({ token: { status: 401, body: { error: 'invalid_client' } } })

      await expect(
        service.searchBCGOVSSOUsers(asRequest({ email: 'test@gov.bc.ca' })),
      ).rejects.toThrow(
        'Error invoking BC GOV SSO API. Failed to obtain access token: Request failed with status code 401',
      )
    })
  })

  describe('searchBCGOVSSOBceidUsers', () => {
    it('forces bceidType to business, filters, and returns the payload', async () => {
      const mockSearchResults = {
        data: [
          {
            firstName: 'Business',
            lastName: 'User',
            username: 'business.user@bceidbusiness',
            attributes: {
              bceid_user_guid: ['GUID-1'],
              bceid_username: ['BUSINESSUSER'],
              display_name: ['Business User'],
              bceid_business_guid: ['BUSINESS-GUID-1'],
            },
          },
        ],
      }
      mockSso({ bceid: ok(mockSearchResults) })

      const result = await service.searchBCGOVSSOBceidUsers(
        asRequest({ bceidType: 'both', username: 'business.user' }),
      )

      expect(searchCalls().map(([url]) => url)).toEqual([
        `${config.bcgovSsoApi.urlBceid}?bceidType=business&username=business.user`,
      ])
      expect(result).toEqual(mockSearchResults)
    })

    it('filters out users without a business guid', async () => {
      const mockSearchResults = {
        data: [
          {
            firstName: 'Basic',
            lastName: 'User',
            username: 'basic.user@bceidboth',
            attributes: {
              bceid_user_guid: ['BASIC-GUID-1'],
              bceid_username: ['BASICUSER'],
              display_name: ['Basic User'],
            },
          },
          {
            firstName: 'Business',
            lastName: 'User',
            username: 'business.user@bceidboth',
            attributes: {
              bceid_user_guid: ['BUSINESS-USER-GUID-1'],
              bceid_username: ['BUSINESSUSER'],
              display_name: ['Business User'],
              bceid_business_guid: ['BUSINESS-GUID-1'],
            },
          },
        ],
      }
      mockSso({ bceid: ok(mockSearchResults) })

      const result = await service.searchBCGOVSSOBceidUsers(
        asRequest({ bceidType: 'both', username: 'business.user' }),
      )

      expect(result).toEqual({ data: [mockSearchResults.data[1]] })
    })

    it('deduplicates BCEID users by guid, keeping the most complete record', async () => {
      const mockSearchResults = {
        data: [
          {
            firstName: 'Master',
            lastName: '',
            username: 'guid-1@bceidbusiness',
            attributes: {
              bceid_user_guid: ['GUID-1'],
              bceid_username: ['USER1'],
              display_name: ['Master Chief'],
              bceid_business_guid: ['BUSINESS-GUID-1'],
            },
          },
          {
            firstName: 'Master',
            lastName: 'Chief',
            username: 'guid-1@bceidbusiness',
            attributes: {
              bceid_user_guid: ['GUID-1'],
              bceid_username: ['USER1'],
              display_name: ['Master Chief'],
              bceid_business_guid: ['BUSINESS-GUID-1'],
            },
          },
          {
            firstName: 'Jane',
            lastName: 'Smith',
            username: 'guid-2@bceidbusiness',
            attributes: {
              bceid_user_guid: ['GUID-2'],
              bceid_username: ['USER2'],
              display_name: ['Jane Smith'],
              bceid_business_guid: ['BUSINESS-GUID-2'],
            },
          },
        ],
      }
      mockSso({ bceid: ok(mockSearchResults) })

      const result = await service.searchBCGOVSSOBceidUsers(
        asRequest({ bceidType: 'business', username: 'user1' }),
      )

      expect(result).toEqual({
        data: [mockSearchResults.data[1], mockSearchResults.data[2]],
      })
    })

    it('throws BadRequestError when the BC Gov SSO BCEID API returns a 400', async () => {
      mockSso({
        bceid: { status: 400, body: { message: 'Invalid search parameters' } },
      })

      await expect(
        service.searchBCGOVSSOBceidUsers(
          asRequest({ bceidType: 'business', guid: 'invalid' }),
        ),
      ).rejects.toThrow(
        'BC GOV SSO BCEID API returned bad request: Invalid search parameters',
      )
    })

    it('throws a generic error for non-400 API failures', async () => {
      mockSso({ bceid: new Error('network down') })

      await expect(
        service.searchBCGOVSSOBceidUsers(
          asRequest({ bceidType: 'business', guid: 'F123' }),
        ),
      ).rejects.toThrow('Error invoking BC GOV SSO BCEID API')
    })
  })
})
