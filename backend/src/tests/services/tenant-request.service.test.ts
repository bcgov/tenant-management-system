import { Request } from 'express'
import { EntityManager } from 'typeorm'
import { TenantRequestService } from '../../services/tenant-request.service'
import { tenantRequestRepository } from '../../repositories/tenant-request.repository'
import { connection } from '../../common/db.connection'
import logger from '../../common/logger'

jest.mock('../../repositories/tenant-request.repository')
jest.mock('../../common/logger')
jest.mock('../../common/db.connection', () => ({
  connection: {
    manager: {
      transaction: jest.fn(),
    },
  },
}))

const FAKE_TX = { marker: 'fake-tx' } as unknown as EntityManager

const mockRepository = tenantRequestRepository as jest.Mocked<
  typeof tenantRequestRepository
>
const mockTransaction = connection.manager.transaction as jest.Mock
const mockLoggerError = logger.error as jest.Mock

function asRequest(overrides: Partial<Request>): Request {
  return overrides as Request
}

describe('TenantRequestService', () => {
  let service: TenantRequestService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new TenantRequestService()
    mockTransaction.mockImplementation((callback: (tx: unknown) => unknown) =>
      callback(FAKE_TX),
    )
  })

  describe('createTenantRequest', () => {
    const req = asRequest({
      body: {
        name: 'Roads Initiative',
        ministryName: 'Ministry of Natural Resources',
        description: 'Tenant for roads',
      },
      decodedJwt: {
        idir_user_guid: 'sso-1',
        given_name: 'John',
        family_name: 'Smith',
        display_name: 'John Smith',
        idir_username: 'jsmith',
        email: 'john@gov.bc.ca',
      },
      idpType: 'idir',
    })

    it('maps the JWT user and threads the transaction manager', async () => {
      const saved = { id: 'tr-1', requestedBy: { displayName: 'John Smith' } }
      mockRepository.saveTenantRequest.mockResolvedValue(saved as never)

      const result = await service.createTenantRequest(req)

      expect(mockTransaction).toHaveBeenCalledTimes(1)
      expect(mockRepository.saveTenantRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Roads Initiative',
          ministryName: 'Ministry of Natural Resources',
          description: 'Tenant for roads',
          user: expect.objectContaining({
            ssoUserId: 'sso-1',
            firstName: 'John',
            lastName: 'Smith',
            displayName: 'John Smith',
          }),
        }),
        FAKE_TX,
      )
      expect(result).toEqual({
        data: { tenantRequest: { id: 'tr-1', requestedBy: 'John Smith' } },
      })
    })

    it('falls back to the request body user when no JWT identity is present', async () => {
      mockRepository.saveTenantRequest.mockResolvedValue({
        id: 'tr-1',
      } as never)
      const bodyOnlyReq = asRequest({
        body: {
          name: 'X',
          ministryName: 'Y',
          user: {
            ssoUserId: 'body-sso',
            firstName: 'Body',
            lastName: 'User',
            displayName: 'Body User',
          },
        },
      })

      await service.createTenantRequest(bodyOnlyReq)

      expect(mockRepository.saveTenantRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({ ssoUserId: 'body-sso' }),
        }),
        FAKE_TX,
      )
    })

    it('logs and rethrows on transaction failure', async () => {
      const error = new Error('db down')
      mockRepository.saveTenantRequest.mockRejectedValue(error)

      await expect(service.createTenantRequest(req)).rejects.toThrow(error)
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Create tenant request transaction failure - rolling back inserts ',
        { error: 'db down' },
      )
    })
  })

  describe('updateTenantRequestStatus', () => {
    const req = asRequest({
      params: { requestId: 'tr-1' },
      body: { status: 'REJECTED', rejectionReason: 'Not enough information' },
      decodedJwt: {
        idir_user_guid: 'admin-1',
        given_name: 'Admin',
        family_name: 'User',
      },
      idpType: 'idir',
    })

    it('maps the request and threads the transaction manager', async () => {
      const response = {
        tenantRequest: {
          id: 'tr-1',
          status: 'REJECTED',
          requestedBy: { displayName: 'Jane Doe' },
          decisionedBy: { displayName: 'Admin User' },
        },
      }
      mockRepository.updateTenantRequestStatus.mockResolvedValue(
        response as never,
      )

      const result = await service.updateTenantRequestStatus(req)

      expect(mockRepository.updateTenantRequestStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'tr-1',
          status: 'REJECTED',
          rejectionReason: 'Not enough information',
          updatedBy: 'admin-1',
          decisionedByUser: expect.objectContaining({ ssoUserId: 'admin-1' }),
        }),
        FAKE_TX,
      )
      expect(result.data.tenantRequest.requestedBy).toBe('Jane Doe')
      expect(result.data.tenantRequest.decisionedBy).toBe('Admin User')
      expect(result.data.tenant).toBeUndefined()
    })

    it('includes tenant in the response when the request was approved', async () => {
      const response = {
        tenantRequest: { id: 'tr-1', status: 'APPROVED' },
        tenant: {
          id: 'tenant-1',
          name: 'Roads Initiative',
          ministryName: 'Ministry of Natural Resources',
          createdBy: 'sso-1',
          updatedBy: 'sso-1',
        },
      }
      mockRepository.updateTenantRequestStatus.mockResolvedValue(
        response as never,
      )

      const result = await service.updateTenantRequestStatus(req)

      expect(result.data.tenant).toEqual(response.tenant)
    })

    it('logs and rethrows on transaction failure', async () => {
      const error = new Error('db down')
      mockRepository.updateTenantRequestStatus.mockRejectedValue(error)

      await expect(service.updateTenantRequestStatus(req)).rejects.toThrow(
        error,
      )
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Update tenant request status transaction failure - rolling back changes',
        { error: 'db down' },
      )
    })
  })

  describe('getTenantRequests', () => {
    it('formats display names and does not open a transaction', async () => {
      mockRepository.getTenantRequests.mockResolvedValue([
        {
          requestedBy: { displayName: 'Jane Doe' },
          decisionedBy: { displayName: 'Admin User' },
        },
      ] as never)

      const result = await service.getTenantRequests(
        asRequest({ query: { status: 'NEW' } }),
      )

      expect(mockRepository.getTenantRequests).toHaveBeenCalledWith({
        status: 'NEW',
      })
      expect(mockTransaction).not.toHaveBeenCalled()
      expect(result.data.tenantRequests[0]).toEqual(
        expect.objectContaining({
          createdBy: 'Jane Doe',
          requestedBy: 'Jane Doe',
          decisionedBy: 'Admin User',
        }),
      )
    })

    it('defaults createdBy to system when there is no requester', async () => {
      mockRepository.getTenantRequests.mockResolvedValue([
        { requestedBy: undefined, decisionedBy: undefined },
      ] as never)

      const result = await service.getTenantRequests(asRequest({ query: {} }))

      expect(result.data.tenantRequests[0].createdBy).toBe('system')
    })
  })

  describe('getUserTenantRequests', () => {
    it('filters by NEW status and the given ssoUserId', async () => {
      mockRepository.getTenantRequests.mockResolvedValue([] as never)

      await service.getUserTenantRequests(
        asRequest({ params: { ssoUserId: 'sso-1' } }),
      )

      expect(mockRepository.getTenantRequests).toHaveBeenCalledWith({
        status: 'NEW',
        ssoUserId: 'sso-1',
      })
    })
  })
})
