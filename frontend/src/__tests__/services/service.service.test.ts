import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  makeGroupService,
  makeGroupServiceApiData,
  makeGroupServiceRole,
  makeServiceApiData,
  makeServiceDetailFields,
  makeServiceRole,
  makeServiceRoleApiData,
} from '@/__tests__/__factories__'

import { toGroupId } from '@/models/group.model'
import { toGroupServiceId } from '@/models/groupservice.model'
import { toServiceId } from '@/models/service.model'
import { toTenantId } from '@/models/tenant.model'
import * as utils from '@/services/utils'

vi.mock('@/services/utils', () => ({
  isDuplicateEntityError: vi.fn(),
  isValidationError: vi.fn(),
  logApiError: vi.fn(),
}))

const mockedUtils = vi.mocked(utils)

mockedUtils.isDuplicateEntityError.mockReturnValue(false)
mockedUtils.isValidationError.mockReturnValue(false)
mockedUtils.logApiError.mockImplementation(() => {})

const { mockGet, mockPost, mockPut } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
}))

vi.mock('@/services/authenticated.axios', () => ({
  authenticatedAxios: () => ({
    get: mockGet,
    post: mockPost,
    put: mockPut,
  }),
}))

import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import { ValidationError } from '@/errors/domain/ValidationError'
import { serviceService } from '@/services/service.service'
import { toServiceRoleId } from '@/models/servicerole.model'
import { toGroupServiceRoleId } from '@/models/groupservicerole.model'

