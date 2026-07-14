import axios from 'axios'
import { Request } from 'express'
import { SSOSearchService } from '../../services/sso-search.service'
import { BadRequestError } from '../../errors/BadRequestError'

jest.mock('axios')

const mockedAxios = axios as jest.Mocked<typeof axios>

function asRequest(query: Record<string, unknown>): Request {
  return { query } as unknown as Request
}

describe('SSOSearchService', () => {
  let service: SSOSearchService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new SSOSearchService()
  })

  describe('searchBCGOVSSOUsers', () => {
    it('fetches a token then searches and returns the raw payload', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { access_token: 'mock-access-token' },
      })
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
      mockedAxios.get.mockResolvedValue({ data: mockSearchResults })

      const result = await service.searchBCGOVSSOUsers(
        asRequest({ email: 'john.doe@gov.bc.ca' }),
      )

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { Authorization: 'Bearer mock-access-token' },
          params: { email: 'john.doe@gov.bc.ca' },
        }),
      )
      expect(result).toEqual(mockSearchResults)
    })

    it('deduplicates IDIR users by guid, keeping the most complete record', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { access_token: 'mock-access-token' },
      })
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
      mockedAxios.get.mockResolvedValue({ data: mockSearchResults })

      const result = await service.searchBCGOVSSOUsers(
        asRequest({ email: 'john.doe@gov.bc.ca' }),
      )

      expect(result).toEqual({
        data: [mockSearchResults.data[1], mockSearchResults.data[2]],
      })
    })

    it('passes through users without a guid unchanged', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { access_token: 'mock-access-token' },
      })
      const mockSearchResults = {
        data: [{ firstName: 'No', lastName: 'Guid' }],
      }
      mockedAxios.get.mockResolvedValue({ data: mockSearchResults })

      const result = await service.searchBCGOVSSOUsers(asRequest({}))

      expect(result).toEqual(mockSearchResults)
    })

    it('throws BadRequestError when the BC Gov SSO API returns a 400', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { access_token: 'mock-access-token' },
      })
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Invalid search parameters' },
        },
      })

      await expect(
        service.searchBCGOVSSOUsers(asRequest({ email: 'invalid@email' })),
      ).rejects.toThrow(BadRequestError)
    })

    it('throws a generic error for non-400 API failures', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { access_token: 'mock-access-token' },
      })
      mockedAxios.get.mockRejectedValue(new Error('network down'))

      await expect(
        service.searchBCGOVSSOUsers(asRequest({ email: 'test@gov.bc.ca' })),
      ).rejects.toThrow('Error invoking BC GOV SSO API')
    })

    it('propagates a token-fetch failure', async () => {
      mockedAxios.post.mockRejectedValue(new Error('token endpoint down'))

      await expect(
        service.searchBCGOVSSOUsers(asRequest({ email: 'test@gov.bc.ca' })),
      ).rejects.toThrow('Error invoking BC GOV SSO API')
    })
  })

  describe('searchBCGOVSSOBceidUsers', () => {
    it('forces bceidType to business, filters, and returns the payload', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { access_token: 'mock-access-token' },
      })
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
      mockedAxios.get.mockResolvedValue({ data: mockSearchResults })

      const result = await service.searchBCGOVSSOBceidUsers(
        asRequest({ bceidType: 'both', username: 'business.user' }),
      )

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: { bceidType: 'business', username: 'business.user' },
        }),
      )
      expect(result).toEqual(mockSearchResults)
    })

    it('filters out users without a business guid', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { access_token: 'mock-access-token' },
      })
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
      mockedAxios.get.mockResolvedValue({ data: mockSearchResults })

      const result = await service.searchBCGOVSSOBceidUsers(
        asRequest({ bceidType: 'both', username: 'business.user' }),
      )

      expect(result).toEqual({ data: [mockSearchResults.data[1]] })
    })

    it('deduplicates BCEID users by guid, keeping the most complete record', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { access_token: 'mock-access-token' },
      })
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
      mockedAxios.get.mockResolvedValue({ data: mockSearchResults })

      const result = await service.searchBCGOVSSOBceidUsers(
        asRequest({ bceidType: 'business', username: 'user1' }),
      )

      expect(result).toEqual({
        data: [mockSearchResults.data[1], mockSearchResults.data[2]],
      })
    })

    it('throws BadRequestError when the BC Gov SSO BCEID API returns a 400', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { access_token: 'mock-access-token' },
      })
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Invalid search parameters' },
        },
      })

      await expect(
        service.searchBCGOVSSOBceidUsers(
          asRequest({ bceidType: 'business', guid: 'invalid' }),
        ),
      ).rejects.toThrow(BadRequestError)
    })

    it('throws a generic error for non-400 API failures', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { access_token: 'mock-access-token' },
      })
      mockedAxios.get.mockRejectedValue(new Error('network down'))

      await expect(
        service.searchBCGOVSSOBceidUsers(
          asRequest({ bceidType: 'business', guid: 'F123' }),
        ),
      ).rejects.toThrow('Error invoking BC GOV SSO BCEID API')
    })
  })
})
