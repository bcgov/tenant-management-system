import { Request } from 'express'
import { EntityManager } from 'typeorm'
import { SharedServiceService } from '../../services/shared-service.service'
import { sharedServiceRepository } from '../../repositories/shared-service.repository'
import { connection } from '../../common/db.connection'
import logger from '../../common/logger'

jest.mock('../../repositories/shared-service.repository')
jest.mock('../../common/logger')
jest.mock('../../common/db.connection', () => ({
  connection: {
    manager: {
      transaction: jest.fn(),
    },
  },
}))

const FAKE_TX = { marker: 'fake-tx' } as unknown as EntityManager

const mockRepository = sharedServiceRepository as jest.Mocked<
  typeof sharedServiceRepository
>
const mockTransaction = connection.manager.transaction as jest.Mock
const mockLoggerError = logger.error as jest.Mock

function asRequest(overrides: Partial<Request>): Request {
  return overrides as Request
}

describe('SharedServiceService', () => {
  let service: SharedServiceService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new SharedServiceService()
    mockTransaction.mockImplementation((callback: (tx: unknown) => unknown) =>
      callback(FAKE_TX),
    )
  })

  describe('createSharedService', () => {
    const req = asRequest({
      body: {
        name: 'Test Service',
        displayName: 'Test Service Display',
        clientIdentifier: 'test-client',
        landingPageUrl: 'https://example.gov.bc.ca',
        description: 'Description',
        isActive: true,
        roles: [{ name: 'Admin' }],
      },
      decodedJwt: { idir_user_guid: 'user-1' },
    })

    it('maps the request body and threads the transaction manager', async () => {
      const savedSharedService = { id: 'ss-1' }
      mockRepository.saveSharedService.mockResolvedValue(
        savedSharedService as never,
      )

      const result = await service.createSharedService(req)

      expect(mockTransaction).toHaveBeenCalledTimes(1)
      expect(mockRepository.saveSharedService).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Service',
          displayName: 'Test Service Display',
          clientIdentifier: 'test-client',
          landingPageUrl: 'https://example.gov.bc.ca',
          description: 'Description',
          isActive: true,
          roles: [{ name: 'Admin' }],
          updatedBy: 'user-1',
        }),
        FAKE_TX,
      )
      expect(result).toEqual({ data: { sharedService: savedSharedService } })
    })

    it('defaults updatedBy to system when no JWT user is present', async () => {
      mockRepository.saveSharedService.mockResolvedValue({
        id: 'ss-1',
      } as never)

      await service.createSharedService(asRequest({ body: req.body }))

      expect(mockRepository.saveSharedService).toHaveBeenCalledWith(
        expect.objectContaining({ updatedBy: 'system' }),
        FAKE_TX,
      )
    })

    it('logs and rethrows on transaction failure', async () => {
      const error = new Error('db down')
      mockRepository.saveSharedService.mockRejectedValue(error)

      await expect(service.createSharedService(req)).rejects.toThrow(error)
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Create shared service transaction failure - rolling back inserts ',
        { error: 'db down' },
      )
    })
  })

  describe('updateSharedService', () => {
    const req = asRequest({
      params: { sharedServiceId: 'ss-1' },
      body: { name: 'Updated Name' },
      decodedJwt: { idir_user_guid: 'user-1' },
    })

    it('maps the request and threads the transaction manager', async () => {
      const updated = { id: 'ss-1', name: 'Updated Name' }
      mockRepository.updateSharedService.mockResolvedValue(updated as never)

      const result = await service.updateSharedService(req)

      expect(mockRepository.updateSharedService).toHaveBeenCalledWith(
        expect.objectContaining({
          sharedServiceId: 'ss-1',
          name: 'Updated Name',
          updatedBy: 'user-1',
        }),
        FAKE_TX,
      )
      expect(result).toEqual({ data: { sharedService: updated } })
    })

    it('does not log on failure', async () => {
      mockRepository.updateSharedService.mockRejectedValue(new Error('boom'))

      await expect(service.updateSharedService(req)).rejects.toThrow('boom')
      expect(mockLoggerError).not.toHaveBeenCalled()
    })
  })

  describe('addSharedServiceRoles', () => {
    const req = asRequest({
      params: { sharedServiceId: 'ss-1' },
      body: { roles: [{ name: 'New Role' }] },
      decodedJwt: { idir_user_guid: 'user-1' },
    })

    it('maps the request and threads the transaction manager', async () => {
      const updated = { id: 'ss-1' }
      mockRepository.addSharedServiceRoles.mockResolvedValue(updated as never)

      const result = await service.addSharedServiceRoles(req)

      expect(mockRepository.addSharedServiceRoles).toHaveBeenCalledWith(
        expect.objectContaining({
          sharedServiceId: 'ss-1',
          roles: [{ name: 'New Role' }],
          updatedBy: 'user-1',
        }),
        FAKE_TX,
      )
      expect(result).toEqual({ data: { sharedService: updated } })
    })

    it('does not log on failure', async () => {
      mockRepository.addSharedServiceRoles.mockRejectedValue(new Error('boom'))

      await expect(service.addSharedServiceRoles(req)).rejects.toThrow('boom')
      expect(mockLoggerError).not.toHaveBeenCalled()
    })
  })

  describe('updateSharedServiceRole', () => {
    const req = asRequest({
      params: { sharedServiceId: 'ss-1', sharedServiceRoleId: 'role-1' },
      body: { name: 'Updated Role', allowedIdentityProviders: ['idir'] },
      decodedJwt: { idir_user_guid: 'user-1' },
    })

    it('maps the request and threads the transaction manager', async () => {
      const updated = { id: 'ss-1' }
      mockRepository.updateSharedServiceRole.mockResolvedValue(updated as never)

      const result = await service.updateSharedServiceRole(req)

      expect(mockRepository.updateSharedServiceRole).toHaveBeenCalledWith(
        expect.objectContaining({
          sharedServiceId: 'ss-1',
          sharedServiceRoleId: 'role-1',
          name: 'Updated Role',
          allowedIdentityProviders: ['idir'],
          updatedBy: 'user-1',
        }),
        FAKE_TX,
      )
      expect(result).toEqual({ data: { sharedService: updated } })
    })

    it('does not log on failure', async () => {
      mockRepository.updateSharedServiceRole.mockRejectedValue(
        new Error('boom'),
      )

      await expect(service.updateSharedServiceRole(req)).rejects.toThrow('boom')
      expect(mockLoggerError).not.toHaveBeenCalled()
    })
  })

  describe('updateSharedServiceStatus', () => {
    const req = asRequest({
      params: { sharedServiceId: 'ss-1' },
      body: { isActive: false },
      decodedJwt: { idir_user_guid: 'user-1' },
    })

    it('maps the request and threads the transaction manager', async () => {
      const updated = { id: 'ss-1', isActive: false }
      mockRepository.updateSharedServiceStatus.mockResolvedValue(
        updated as never,
      )

      const result = await service.updateSharedServiceStatus(req)

      expect(mockRepository.updateSharedServiceStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          sharedServiceId: 'ss-1',
          isActive: false,
          updatedBy: 'user-1',
        }),
        FAKE_TX,
      )
      expect(result).toEqual({ data: { sharedService: updated } })
    })

    it('does not log on failure', async () => {
      mockRepository.updateSharedServiceStatus.mockRejectedValue(
        new Error('boom'),
      )

      await expect(service.updateSharedServiceStatus(req)).rejects.toThrow(
        'boom',
      )
      expect(mockLoggerError).not.toHaveBeenCalled()
    })
  })

  describe('associateSharedServiceToTenant', () => {
    const req = asRequest({
      params: { tenantId: 'tenant-1' },
      body: { sharedServiceId: 'ss-1' },
      decodedJwt: { idir_user_guid: 'user-1' },
    })

    it('maps the request and threads the transaction manager', async () => {
      mockRepository.associateSharedServiceToTenant.mockResolvedValue(undefined)

      const result = await service.associateSharedServiceToTenant(req)

      expect(
        mockRepository.associateSharedServiceToTenant,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-1',
          sharedServiceId: 'ss-1',
          updatedBy: 'user-1',
        }),
        FAKE_TX,
      )
      expect(result).toBeUndefined()
    })

    it('logs and rethrows on transaction failure', async () => {
      const error = new Error('db down')
      mockRepository.associateSharedServiceToTenant.mockRejectedValue(error)

      await expect(service.associateSharedServiceToTenant(req)).rejects.toThrow(
        error,
      )
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Associate shared service to tenant transaction failure - rolling back inserts',
        { error: 'db down' },
      )
    })
  })

  describe('getAllActiveSharedServices', () => {
    it('returns the wrapped list without opening a transaction', async () => {
      mockRepository.getAllActiveSharedServices.mockResolvedValue([
        { id: 'ss-1' },
      ] as never)

      const result = await service.getAllActiveSharedServices()

      expect(mockTransaction).not.toHaveBeenCalled()
      expect(result).toEqual({ data: { sharedServices: [{ id: 'ss-1' }] } })
    })

    it('returns an empty array when there are none', async () => {
      mockRepository.getAllActiveSharedServices.mockResolvedValue([])

      const result = await service.getAllActiveSharedServices()

      expect(result).toEqual({ data: { sharedServices: [] } })
    })
  })

  describe('getSharedServicesForTenant', () => {
    const req = asRequest({ params: { tenantId: 'tenant-1' } })

    it('returns the wrapped list without opening a transaction', async () => {
      mockRepository.getSharedServicesForTenant.mockResolvedValue([
        { id: 'ss-1' },
      ] as never)

      const result = await service.getSharedServicesForTenant(req)

      expect(mockRepository.getSharedServicesForTenant).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
      })
      expect(mockTransaction).not.toHaveBeenCalled()
      expect(result).toEqual({ data: { sharedServices: [{ id: 'ss-1' }] } })
    })

    it('returns an empty array when the tenant has none', async () => {
      mockRepository.getSharedServicesForTenant.mockResolvedValue([])

      const result = await service.getSharedServicesForTenant(req)

      expect(result).toEqual({ data: { sharedServices: [] } })
    })
  })
})