describe('serviceService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('addServiceToTenant', () => {
    it('should correctly call the api', async () => {
      mockPost.mockResolvedValueOnce({ data: { data: {} } })

      await serviceService.addServiceToTenant(
        toTenantId('tenantId'),
        toServiceId('serviceId'),
      )

      expect(mockPost).toHaveBeenCalledWith(
        '/tenants/tenantId/shared-services',
        {
          sharedServiceId: 'serviceId',
        },
      )
    })

    it('should correctly return no data', async () => {
      mockPost.mockResolvedValueOnce({ data: { data: {} } })

      const result = await serviceService.addServiceToTenant(
        toTenantId('tenantId'),
        toServiceId('serviceId'),
      )

      expect(result).toEqual({})
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('Failed to add service to tenant')
      mockPost.mockRejectedValueOnce(error)

      await expect(
        serviceService.addServiceToTenant(
          toTenantId('tenantId'),
          toServiceId('serviceId'),
        ),
      ).rejects.toThrow(error)
    })
  })

  describe('createService', () => {
    it('should correctly call the api', async () => {
      const serviceDetailFields = makeServiceDetailFields({
        clientIdentifier: 'serviceClientIdentifier',
        description: 'serviceDescription',
        displayName: 'serviceDisplayName',
        landingPageUrl: 'serviceLandingPageUrl',
        name: 'serviceName',
        roles: [
          makeServiceRole({
            description: 'serviceRoleDescription',
            identityProviders: ['serviceRoleIdentityProvider'],
            name: 'serviceRoleName',
          }),
        ],
      })
      mockPost.mockResolvedValueOnce({ data: { data: {} } })

      await serviceService.createService(serviceDetailFields)

      expect(mockPost).toHaveBeenCalledWith('/shared-services', {
        clientIdentifier: 'serviceClientIdentifier',
        description: 'serviceDescription',
        displayName: 'serviceDisplayName',
        landingPageUrl: 'serviceLandingPageUrl',
        name: 'serviceName',
        roles: [
          {
            allowedIdentityProviders: ['serviceRoleIdentityProvider'],
            description: 'serviceRoleDescription',
            name: 'serviceRoleName',
          },
        ],
      })
    })

    it('should correctly return data', async () => {
      const serviceApiData = makeServiceApiData({
        clientIdentifier: 'serviceClientIdentifier',
        createdDateTime: 'serviceCreatedDateTime',
        description: 'serviceDescription',
        displayName: 'serviceDisplayName',
        id: toServiceId('serviceId'),
        landingPageUrl: 'serviceLandingPageUrl',
        name: 'serviceName',
        roles: [
          makeServiceRoleApiData({
            allowedIdentityProviders: ['serviceRoleAllowedIdentityProvider'],
            createdBy: 'serviceRoleCreatedBy',
            createdDateTime: 'serviceRoleCreatedDateTime',
            description: 'serviceRoleDescription',
            id: toServiceRoleId('serviceRoleId'),
            isDeleted: false,
            name: 'serviceRoleName',
          }),
        ],
        updatedDateTime: 'serviceUpdatedDateTime',
      })
      mockPost.mockResolvedValueOnce({
        data: { data: { sharedService: serviceApiData } },
      })

      const result = await serviceService.createService(
        makeServiceDetailFields(),
      )

      expect(result.clientIdentifier).toBe('serviceClientIdentifier')
      expect(result.createdDateTime).toBe('serviceCreatedDateTime')
      expect(result.description).toBe('serviceDescription')
      expect(result.displayName).toBe('serviceDisplayName')
      expect(result.id).toBe('serviceId')
      expect(result.landingPageUrl).toBe('serviceLandingPageUrl')
      expect(result.name).toBe('serviceName')
      expect(result.roles).toHaveLength(1)
      expect(result.roles[0].allowedIdentityProviders).toHaveLength(1)
      expect(result.roles[0].allowedIdentityProviders[0]).toBe(
        'serviceRoleAllowedIdentityProvider',
      )
      expect(result.roles[0].createdBy).toBe('serviceRoleCreatedBy')
      expect(result.roles[0].createdDateTime).toBe('serviceRoleCreatedDateTime')
      expect(result.roles[0].description).toBe('serviceRoleDescription')
      expect(result.roles[0].id).toBe('serviceRoleId')
      expect(result.roles[0].isDeleted).toBe(false)
      expect(result.roles[0].name).toBe('serviceRoleName')
      expect(result.updatedDateTime).toBe('serviceUpdatedDateTime')
    })

    it('should throw DuplicateEntityError on HTTP 409', async () => {
      const error = {
        isAxiosError: true,
        response: {
          data: { message: 'Group already exists' },
          status: 409,
        },
      }
      mockPost.mockRejectedValueOnce(error)
      mockedUtils.isDuplicateEntityError.mockReturnValueOnce(true)

      await expect(
        serviceService.createService(makeServiceDetailFields()),
      ).rejects.toBeInstanceOf(DuplicateEntityError)
    })

    it('should throw ValidationError on HTTP 400 with validation errors', async () => {
      const error = {
        isAxiosError: true,
        response: {
          data: { details: { body: [{ message: 'Name is required' }] } },
          status: 400,
        },
      }
      mockPost.mockRejectedValueOnce(error)
      mockedUtils.isValidationError.mockReturnValueOnce(true)

      await expect(
        serviceService.createService(makeServiceDetailFields()),
      ).rejects.toBeInstanceOf(ValidationError)
    })

    it('should log and rethrow unknown errors', async () => {
      const genericError = new Error('Something went wrong')
      mockPost.mockRejectedValueOnce(genericError)

      await expect(
        serviceService.createService(makeServiceDetailFields()),
      ).rejects.toThrow(genericError)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error creating service',
        genericError,
      )
    })
  })

  describe('getServices', () => {
    it('should correctly call the api', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: {} } })

      await serviceService.getServices()

      expect(mockGet).toHaveBeenCalledWith('/shared-services')
    })

    it('should correctly return data', async () => {
      const serviceApiData = makeServiceApiData({
        clientIdentifier: 'serviceClientIdentifier',
        createdDateTime: 'serviceCreatedDateTime',
        description: 'serviceDescription',
        displayName: 'serviceDisplayName',
        id: toServiceId('serviceId'),
        landingPageUrl: 'serviceLandingPageUrl',
        name: 'serviceName',
        roles: [
          makeServiceRoleApiData({
            allowedIdentityProviders: ['serviceRoleAllowedIdentityProvider'],
            createdBy: 'serviceRoleCreatedBy',
            createdDateTime: 'serviceRoleCreatedDateTime',
            description: 'serviceRoleDescription',
            id: toServiceRoleId('serviceRoleId'),
            isDeleted: false,
            name: 'serviceRoleName',
          }),
        ],
        updatedDateTime: 'serviceUpdatedDateTime',
      })
      mockGet.mockResolvedValueOnce({
        data: { data: { sharedServices: [serviceApiData] } },
      })

      const result = await serviceService.getServices()

      expect(result).toHaveLength(1)
      expect(result[0].clientIdentifier).toBe('serviceClientIdentifier')
      expect(result[0].createdDateTime).toBe('serviceCreatedDateTime')
      expect(result[0].description).toBe('serviceDescription')
      expect(result[0].displayName).toBe('serviceDisplayName')
      expect(result[0].id).toBe('serviceId')
      expect(result[0].landingPageUrl).toBe('serviceLandingPageUrl')
      expect(result[0].name).toBe('serviceName')
      expect(result[0].roles).toHaveLength(1)
      expect(result[0].roles[0].allowedIdentityProviders).toHaveLength(1)
      expect(result[0].roles[0].allowedIdentityProviders).toEqual([
        'serviceRoleAllowedIdentityProvider',
      ])
      expect(result[0].roles[0].createdBy).toBe('serviceRoleCreatedBy')
      expect(result[0].roles[0].createdDateTime).toBe(
        'serviceRoleCreatedDateTime',
      )
      expect(result[0].roles[0].description).toBe('serviceRoleDescription')
      expect(result[0].roles[0].id).toBe('serviceRoleId')
      expect(result[0].roles[0].isDeleted).toBe(false)
      expect(result[0].roles[0].name).toBe('serviceRoleName')
      expect(result[0].updatedDateTime).toBe('serviceUpdatedDateTime')
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('Failed to fetch connected services')
      mockGet.mockRejectedValueOnce(error)

      await expect(serviceService.getServices()).rejects.toThrow(error)
    })
  })

  describe('getTenantGroupServices', () => {
    it('should correctly call the api', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: {} } })

      await serviceService.getTenantGroupServices(
        toTenantId('tenantId'),
        toGroupId('groupId'),
      )

      expect(mockGet).toHaveBeenCalledWith(
        '/tenants/tenantId/groups/groupId/shared-services/shared-service-roles',
      )
    })

    it('should correctly return data', async () => {
      const groupServiceApiData = makeGroupServiceApiData({
        clientIdentifier: 'groupServiceClientIdentifier',
        description: 'groupServiceDescription',
        displayName: 'groupServiceDisplayName',
        id: toGroupServiceId('groupServiceId'),
        sharedServiceRoles: [],
      })
      mockGet.mockResolvedValueOnce({
        data: { data: { sharedServices: [groupServiceApiData] } },
      })

      const result = await serviceService.getTenantGroupServices(
        toTenantId('tenantId'),
        toGroupId('groupId'),
      )

      expect(result).toHaveLength(1)
      expect(result[0].clientIdentifier).toBe('groupServiceClientIdentifier')
      expect(result[0].description).toBe('groupServiceDescription')
      expect(result[0].displayName).toBe('groupServiceDisplayName')
      expect(result[0].id).toBe('groupServiceId')
      expect(result[0].sharedServiceRoles).toHaveLength(0)
    })

    it('should return empty array when tenant has no services', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: { sharedServices: [] } } })

      const result = await serviceService.getTenantGroupServices(
        toTenantId('tenantId'),
        toGroupId('groupId'),
      )

      expect(result).toEqual([])
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('Failed to fetch tenant services')
      mockGet.mockRejectedValueOnce(error)

      await expect(
        serviceService.getTenantGroupServices(
          toTenantId('tenantId'),
          toGroupId('groupId'),
        ),
      ).rejects.toThrow(error)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error getting tenant group services',
        error,
      )
    })
  })

  describe('getTenantServices', () => {
    it('should correctly call the api', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: {} } })

      await serviceService.getTenantServices(toTenantId('tenantId'))

      expect(mockGet).toHaveBeenCalledWith('/tenants/tenantId/shared-services')
    })

    it('should correctly return data', async () => {
      const serviceApiData = makeServiceApiData({
        clientIdentifier: 'serviceClientIdentifier',
        createdDateTime: 'serviceCreatedDateTime',
        description: 'serviceDescription',
        displayName: 'serviceDisplayName',
        id: toServiceId('serviceId'),
        landingPageUrl: 'serviceLandingPageUrl',
        name: 'serviceName',
        roles: [makeServiceRoleApiData()],
        updatedDateTime: 'serviceUpdatedDateTime',
      })
      mockGet.mockResolvedValueOnce({
        data: { data: { sharedServices: [serviceApiData] } },
      })

      const result = await serviceService.getTenantServices(
        toTenantId('tenantId'),
      )

      expect(result).toHaveLength(1)
      expect(result[0].clientIdentifier).toBe('serviceClientIdentifier')
      expect(result[0].createdDateTime).toBe('serviceCreatedDateTime')
      expect(result[0].description).toBe('serviceDescription')
      expect(result[0].displayName).toBe('serviceDisplayName')
      expect(result[0].id).toBe('serviceId')
      expect(result[0].landingPageUrl).toBe('serviceLandingPageUrl')
      expect(result[0].name).toBe('serviceName')
      expect(result[0].roles).toHaveLength(1)
      expect(result[0].updatedDateTime).toBe('serviceUpdatedDateTime')
    })

    it('should return empty array when tenant has no services', async () => {
      mockGet.mockResolvedValueOnce({
        data: { data: { sharedServices: [] } },
      })

      const result = await serviceService.getTenantServices(
        toTenantId('tenantId'),
      )

      expect(result).toEqual([])
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('Failed to fetch tenant services')
      mockGet.mockRejectedValueOnce(error)

      await expect(
        serviceService.getTenantServices(toTenantId('tenantId')),
      ).rejects.toThrow(error)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error getting tenant services',
        error,
      )
    })
  })

  describe('updateTenantGroupServices', () => {
    it('should correctly call the api', async () => {
      const groupService = makeGroupService({
        clientIdentifier: 'groupServiceClientIdentifier',
        description: 'groupServiceDescription',
        displayName: 'groupServiceDisplayName',
        id: toGroupServiceId('groupServiceId'),
        roles: [
          makeGroupServiceRole({
            description: 'groupServiceRoleDescription',
            id: toGroupServiceRoleId('groupServiceRoleId'),
            identityProviders: ['groupServiceRoleIdentityProvider'],
            isEnabled: true,
            name: 'groupServiceRoleName',
          }),
        ],
      })
      mockPut.mockResolvedValueOnce({ data: { data: {} } })

      await serviceService.updateTenantGroupServiceRoles(
        toTenantId('tenantId'),
        toGroupId('groupId'),
        [groupService],
      )

      expect(mockPut).toHaveBeenCalledWith(
        '/tenants/tenantId/groups/groupId/shared-services/shared-service-roles',
        {
          sharedServices: [
            {
              id: 'groupServiceId',
              sharedServiceRoles: [
                {
                  enabled: true,
                  id: 'groupServiceRoleId',
                },
              ],
            },
          ],
        },
      )
    })

    it('should correctly return data', async () => {
      const serviceApiData = makeServiceApiData({
        clientIdentifier: 'serviceClientIdentifier',
        createdDateTime: 'serviceCreatedDateTime',
        description: 'serviceDescription',
        displayName: 'serviceDisplayName',
        id: toServiceId('serviceId'),
        landingPageUrl: 'serviceLandingPageUrl',
        name: 'serviceName',
        roles: [
          makeServiceRoleApiData({
            allowedIdentityProviders: ['serviceRoleAllowedIdentityProvider'],
            createdBy: 'serviceRoleCreatedBy',
            createdDateTime: 'serviceRoleCreatedDateTime',
            description: 'serviceRoleDescription',
            id: toServiceRoleId('serviceRoleId'),
            isDeleted: false,
            name: 'serviceRoleName',
          }),
        ],
        updatedDateTime: 'serviceUpdatedDateTime',
      })
      mockPut.mockResolvedValueOnce({
        data: { data: [serviceApiData] },
      })

      const result = await serviceService.updateTenantGroupServiceRoles(
        toTenantId('tenantId'),
        toGroupId('groupId'),
        [makeGroupService()],
      )

      expect(result).toHaveLength(1)
      expect(result[0].clientIdentifier).toBe('serviceClientIdentifier')
      expect(result[0].createdDateTime).toBe('serviceCreatedDateTime')
      expect(result[0].description).toBe('serviceDescription')
      expect(result[0].displayName).toBe('serviceDisplayName')
      expect(result[0].id).toBe('serviceId')
      expect(result[0].landingPageUrl).toBe('serviceLandingPageUrl')
      expect(result[0].name).toBe('serviceName')
      expect(result[0].roles).toHaveLength(1)
      expect(result[0].roles[0].allowedIdentityProviders).toEqual([
        'serviceRoleAllowedIdentityProvider',
      ])
      expect(result[0].roles[0].createdBy).toBe('serviceRoleCreatedBy')
      expect(result[0].roles[0].createdDateTime).toBe(
        'serviceRoleCreatedDateTime',
      )
      expect(result[0].roles[0].description).toBe('serviceRoleDescription')
      expect(result[0].roles[0].id).toBe('serviceRoleId')
      expect(result[0].roles[0].isDeleted).toBe(false)
      expect(result[0].roles[0].name).toBe('serviceRoleName')
      expect(result[0].updatedDateTime).toBe('serviceUpdatedDateTime')
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('Failed to fetch tenant services')
      mockPut.mockRejectedValueOnce(error)

      await expect(
        serviceService.updateTenantGroupServiceRoles(
          toTenantId('tenantId'),
          toGroupId('groupId'),
          [makeGroupService()],
        ),
      ).rejects.toThrow(error)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error updating tenant group service roles',
        error,
      )
    })
  })
})
