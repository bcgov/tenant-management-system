import request from 'supertest'
import express, { type ErrorRequestHandler } from 'express'
import axios from 'axios'
import { TMSRepository } from '../repositories/tms.repository'
import { groupRepository } from '../repositories/group.repository'
import { TMSConstants } from '../common/tms.constants'
import { TMSController } from '../controllers/tms.controller'
import { validate } from 'express-validation'
import validator from '../common/tms.validator'
import { ConflictError } from '../errors/ConflictError'
import type { Tenant } from '../entities/Tenant'
import { NotFoundError } from '../errors/NotFoundError'
import { BadRequestError } from '../errors/BadRequestError'

jest.mock('../repositories/tms.repository')
jest.mock('../repositories/group.repository')
jest.mock('../common/db.connection', () => ({
  connection: {
    manager: {
      transaction: jest.fn().mockImplementation((callback) => callback()),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    },
  },
}))

type AddTenantUsersResult = Awaited<ReturnType<TMSRepository['addTenantUsers']>>
type GetTenantsForUserResult = Awaited<
  ReturnType<TMSRepository['getTenantsForUser']>
>
type GetTenantResult = Awaited<ReturnType<TMSRepository['getTenant']>>
type GetUserRolesResult = Awaited<ReturnType<TMSRepository['getUserRoles']>>
type GetTenantUserGroupsResult = Awaited<
  ReturnType<typeof groupRepository.getTenantUserGroups>
>
type GetTenantUserSharedServiceRolesResult = Awaited<
  ReturnType<typeof groupRepository.getTenantUserSharedServiceRoles>
>
type AssignUserRolesForUserResult = Awaited<
  ReturnType<TMSRepository['assignUserRolesForUser']>
>

describe('Tenant API', () => {
  let app: express.Application
  let mockTMSRepository: jest.Mocked<TMSRepository>
  let mockGroupRepository: jest.Mocked<typeof groupRepository>
  let tmsController: TMSController

  beforeEach(() => {
    jest.clearAllMocks()
    app = express()
    app.use(express.json())

    tmsController = new TMSController()
    mockTMSRepository = TMSRepository.prototype as jest.Mocked<TMSRepository>
    mockGroupRepository = groupRepository as jest.Mocked<typeof groupRepository>

    app.post(
      '/v1/tenants',
      (req, res, next) => {
        req.decodedJwt = {
          aud: 'test-service-client',
          audience: 'test-service-client',
          idir_user_guid: 'F45AFBBD68C51D6F956BA3A1DE1878A2',
          client_roles: ['TMS.OPERATIONS_ADMIN'],
        }
        next()
      },
      (req, res, next) => {
        const roles = req.decodedJwt?.client_roles || []
        if (!roles.includes('TMS.OPERATIONS_ADMIN')) {
          return res.status(403).json({
            errorMessage: 'Forbidden',
            httpResponseCode: 403,
            message: 'Access denied: User does not have required role',
            name: 'User does not have access to this operation and / resource',
          })
        }
        next()
      },
      validate(validator.createTenant, {}, {}),
      (req, res) => tmsController.createTenant(req, res),
    )

    app.post(
      '/v1/tenants/:tenantId/users',
      validate(validator.addTenantUser, {}, {}),
      (req, res) => tmsController.addTenantUser(req, res),
    )

    app.get(
      '/v1/users/:ssoUserId/tenants',
      validate(validator.getUserTenants, {}, {}),
      (req, res) => tmsController.getTenantsForUser(req, res),
    )

    app.get(
      '/v1/tenants/:tenantId/users',
      validate(validator.getTenantUsers, {}, {}),
      (req, res) => tmsController.getUsersForTenant(req, res),
    )

    app.post(
      '/v1/tenants/:tenantId/users/:tenantUserId/roles',
      validate(validator.assignUserRoles, {}, {}),
      (req, res) => tmsController.assignUserRoles(req, res),
    )

    app.delete(
      '/v1/tenants/:tenantId/users/:tenantUserId/roles/:roleId',
      validate(validator.unassignUserRoles, {}, {}),
      (req, res) => tmsController.unassignUserRoles(req, res),
    )

    const validationErrorHandler: ErrorRequestHandler = (
      err,
      req,
      res,
      next,
    ) => {
      if (
        err &&
        typeof err === 'object' &&
        'name' in err &&
        (err as { name: string }).name === 'ValidationError'
      ) {
        return res.status((err as { statusCode: number }).statusCode).json(err)
      }
      next(err)
    }
    app.use(validationErrorHandler)
  })

  const validTenantData = {
    name: 'Test Tenant',
    ministryName: 'Test Ministry',
    description: 'Test Description',
    user: {
      firstName: 'Test',
      lastName: 'User',
      displayName: 'Test User',
      ssoUserId: 'F45AFBBD68C51D6F956BA3A1DE1878A1',
      email: 'test@testministry.gov.bc.ca',
      idpType: 'idir',
    },
  }

  describe('POST /v1/tenants', () => {
    it('should create a tenant successfully', async () => {
      const mockTenant = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: validTenantData.name,
        ministryName: validTenantData.ministryName,
        description: validTenantData.description,
        tenantUsers: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            firstName: validTenantData.user.firstName,
            lastName: validTenantData.user.lastName,
            displayName: validTenantData.user.displayName,
            ssoUserId: validTenantData.user.ssoUserId,
            email: validTenantData.user.email,
            tenantUserRoles: [
              {
                role: {
                  id: '123e4567-e89b-12d3-a456-426614174002',
                  name: TMSConstants.TENANT_OWNER,
                  description: 'Tenant Owner Role',
                },
              },
            ],
          },
        ],
      }

      mockTMSRepository.saveTenant.mockResolvedValue(
        mockTenant as unknown as Tenant,
      )

      const response = await request(app)
        .post('/v1/tenants')
        .send(validTenantData)

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        data: {
          tenant: {
            id: mockTenant.id,
            name: mockTenant.name,
            ministryName: mockTenant.ministryName,
            description: mockTenant.description,
          },
        },
      })

      expect(mockTMSRepository.saveTenant).toHaveBeenCalledWith(
        expect.objectContaining({
          name: validTenantData.name,
          ministryName: validTenantData.ministryName,
          description: validTenantData.description,
          user: validTenantData.user,
        }),
      )

      const actualCall = mockTMSRepository.saveTenant.mock.calls[0][0]
      expect(actualCall).toEqual(
        expect.objectContaining({
          name: validTenantData.name,
          ministryName: validTenantData.ministryName,
          description: validTenantData.description,
          user: validTenantData.user,
        }),
      )
    })

    it('should fail when tenant name and ministry name combination already exists', async () => {
      const errorMessage = `A tenant with name '${validTenantData.name}' and ministry name '${validTenantData.ministryName}' already exists`
      mockTMSRepository.saveTenant.mockRejectedValue(
        new ConflictError(errorMessage),
      )

      const response = await request(app)
        .post('/v1/tenants')
        .send(validTenantData)

      expect(response.status).toBe(409)
      expect(response.body).toMatchObject({
        errorMessage: 'Conflict',
        httpResponseCode: 409,
        message: errorMessage,
        name: 'Error occurred during tenant creation',
      })
    })

    it('should return 400 when user idpType is missing', async () => {
      const invalidData = {
        ...validTenantData,
        user: {
          ...validTenantData.user,
          idpType: undefined,
        },
      }

      const response = await request(app).post('/v1/tenants').send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Validation Failed')
    })

    it('should return 400 when ministry name is missing', async () => {
      const invalidData = {
        name: validTenantData.name,
        user: validTenantData.user,
      }

      const response = await request(app).post('/v1/tenants').send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Validation Failed')
      expect(response.body.details.body[0].message).toBe(
        '"ministryName" is required',
      )
    })

    it('should return 403 when user does not have operations admin role', async () => {
      const appWithoutOpsAdmin = express()
      appWithoutOpsAdmin.use(express.json())

      appWithoutOpsAdmin.post(
        '/v1/tenants',
        (req, res, next) => {
          req.decodedJwt = {
            aud: 'test-service-client',
            audience: 'test-service-client',
            idir_user_guid: 'F45AFBBD68C51D6F956BA3A1DE1878A2',
            client_roles: ['TMS.USER_ADMIN'], // Different role, not operations admin
          }
          next()
        },
        (req, res, next) => {
          const roles = req.decodedJwt?.client_roles || []
          if (!roles.includes('TMS.OPERATIONS_ADMIN')) {
            return res.status(403).json({
              errorMessage: 'Forbidden',
              httpResponseCode: 403,
              message: 'Access denied: User does not have required role',
              name: 'User does not have access to this operation and / resource',
            })
          }
          next()
        },
        validate(validator.createTenant, {}, {}),
        (req, res) => tmsController.createTenant(req, res),
      )

      const response = await request(appWithoutOpsAdmin)
        .post('/v1/tenants')
        .send(validTenantData)

      expect(response.status).toBe(403)
      expect(response.body).toMatchObject({
        errorMessage: 'Forbidden',
        httpResponseCode: 403,
        message: 'Access denied: User does not have required role',
        name: 'User does not have access to this operation and / resource',
      })
    })

    it('should return 403 when user has no roles', async () => {
      const appWithNoRoles = express()
      appWithNoRoles.use(express.json())

      appWithNoRoles.post(
        '/v1/tenants',
        (req, res, next) => {
          req.decodedJwt = {
            aud: 'test-service-client',
            audience: 'test-service-client',
            idir_user_guid: 'F45AFBBD68C51D6F956BA3A1DE1878A2',
            client_roles: [], // No roles
          }
          next()
        },
        (req, res, next) => {
          const roles = req.decodedJwt?.client_roles || []
          if (!roles.includes('TMS.OPERATIONS_ADMIN')) {
            return res.status(403).json({
              errorMessage: 'Forbidden',
              httpResponseCode: 403,
              message: 'Access denied: User does not have required role',
              name: 'User does not have access to this operation and / resource',
            })
          }
          next()
        },
        validate(validator.createTenant, {}, {}),
        (req, res) => tmsController.createTenant(req, res),
      )

      const response = await request(appWithNoRoles)
        .post('/v1/tenants')
        .send(validTenantData)

      expect(response.status).toBe(403)
      expect(response.body).toMatchObject({
        errorMessage: 'Forbidden',
        httpResponseCode: 403,
        message: 'Access denied: User does not have required role',
        name: 'User does not have access to this operation and / resource',
      })
    })
  })

  describe('POST /v1/tenants/:tenantId/users', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const validUserData = {
      user: {
        firstName: 'Test',
        lastName: 'User',
        displayName: 'Test User',
        ssoUserId: 'F45AFBBD68C4466F956BA3A1D91878AD',
        email: 'test@gov.bc.ca',
        idpType: 'idir',
      },
      roles: ['123e4567-e89b-12d3-a456-426614174002'],
    }

    it('should add a user to a tenant successfully', async () => {
      const mockResponse = {
        savedTenantUser: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          firstName: validUserData.user.firstName,
          lastName: validUserData.user.lastName,
          displayName: validUserData.user.displayName,
          ssoUserId: validUserData.user.ssoUserId,
          email: validUserData.user.email,
        },
        roleAssignments: [
          {
            role: {
              id: validUserData.roles[0],
              name: TMSConstants.SERVICE_USER,
              description: 'Service User Role',
            },
          },
        ],
        tenantUserId: '123e4567-e89b-12d3-a456-426614174001',
      }

      mockTMSRepository.addTenantUsers.mockResolvedValue(
        mockResponse as unknown as AddTenantUsersResult,
      )

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users`)
        .send(validUserData)

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        data: {
          user: {
            id: mockResponse.savedTenantUser.id,
            roles: [
              {
                id: validUserData.roles[0],
                name: TMSConstants.SERVICE_USER,
              },
            ],
          },
        },
      })

      expect(mockTMSRepository.addTenantUsers).toHaveBeenCalled()
      const callArgs = mockTMSRepository.addTenantUsers.mock.calls[0]
      expect(callArgs[0].tenantId).toBe(tenantId)
      expect(callArgs[0].user.ssoUserId).toBe(validUserData.user.ssoUserId)
    })

    it('should return 400 when user idpType is missing', async () => {
      const invalidUserData = {
        ...validUserData,
        user: {
          ...validUserData.user,
          idpType: undefined,
        },
      }

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users`)
        .send(invalidUserData)

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Validation Failed')
    })

    it('should fail when role ID does not exist', async () => {
      const invalidUserData = {
        ...validUserData,
        roles: ['123e4567-e89b-12d3-a456-426614174999'],
      }

      mockTMSRepository.addTenantUsers.mockRejectedValue(
        new NotFoundError('Role(s) not found'),
      )

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users`)
        .send(invalidUserData)

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: 'Role(s) not found',
        name: 'Error occurred adding user to the tenant',
      })
    })

    it('should fail when user already exists in tenant', async () => {
      mockTMSRepository.addTenantUsers.mockRejectedValue(
        new ConflictError(`User is already added to this tenant: ${tenantId}`),
      )

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users`)
        .send(validUserData)

      expect(response.status).toBe(409)
      expect(response.body).toMatchObject({
        errorMessage: 'Conflict',
        httpResponseCode: 409,
        message: `User is already added to this tenant: ${tenantId}`,
        name: 'Error occurred adding user to the tenant',
      })
    })

    it('should return 404 when tenant ID does not exist', async () => {
      mockTMSRepository.addTenantUsers.mockRejectedValue(
        new NotFoundError(
          'Tenant Not Found: 123e4567-e89b-12d3-a456-426614174999',
        ),
      )

      const response = await request(app)
        .post('/v1/tenants/123e4567-e89b-12d3-a456-426614174999/users')
        .send(validUserData)

      expect(response.status).toBe(404)
      expect(response.body).toEqual({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: 'Tenant Not Found: 123e4567-e89b-12d3-a456-426614174999',
        name: 'Error occurred adding user to the tenant',
      })
    })

    it('should return 400 when roles array is missing', async () => {
      const invalidData = {
        user: validUserData.user,
      }

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users`)
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Validation Failed')
      expect(response.body.details.body[0].message).toBe('"roles" is required')
    })

    it('should handle transaction rollback when addTenantUsers succeeds but addUserToGroups fails', async () => {
      const mockResponse = {
        savedTenantUser: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          firstName: validUserData.user.firstName,
          lastName: validUserData.user.lastName,
          ssoUserId: validUserData.user.ssoUserId,
        },
        roleAssignments: [
          {
            role: {
              id: validUserData.roles[0],
              name: TMSConstants.SERVICE_USER,
            },
          },
        ],
        tenantUserId: '123e4567-e89b-12d3-a456-426614174001',
      }

      const userDataWithGroups = {
        ...validUserData,
        groups: ['123e4567-e89b-12d3-a456-426614174010'],
      }

      mockTMSRepository.addTenantUsers.mockResolvedValue(
        mockResponse as unknown as AddTenantUsersResult,
      )
      mockGroupRepository.addUserToGroups.mockRejectedValue(
        new NotFoundError('Group not found'),
      )

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users`)
        .send(userDataWithGroups)

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: 'Group not found',
        name: 'Error occurred adding user to the tenant',
      })
      expect(mockTMSRepository.addTenantUsers).toHaveBeenCalled()
      expect(mockGroupRepository.addUserToGroups).toHaveBeenCalled()
    })

    it('should restore soft-deleted user when adding to tenant', async () => {
      const mockResponse = {
        savedTenantUser: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          firstName: validUserData.user.firstName,
          lastName: validUserData.user.lastName,
          ssoUserId: validUserData.user.ssoUserId,
          isDeleted: false,
        },
        roleAssignments: [
          {
            role: {
              id: validUserData.roles[0],
              name: TMSConstants.SERVICE_USER,
            },
          },
        ],
        tenantUserId: '123e4567-e89b-12d3-a456-426614174001',
      }

      mockTMSRepository.addTenantUsers.mockResolvedValue(
        mockResponse as unknown as AddTenantUsersResult,
      )
      mockGroupRepository.addUserToGroups.mockResolvedValue([])

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users`)
        .send(validUserData)

      expect(response.status).toBe(201)
      expect(response.body.data.user.id).toBe(mockResponse.savedTenantUser.id)
    })

    it('should handle empty groups array', async () => {
      const mockResponse = {
        savedTenantUser: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          firstName: validUserData.user.firstName,
          lastName: validUserData.user.lastName,
          ssoUserId: validUserData.user.ssoUserId,
        },
        roleAssignments: [
          {
            role: {
              id: validUserData.roles[0],
              name: TMSConstants.SERVICE_USER,
            },
          },
        ],
        tenantUserId: '123e4567-e89b-12d3-a456-426614174001',
      }

      const userDataWithEmptyGroups = {
        ...validUserData,
        groups: [],
      }

      mockTMSRepository.addTenantUsers.mockResolvedValue(
        mockResponse as unknown as AddTenantUsersResult,
      )
      mockGroupRepository.addUserToGroups.mockResolvedValue([])

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users`)
        .send(userDataWithEmptyGroups)

      expect(response.status).toBe(201)
      expect(response.body.data.user.groups).toEqual([])
    })

    it('should handle duplicate role IDs in request', async () => {
      const userDataWithDuplicateRoles = {
        ...validUserData,
        roles: [validUserData.roles[0], validUserData.roles[0]], // Duplicate role ID
      }

      const mockResponse = {
        savedTenantUser: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          firstName: validUserData.user.firstName,
          lastName: validUserData.user.lastName,
          ssoUserId: validUserData.user.ssoUserId,
        },
        roleAssignments: [
          {
            role: {
              id: validUserData.roles[0],
              name: TMSConstants.SERVICE_USER,
            },
          },
        ],
        tenantUserId: '123e4567-e89b-12d3-a456-426614174001',
      }

      mockTMSRepository.addTenantUsers.mockResolvedValue(
        mockResponse as unknown as AddTenantUsersResult,
      )

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users`)
        .send(userDataWithDuplicateRoles)

      expect(response.status).toBe(201)
    })

    it('should handle very long string values in user data', async () => {
      const longString = 'a'.repeat(1000)
      const userDataWithLongStrings = {
        user: {
          ...validUserData.user,
          displayName: longString,
        },
        roles: validUserData.roles,
      }

      const mockResponse = {
        savedTenantUser: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          firstName: validUserData.user.firstName,
          lastName: validUserData.user.lastName,
          displayName: longString,
          ssoUserId: validUserData.user.ssoUserId,
        },
        roleAssignments: [
          {
            role: {
              id: validUserData.roles[0],
              name: TMSConstants.SERVICE_USER,
            },
          },
        ],
        tenantUserId: '123e4567-e89b-12d3-a456-426614174001',
      }

      mockTMSRepository.addTenantUsers.mockResolvedValue(
        mockResponse as unknown as AddTenantUsersResult,
      )

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users`)
        .send(userDataWithLongStrings)

      expect([201, 400]).toContain(response.status)
    })

    it('should handle duplicate group IDs in groups array', async () => {
      const duplicateGroupId = '123e4567-e89b-12d3-a456-426614174010'
      const mockResponse = {
        savedTenantUser: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          firstName: validUserData.user.firstName,
          lastName: validUserData.user.lastName,
          ssoUserId: validUserData.user.ssoUserId,
        },
        roleAssignments: [
          {
            role: {
              id: validUserData.roles[0],
              name: TMSConstants.SERVICE_USER,
            },
          },
        ],
        tenantUserId: '123e4567-e89b-12d3-a456-426614174001',
      }

      const userDataWithDuplicateGroups = {
        ...validUserData,
        groups: [duplicateGroupId, duplicateGroupId], // Duplicate group IDs
      }

      mockTMSRepository.addTenantUsers.mockResolvedValue(
        mockResponse as unknown as AddTenantUsersResult,
      )
      mockGroupRepository.addUserToGroups.mockResolvedValue([])

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users`)
        .send(userDataWithDuplicateGroups)

      expect([201, 400, 404]).toContain(response.status)
    })

    it('should allow bceidbusiness user without roles', async () => {
      const bceidUserData = {
        user: {
          ...validUserData.user,
          idpType: 'bceidbusiness',
          displayName: 'Business BCEID User',
        },
      }
      const mockResponse = {
        savedTenantUser: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          displayName: bceidUserData.user.displayName,
          ssoUserId: validUserData.user.ssoUserId,
        },
        roleAssignments: [
          {
            role: {
              id: '123e4567-e89b-12d3-a456-426614174002',
              name: TMSConstants.SERVICE_USER,
            },
          },
        ],
        tenantUserId: '123e4567-e89b-12d3-a456-426614174001',
      }

      mockTMSRepository.addTenantUsers.mockResolvedValue(
        mockResponse as unknown as AddTenantUsersResult,
      )
      mockGroupRepository.addUserToGroups.mockResolvedValue([])

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users`)
        .send(bceidUserData)

      expect(response.status).toBe(201)
      const callArgs = mockTMSRepository.addTenantUsers.mock.calls[0]
      expect(callArgs[0].user.idpType).toBe('bceidbusiness')
    })
  })

  describe('GET /v1/users/:ssoUserId/tenants', () => {
    const ssoUserId = 'F45AFBBD68C4411F956BA3A2D91878EF'
    const mockTenants = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Tenant 1',
        ministryName: 'Test Ministry 1',
        description: 'Test Description 1',
        createdDateTime: new Date(),
        updatedDateTime: new Date(),
        createdBy: 'test-user',
        updatedBy: 'test-user',
        users: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            firstName: 'Test',
            lastName: 'User',
            displayName: 'Test User',
            ssoUserId: ssoUserId,
            email: 'test@testministry.gov.bc.ca',
            createdDateTime: new Date(),
            updatedDateTime: new Date(),
            createdBy: 'test-user',
            updatedBy: 'test-user',
            ssoUser: {
              id: '123e4567-e89b-12d3-a456-426614174003',
              ssoUserId: ssoUserId,
              firstName: 'Test',
              lastName: 'User',
              displayName: 'Test User',
              userName: 'testuser',
              email: 'test@testministry.gov.bc.ca',
              createdDateTime: new Date(),
              updatedDateTime: new Date(),
              createdBy: 'test-user',
              updatedBy: 'test-user',
              tenantUsers: [],
            },
            tenant: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              name: 'Test Tenant 1',
              ministryName: 'Test Ministry 1',
              description: 'Test Description 1',
              createdDateTime: new Date(),
              updatedDateTime: new Date(),
              createdBy: 'test-user',
              updatedBy: 'test-user',
              users: [],
            },
            roles: [
              {
                id: '123e4567-e89b-12d3-a456-426614174002',
                tenantUser: {
                  id: '123e4567-e89b-12d3-a456-426614174001',
                },
                role: {
                  id: '123e4567-e89b-12d3-a456-426614174002',
                  name: TMSConstants.TENANT_OWNER,
                  description: 'Tenant Owner Role',
                },
                createdDateTime: new Date(),
                updatedDateTime: new Date(),
                createdBy: 'test-user',
                updatedBy: 'test-user',
                isDeleted: false,
              },
            ],
          },
        ],
      },
    ]

    it('should get tenants for user successfully', async () => {
      mockTMSRepository.getTenantsForUser.mockResolvedValue(
        mockTenants as unknown as GetTenantsForUserResult,
      )

      const response = await request(app)
        .get(`/v1/users/${ssoUserId}/tenants`)
        .query({ expand: 'tenantUserRoles' })

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          tenants: [
            {
              id: mockTenants[0].id,
              name: mockTenants[0].name,
              ministryName: mockTenants[0].ministryName,
              users: [
                {
                  ssoUser: expect.objectContaining({
                    firstName: mockTenants[0].users[0].firstName,
                    lastName: mockTenants[0].users[0].lastName,
                    ssoUserId: mockTenants[0].users[0].ssoUserId,
                  }),
                  roles: [
                    {
                      id: mockTenants[0].users[0].roles[0].id,
                      name: mockTenants[0].users[0].roles[0].role.name,
                    },
                  ],
                },
              ],
            },
          ],
        },
      })

      expect(mockTMSRepository.getTenantsForUser).toHaveBeenCalledWith(
        expect.objectContaining({
          ssoUserId,
          expand: ['tenantUserRoles'],
          jwtAudience: 'test-audience',
        }),
      )
    })

    it('should return empty tenants array for invalid SSO user ID', async () => {
      const invalidSsoUserId = '005AFBBD68C4411F956BA3A1D91878EF'
      mockTMSRepository.getTenantsForUser.mockResolvedValue([])

      const response = await request(app)
        .get(`/v1/users/${invalidSsoUserId}/tenants`)
        .query({ expand: 'tenantUserRoles' })

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          tenants: [],
        },
      })

      expect(mockTMSRepository.getTenantsForUser).toHaveBeenCalledWith(
        expect.objectContaining({
          ssoUserId: invalidSsoUserId,
          expand: ['tenantUserRoles'],
          jwtAudience: 'test-audience',
        }),
      )
    })

    it('should return 400 when expand parameter is invalid', async () => {
      const response = await request(app)
        .get(`/v1/users/${ssoUserId}/tenants`)
        .query({ expand: 'invalidParameter' })

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        name: 'ValidationError',
        message: 'Validation Failed',
        details: {
          query: [
            {
              message:
                '"expand" with value "invalidParameter" fails to match the required pattern: /^(tenantUserRoles)?$/',
            },
          ],
        },
      })
    })
  })

  describe('GET /v1/tenants/:tenantId/users', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const mockUsers = [
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        firstName: 'Test',
        lastName: 'User',
        displayName: 'Test User',
        isDeleted: false,
        ssoUserId: 'F45AFBBD68C4411F956BA3A1D91878EF',
        email: 'test@testministry.gov.bc.ca',
        createdDateTime: new Date(),
        updatedDateTime: new Date(),
        createdBy: 'test-user',
        updatedBy: 'test-user',
        tenant: {
          id: tenantId,
          name: 'Test Tenant',
          ministryName: 'Test Ministry',
          description: 'Test Description',
          createdDateTime: new Date(),
          updatedDateTime: new Date(),
          createdBy: 'test-user',
          updatedBy: 'test-user',
          users: [],
        },
        roles: [],
        ssoUser: {
          id: '123e4567-e89b-12d3-a456-426614174003',
          ssoUserId: 'F45AFBBD68C4411F956BA3A1D91878EF',
          firstName: 'Test',
          lastName: 'User',
          displayName: 'Test User',
          userName: 'testuser',
          email: 'test@testministry.gov.bc.ca',
          idpType: 'idir',
          createdDateTime: new Date(),
          updatedDateTime: new Date(),
          createdBy: 'test-user',
          updatedBy: 'test-user',
          tenantUsers: [],
        },
      },
    ]

    it('should get users for tenant successfully', async () => {
      mockTMSRepository.getUsersForTenant.mockResolvedValue(mockUsers)

      const response = await request(app).get(`/v1/tenants/${tenantId}/users`)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          users: [
            {
              id: mockUsers[0].id,
              firstName: mockUsers[0].firstName,
              lastName: mockUsers[0].lastName,
              displayName: mockUsers[0].displayName,
              ssoUserId: mockUsers[0].ssoUserId,
              email: mockUsers[0].email,
            },
          ],
        },
      })

      expect(mockTMSRepository.getUsersForTenant).toHaveBeenCalledWith({
        tenantId,
        groupIds: undefined,
        sharedServiceRoleIds: undefined,
      })
    })

    it('should return 400 when tenant ID is invalid', async () => {
      const response = await request(app).get('/v1/tenants/invalid-uuid/users')

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        name: 'ValidationError',
        message: 'Validation Failed',
        details: {
          params: [
            {
              message: '"tenantId" must be a valid GUID',
            },
          ],
        },
      })
    })

    it('should return empty users array for non-existent tenant', async () => {
      const nonExistentTenantId = '123e4567-e89b-12d3-a456-426614174999'
      mockTMSRepository.getUsersForTenant.mockResolvedValue([])

      const response = await request(app).get(
        `/v1/tenants/${nonExistentTenantId}/users`,
      )

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          users: [],
        },
      })

      expect(mockTMSRepository.getUsersForTenant).toHaveBeenCalledWith({
        tenantId: nonExistentTenantId,
        groupIds: undefined,
        sharedServiceRoleIds: undefined,
      })
    })
  })

  describe('POST /v1/tenants/:tenantId/users/:tenantUserId/roles', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const tenantUserId = '123e4567-e89b-12d3-a456-426614174001'
    const roleIds = ['123e4567-e89b-12d3-a456-426614174002']

    beforeEach(() => {
      app.post(
        '/v1/tenants/:tenantId/users/:tenantUserId/roles',
        validate(validator.assignUserRoles, {}, {}),
        (req, res) => tmsController.assignUserRoles(req, res),
      )

      const validationErrorHandler: ErrorRequestHandler = (
        err,
        req,
        res,
        next,
      ) => {
        if (
          err &&
          typeof err === 'object' &&
          'name' in err &&
          (err as { name: string }).name === 'ValidationError'
        ) {
          return res
            .status((err as { statusCode: number }).statusCode)
            .json(err)
        }
        next(err)
      }
      app.use(validationErrorHandler)
    })

    it('should assign roles to user successfully', async () => {
      const mockRoleAssignments = [
        {
          id: '123e4567-e89b-12d3-a456-426614174003',
          role: {
            id: roleIds[0],
            name: TMSConstants.SERVICE_USER,
            description: 'Service User Role',
            tenantUserRoles: [],
            createdDateTime: new Date(),
            updatedDateTime: new Date(),
            createdBy: 'test-user',
            updatedBy: 'test-user',
          },
          tenantUser: {
            id: tenantUserId,
            isDeleted: false,
            ssoUser: {
              id: '123e4567-e89b-12d3-a456-426614174004',
              ssoUserId: 'F45AFBBD68C44D6F956BA3A1D91878AD',
              firstName: 'Test',
              lastName: 'User',
              displayName: 'Test User',
              userName: 'testuser',
              email: 'test@gov.bc.ca',
              idpType: 'idir',
              createdDateTime: new Date(),
              updatedDateTime: new Date(),
              createdBy: 'test-user',
              updatedBy: 'test-user',
              tenantUsers: [],
            },
            tenant: {
              id: tenantId,
              name: 'Test Tenant',
              ministryName: 'Test Ministry',
              description: 'Test Description',
              createdDateTime: new Date(),
              updatedDateTime: new Date(),
              createdBy: 'test-user',
              updatedBy: 'test-user',
              users: [],
            },
            roles: [],
            createdDateTime: new Date(),
            updatedDateTime: new Date(),
            createdBy: 'test-user',
            updatedBy: 'test-user',
          },
          createdDateTime: new Date(),
          updatedDateTime: new Date(),
          createdBy: 'test-user',
          updatedBy: 'test-user',
          isDeleted: false,
        },
      ]

      mockTMSRepository.assignUserRolesForUser.mockResolvedValue(
        mockRoleAssignments as unknown as AssignUserRolesForUserResult,
      )

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users/${tenantUserId}/roles`)
        .send({ roles: roleIds })

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        data: {
          roles: [
            {
              id: roleIds[0],
              name: TMSConstants.SERVICE_USER,
            },
          ],
        },
      })

      expect(mockTMSRepository.assignUserRolesForUser).toHaveBeenCalledWith({
        tenantId,
        tenantUserId,
        roleIds,
      })
    })

    it('should return 400 when roles array is empty', async () => {
      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users/${tenantUserId}/roles`)
        .send({ roles: [] })

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        name: 'ValidationError',
        message: 'Validation Failed',
        details: {
          body: [
            {
              message: '"roles" must contain at least 1 items',
            },
          ],
        },
      })
    })

    it('should return 404 when tenant user not found', async () => {
      mockTMSRepository.assignUserRolesForUser.mockRejectedValue(
        new NotFoundError(`Tenant user not found for tenant: ${tenantId}`),
      )

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users/${tenantUserId}/roles`)
        .send({ roles: roleIds })

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: `Tenant user not found for tenant: ${tenantId}`,
        name: 'Error occurred assigning user role',
      })
    })

    it('should return 409 when all roles are already assigned', async () => {
      mockTMSRepository.assignUserRolesForUser.mockRejectedValue(
        new ConflictError('All roles are already assigned to the user'),
      )

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users/${tenantUserId}/roles`)
        .send({ roles: roleIds })

      expect(response.status).toBe(409)
      expect(response.body).toMatchObject({
        errorMessage: 'Conflict',
        httpResponseCode: 409,
        message: 'All roles are already assigned to the user',
        name: 'Error occurred assigning user role',
      })
    })

    it('should handle duplicate role IDs in roles array', async () => {
      const duplicateRoleId = '123e4567-e89b-12d3-a456-426614174002'
      const mockResponse = [
        {
          role: {
            id: duplicateRoleId,
            name: TMSConstants.USER_ADMIN,
          },
        },
      ]

      mockTMSRepository.assignUserRolesForUser.mockResolvedValue(
        mockResponse as unknown as AssignUserRolesForUserResult,
      )

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users/${tenantUserId}/roles`)
        .send({ roles: [duplicateRoleId, duplicateRoleId] })

      expect([201, 400, 404, 500]).toContain(response.status)
    })

    it('should restore soft-deleted role assignments when assigning roles', async () => {
      const mockRoleAssignments = [
        {
          id: '123e4567-e89b-12d3-a456-426614174003',
          role: {
            id: roleIds[0],
            name: TMSConstants.USER_ADMIN,
            description: 'User Admin Role',
          },
          isDeleted: false,
        },
      ]

      mockTMSRepository.assignUserRolesForUser.mockResolvedValue(
        mockRoleAssignments as unknown as AssignUserRolesForUserResult,
      )

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users/${tenantUserId}/roles`)
        .send({ roles: roleIds })

      expect(response.status).toBe(201)
      expect(response.body.data.roles).toContainEqual(
        expect.objectContaining({
          id: roleIds[0],
          name: TMSConstants.USER_ADMIN,
        }),
      )
    })
  })

  describe('DELETE /v1/tenants/:tenantId/users/:tenantUserId/roles/:roleId', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const tenantUserId = '123e4567-e89b-12d3-a456-426614174001'
    const roleId = '123e4567-e89b-12d3-a456-426614174002'

    beforeEach(() => {
      app.delete(
        '/v1/tenants/:tenantId/users/:tenantUserId/roles/:roleId',
        validate(validator.unassignUserRoles, {}, {}),
        (req, res) => tmsController.unassignUserRoles(req, res),
      )

      const validationErrorHandler: ErrorRequestHandler = (
        err,
        req,
        res,
        next,
      ) => {
        if (
          err &&
          typeof err === 'object' &&
          'name' in err &&
          (err as { name: string }).name === 'ValidationError'
        ) {
          return res
            .status((err as { statusCode: number }).statusCode)
            .json(err)
        }
        next(err)
      }
      app.use(validationErrorHandler)
    })

    it('should unassign role from user successfully', async () => {
      mockTMSRepository.unassignUserRoles.mockResolvedValue(undefined)

      const response = await request(app).delete(
        `/v1/tenants/${tenantId}/users/${tenantUserId}/roles/${roleId}`,
      )

      expect(response.status).toBe(204)
      expect(mockTMSRepository.unassignUserRoles).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          tenantUserId,
          roleId,
          updatedBy: 'system',
        }),
      )
    })

    it('should return 400 when tenant ID is invalid', async () => {
      const response = await request(app).delete(
        `/v1/tenants/invalid-uuid/users/${tenantUserId}/roles/${roleId}`,
      )

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        name: 'ValidationError',
        message: 'Validation Failed',
        details: {
          params: [
            {
              message: '"tenantId" must be a valid GUID',
            },
          ],
        },
      })
    })

    it('should return 404 when tenant user role not found', async () => {
      mockTMSRepository.unassignUserRoles.mockRejectedValue(
        new NotFoundError(
          `Tenant: ${tenantId},  Users: ${tenantUserId} and / or roles: ${roleId} not found`,
        ),
      )

      const response = await request(app).delete(
        `/v1/tenants/${tenantId}/users/${tenantUserId}/roles/${roleId}`,
      )

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: `Tenant: ${tenantId},  Users: ${tenantUserId} and / or roles: ${roleId} not found`,
        name: 'Error occurred unassigning user role',
      })
    })

    it('should return 409 when trying to unassign last tenant owner', async () => {
      mockTMSRepository.unassignUserRoles.mockRejectedValue(
        new ConflictError(
          'Cannot unassign tenant owner role. At least one tenant owner must remain.',
        ),
      )

      const response = await request(app).delete(
        `/v1/tenants/${tenantId}/users/${tenantUserId}/roles/${roleId}`,
      )

      expect(response.status).toBe(409)
      expect(response.body).toMatchObject({
        errorMessage: 'Conflict',
        httpResponseCode: 409,
        message:
          'Cannot unassign tenant owner role. At least one tenant owner must remain.',
        name: 'Error occurred unassigning user role',
      })
    })

    it('should return 409 when trying to unassign last role from user', async () => {
      mockTMSRepository.unassignUserRoles.mockRejectedValue(
        new ConflictError(
          'Cannot unassign the last role from a user. User must have at least one role in the tenant',
        ),
      )

      const response = await request(app).delete(
        `/v1/tenants/${tenantId}/users/${tenantUserId}/roles/${roleId}`,
      )

      expect(response.status).toBe(409)
      expect(response.body).toMatchObject({
        errorMessage: 'Conflict',
        httpResponseCode: 409,
        message:
          'Cannot unassign the last role from a user. User must have at least one role in the tenant',
        name: 'Error occurred unassigning user role',
      })
    })
  })

  describe('GET /v1/tenants/:tenantId', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const mockTenant = {
      id: tenantId,
      name: 'Test Tenant',
      ministryName: 'Test Ministry',
      description: 'Test Description',
      createdDateTime: new Date(),
      updatedDateTime: new Date(),
      createdBy: 'test-user',
      updatedBy: 'test-user',
      users: [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          firstName: 'Test',
          lastName: 'User',
          displayName: 'Test User',
          ssoUserId: 'F45AFBBD68C4411F956BA3A1D91878EF',
          email: 'test@testministry.gov.bc.ca',
          createdDateTime: new Date(),
          updatedDateTime: new Date(),
          createdBy: 'test-user',
          updatedBy: 'test-user',
          ssoUser: {
            id: '123e4567-e89b-12d3-a456-426614174003',
            ssoUserId: 'F45AFBBD68C4411F956BA3A1D91878EF',
            firstName: 'Test',
            lastName: 'User',
            displayName: 'Test User',
            userName: 'testuser',
            email: 'test@testministry.gov.bc.ca',
            createdDateTime: new Date(),
            updatedDateTime: new Date(),
            createdBy: 'test-user',
            updatedBy: 'test-user',
            tenantUsers: [],
          },
          tenant: {
            id: tenantId,
            name: 'Test Tenant',
            ministryName: 'Test Ministry',
            description: 'Test Description',
            createdDateTime: new Date(),
            updatedDateTime: new Date(),
            createdBy: 'test-user',
            updatedBy: 'test-user',
            users: [],
          },
          roles: [
            {
              id: '123e4567-e89b-12d3-a456-426614174002',
              tenantUser: {
                id: '123e4567-e89b-12d3-a456-426614174001',
              },
              role: {
                id: '123e4567-e89b-12d3-a456-426614174002',
                name: TMSConstants.TENANT_OWNER,
                description: 'Tenant Owner Role',
                tenantUserRoles: [],
                createdDateTime: new Date(),
                updatedDateTime: new Date(),
                createdBy: 'test-user',
                updatedBy: 'test-user',
              },
              createdDateTime: new Date(),
              updatedDateTime: new Date(),
              createdBy: 'test-user',
              updatedBy: 'test-user',
              isDeleted: false,
            },
          ],
        },
      ],
    }

    beforeEach(() => {
      app.get(
        '/v1/tenants/:tenantId',
        validate(validator.getTenant, {}, {}),
        (req, res) => tmsController.getTenant(req, res),
      )

      const validationErrorHandler: ErrorRequestHandler = (
        err,
        req,
        res,
        next,
      ) => {
        if (
          err &&
          typeof err === 'object' &&
          'name' in err &&
          (err as { name: string }).name === 'ValidationError'
        ) {
          return res
            .status((err as { statusCode: number }).statusCode)
            .json(err)
        }
        next(err)
      }
      app.use(validationErrorHandler)
    })

    it('should get tenant details successfully', async () => {
      const tenantResponse = {
        ...mockTenant,
        createdBy: '123e4567e89b12d3a456426614174001',
        createdByUserName: 'test-user',
        createdByDisplayName: 'Test User',
      }

      mockTMSRepository.getTenant.mockResolvedValue(
        tenantResponse as unknown as GetTenantResult,
      )

      const response = await request(app).get(`/v1/tenants/${tenantId}`)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          tenant: {
            id: tenantResponse.id,
            name: tenantResponse.name,
            ministryName: tenantResponse.ministryName,
            description: tenantResponse.description,
            createdBy: tenantResponse.createdBy,
            createdByUserName: tenantResponse.createdByUserName,
            createdByDisplayName: tenantResponse.createdByDisplayName,
          },
        },
      })

      expect(mockTMSRepository.getTenant).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          expand: [],
        }),
      )
    })

    it('should get tenant details with expanded user roles', async () => {
      const tenantResponse = {
        ...mockTenant,
        createdBy: '123e4567e89b12d3a456426614174001',
        createdByUserName: 'test-user',
        createdByDisplayName: 'Test User',
      }

      mockTMSRepository.getTenant.mockResolvedValue(
        tenantResponse as unknown as GetTenantResult,
      )

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}`)
        .query({ expand: 'tenantUserRoles' })

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          tenant: {
            id: tenantResponse.id,
            name: tenantResponse.name,
            ministryName: tenantResponse.ministryName,
            description: tenantResponse.description,
            createdBy: tenantResponse.createdBy,
            createdByUserName: tenantResponse.createdByUserName,
            createdByDisplayName: tenantResponse.createdByDisplayName,
            users: [
              {
                ssoUser: expect.objectContaining({
                  firstName: tenantResponse.users[0].ssoUser.firstName,
                  lastName: tenantResponse.users[0].ssoUser.lastName,
                  ssoUserId: tenantResponse.users[0].ssoUser.ssoUserId,
                }),
                roles: [
                  {
                    id: tenantResponse.users[0].roles[0].id,
                    name: TMSConstants.TENANT_OWNER,
                  },
                ],
              },
            ],
          },
        },
      })

      expect(mockTMSRepository.getTenant).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          expand: ['tenantUserRoles'],
        }),
      )
    })

    it('should return createdByUserName and createdByDisplayName as system when tenant createdBy is padded system', async () => {
      const tenantResponse = {
        ...mockTenant,
        createdBy: 'system                          ',
        createdByUserName: 'system',
        createdByDisplayName: 'system',
      }

      mockTMSRepository.getTenant.mockResolvedValue(
        tenantResponse as unknown as GetTenantResult,
      )

      const response = await request(app).get(`/v1/tenants/${tenantId}`)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          tenant: {
            createdBy: 'system                          ',
            createdByUserName: 'system',
            createdByDisplayName: 'system',
          },
        },
      })
    })

    it('should return 400 when tenant ID is invalid', async () => {
      const response = await request(app).get('/v1/tenants/invalid-uuid')

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        name: 'ValidationError',
        message: 'Validation Failed',
        details: {
          params: [
            {
              message: '"tenantId" must be a valid GUID',
            },
          ],
        },
      })
    })

    it('should return 400 when expand parameter is invalid', async () => {
      const response = await request(app)
        .get(`/v1/tenants/${tenantId}`)
        .query({ expand: 'invalidParameter' })

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        name: 'ValidationError',
        message: 'Validation Failed',
        details: {
          query: [
            {
              message:
                '"expand" with value "invalidParameter" fails to match the required pattern: /^(tenantUserRoles)?$/',
            },
          ],
        },
      })
    })

    it('should return 404 when tenant not found', async () => {
      const nonExistentTenantId = '123e4567-e89b-12d3-a456-426614174999'
      mockTMSRepository.getTenant.mockRejectedValue(
        new NotFoundError(`Tenant Not Found: ${nonExistentTenantId}`),
      )

      const response = await request(app).get(
        `/v1/tenants/${nonExistentTenantId}`,
      )

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: `Tenant Not Found: ${nonExistentTenantId}`,
        name: 'Error occurred getting a tenant',
      })
    })
  })

  describe('GET /v1/tenants/:tenantId/ssousers/:ssoUserId/roles', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const ssoUserId = 'F45AFBBD68C4411F956BA3A1D91878EF'
    const mockRoles = [
      {
        id: '123e4567-e89b-12d3-a456-426614174002',
        name: TMSConstants.TENANT_OWNER,
        description: 'Tenant Owner Role',
        tenantUserRoles: [],
        createdDateTime: new Date(),
        updatedDateTime: new Date(),
        createdBy: 'test-user',
        updatedBy: 'test-user',
      },
    ]

    beforeEach(() => {
      app.get(
        '/v1/tenants/:tenantId/ssousers/:ssoUserId/roles',
        (req, res, next) => {
          req.isSharedServiceAccess = true
          req.decodedJwt = {
            aud: 'test-service-client',
            idir_user_guid: ssoUserId,
          }
          next()
        },
        validate(validator.getRolesForSSOUser, {}, {}),
        async (req, res, next) => {
          try {
            const tenantId = req.params.tenantId
            const ssoUserIdFromToken =
              req.decodedJwt?.idir_user_guid || req.decodedJwt?.bceid_user_guid
            if (!tenantId || !ssoUserIdFromToken) {
              return res.status(403).json({
                error: 'Forbidden',
                message: 'Missing tenant ID or user ID',
              })
            }
            const hasAccess = await mockTMSRepository.checkUserTenantAccess(
              tenantId,
              ssoUserIdFromToken,
              [],
            )
            if (!hasAccess) {
              return res
                .status(403)
                .json({ error: 'Forbidden', message: 'Access denied' })
            }
            next()
          } catch (error) {
            next(error)
          }
        },
        (req, res) => tmsController.getRolesForSSOUser(req, res),
      )

      const validationErrorHandler: ErrorRequestHandler = (
        err,
        req,
        res,
        next,
      ) => {
        if (
          err &&
          typeof err === 'object' &&
          'name' in err &&
          (err as { name: string }).name === 'ValidationError'
        ) {
          return res
            .status((err as { statusCode: number }).statusCode)
            .json(err)
        }
        next(err)
      }
      app.use(validationErrorHandler)
    })

    it('should get roles for SSO user successfully', async () => {
      mockTMSRepository.checkUserTenantAccess.mockResolvedValue(true)
      mockTMSRepository.getRolesForSSOUser.mockResolvedValue(mockRoles)

      const response = await request(app).get(
        `/v1/tenants/${tenantId}/ssousers/${ssoUserId}/roles`,
      )

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          roles: [
            {
              id: mockRoles[0].id,
              name: mockRoles[0].name,
              description: mockRoles[0].description,
            },
          ],
        },
      })

      expect(mockTMSRepository.getRolesForSSOUser).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          ssoUserId,
        }),
      )
    })

    it('should return 400 when tenant ID is invalid', async () => {
      const response = await request(app).get(
        `/v1/tenants/invalid-uuid/ssousers/${ssoUserId}/roles`,
      )

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        name: 'ValidationError',
        message: 'Validation Failed',
        details: {
          params: [
            {
              message: '"tenantId" must be a valid GUID',
            },
          ],
        },
      })
    })

    it('should return 404 when tenant not found', async () => {
      const nonExistentTenantId = '123e4567-e89b-12d3-a456-426614174999'
      mockTMSRepository.checkUserTenantAccess.mockResolvedValue(true)
      mockTMSRepository.getRolesForSSOUser.mockRejectedValue(
        new NotFoundError(`Tenant Not Found: ${nonExistentTenantId}`),
      )

      const response = await request(app).get(
        `/v1/tenants/${nonExistentTenantId}/ssousers/${ssoUserId}/roles`,
      )

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: `Tenant Not Found: ${nonExistentTenantId}`,
        name: 'Error occurred getting roles for SSO user',
      })
    })

    it('should return empty roles array when user has no roles', async () => {
      mockTMSRepository.checkUserTenantAccess.mockResolvedValue(true)
      mockTMSRepository.getRolesForSSOUser.mockResolvedValue([])

      const response = await request(app).get(
        `/v1/tenants/${tenantId}/ssousers/${ssoUserId}/roles`,
      )

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          roles: [],
        },
      })
    })
  })

  describe('GET /v1/roles', () => {
    const mockRoles = [
      {
        id: '123e4567-e89b-12d3-a456-426614174002',
        name: TMSConstants.TENANT_OWNER,
        description: 'Tenant Owner Role',
        tenantUserRoles: [],
        createdDateTime: new Date(),
        updatedDateTime: new Date(),
        createdBy: 'test-user',
        updatedBy: 'test-user',
      },
    ]

    beforeEach(() => {
      app.get('/v1/roles', (req, res) => tmsController.getTenantRoles(req, res))

      const validationErrorHandler: ErrorRequestHandler = (
        err,
        req,
        res,
        next,
      ) => {
        if (
          err &&
          typeof err === 'object' &&
          'name' in err &&
          (err as { name: string }).name === 'ValidationError'
        ) {
          return res
            .status((err as { statusCode: number }).statusCode)
            .json(err)
        }
        next(err)
      }
      app.use(validationErrorHandler)
    })

    it('should get all roles successfully', async () => {
      mockTMSRepository.getTenantRoles.mockResolvedValue(mockRoles)

      const response = await request(app).get('/v1/roles')

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          roles: [
            {
              id: mockRoles[0].id,
              name: mockRoles[0].name,
              description: mockRoles[0].description,
            },
          ],
        },
      })

      expect(mockTMSRepository.getTenantRoles).toHaveBeenCalled()
    })

    it('should return empty roles array when no roles exist', async () => {
      mockTMSRepository.getTenantRoles.mockResolvedValue([])

      const response = await request(app).get('/v1/roles')

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          roles: [],
        },
      })
    })

    it('should handle internal server error', async () => {
      mockTMSRepository.getTenantRoles.mockRejectedValue(
        new Error('Database error'),
      )

      const response = await request(app).get('/v1/roles')

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: 'Database error',
        name: 'Error occurred getting tenant roles',
      })
    })
  })

  describe('PUT /v1/tenants/:tenantId', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const validUpdateData = {
      name: 'Updated Tenant',
      ministryName: 'Updated Ministry',
      description: 'Updated Description',
    }

    beforeEach(() => {
      app.put(
        '/v1/tenants/:tenantId',
        validate(validator.updateTenant, {}, {}),
        (req, res) => tmsController.updateTenant(req, res),
      )

      const validationErrorHandler: ErrorRequestHandler = (
        err,
        req,
        res,
        next,
      ) => {
        if (
          err &&
          typeof err === 'object' &&
          'name' in err &&
          (err as { name: string }).name === 'ValidationError'
        ) {
          return res
            .status((err as { statusCode: number }).statusCode)
            .json(err)
        }
        next(err)
      }
      app.use(validationErrorHandler)
    })

    it('should update tenant successfully', async () => {
      const mockUpdatedTenant = {
        id: tenantId,
        ...validUpdateData,
        createdDateTime: new Date(),
        updatedDateTime: new Date(),
        createdBy: 'test-user',
        updatedBy: 'test-user',
        users: [],
      }

      ;(mockTMSRepository.updateTenant as jest.Mock).mockImplementation(
        async () => mockUpdatedTenant as Tenant,
      )

      const response = await request(app)
        .put(`/v1/tenants/${tenantId}`)
        .send(validUpdateData)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          tenant: {
            id: mockUpdatedTenant.id,
            name: mockUpdatedTenant.name,
            ministryName: mockUpdatedTenant.ministryName,
            description: mockUpdatedTenant.description,
          },
        },
      })

      expect(mockTMSRepository.updateTenant).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          name: validUpdateData.name,
          ministryName: validUpdateData.ministryName,
          description: validUpdateData.description,
          updatedBy: 'system',
        }),
      )
    })

    it('should return 404 when tenant does not exist', async () => {
      mockTMSRepository.updateTenant.mockRejectedValue(
        new NotFoundError(`Tenant not found: ${tenantId}`),
      )

      const response = await request(app)
        .put(`/v1/tenants/${tenantId}`)
        .send(validUpdateData)

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: `Tenant not found: ${tenantId}`,
        name: 'Error occurred updating tenant',
      })
    })

    it('should return 409 when name and ministry name combination already exists', async () => {
      mockTMSRepository.updateTenant.mockRejectedValue(
        new ConflictError(
          `A tenant with name '${validUpdateData.name}' and ministry name '${validUpdateData.ministryName}' already exists`,
        ),
      )

      const response = await request(app)
        .put(`/v1/tenants/${tenantId}`)
        .send(validUpdateData)

      expect(response.status).toBe(409)
      expect(response.body).toMatchObject({
        errorMessage: 'Conflict',
        httpResponseCode: 409,
        message: `A tenant with name '${validUpdateData.name}' and ministry name '${validUpdateData.ministryName}' already exists`,
        name: 'Error occurred updating tenant',
      })
    })

    it('should return 400 when tenant ID is invalid', async () => {
      const response = await request(app)
        .put('/v1/tenants/invalid-uuid')
        .send(validUpdateData)

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        name: 'ValidationError',
        message: 'Validation Failed',
        details: {
          params: [
            {
              message: '"tenantId" must be a valid GUID',
            },
          ],
        },
      })
    })

    it('should return 400 when update data is invalid', async () => {
      const invalidData = {
        name: 'a'.repeat(31),
        ministryName: 'b'.repeat(101),
      }

      const response = await request(app)
        .put(`/v1/tenants/${tenantId}`)
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        name: 'ValidationError',
        message: 'Validation Failed',
        details: {
          body: expect.arrayContaining([
            expect.objectContaining({
              message:
                '"name" length must be less than or equal to 30 characters long',
            }),
            expect.objectContaining({
              message:
                '"ministryName" length must be less than or equal to 100 characters long',
            }),
          ]),
        },
      })
    })
  })

  describe('GET /v1/health', () => {
    beforeEach(() => {
      app.get('/v1/health', (req, res) => tmsController.health(req, res))
    })

    it('should return health status successfully', async () => {
      const response = await request(app).get('/v1/health')

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        apiStatus: 'Healthy',
      })
      expect(response.body.time).toBeDefined()
      expect(typeof response.body.time).toBe('string')
    })
  })

  describe('GET /v1/tenants/:tenantId/users/:tenantUserId/roles', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const tenantUserId = '123e4567-e89b-12d3-a456-426614174001'

    beforeEach(() => {
      app.get(
        '/v1/tenants/:tenantId/users/:tenantUserId/roles',
        validate(validator.getUserRoles, {}, {}),
        (req, res) => tmsController.getUserRoles(req, res),
      )

      const validationErrorHandler: ErrorRequestHandler = (
        err,
        req,
        res,
        next,
      ) => {
        if (
          err &&
          typeof err === 'object' &&
          'name' in err &&
          (err as { name: string }).name === 'ValidationError'
        ) {
          return res
            .status((err as { statusCode: number }).statusCode)
            .json(err)
        }
        next(err)
      }
      app.use(validationErrorHandler)
    })

    it('should get user roles successfully', async () => {
      const mockRoles = [
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          name: TMSConstants.TENANT_OWNER,
          description: 'Tenant Owner Role',
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174003',
          name: TMSConstants.USER_ADMIN,
          description: 'User Admin Role',
        },
      ]

      mockTMSRepository.getUserRoles.mockResolvedValue(
        mockRoles as unknown as GetUserRolesResult,
      )

      const response = await request(app).get(
        `/v1/tenants/${tenantId}/users/${tenantUserId}/roles`,
      )

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          roles: expect.arrayContaining([
            expect.objectContaining({
              id: mockRoles[0].id,
              name: mockRoles[0].name,
            }),
            expect.objectContaining({
              id: mockRoles[1].id,
              name: mockRoles[1].name,
            }),
          ]),
        },
      })
      expect(mockTMSRepository.getUserRoles).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          tenantUserId,
        }),
      )
    })

    it('should return empty array when user has no roles', async () => {
      mockTMSRepository.getUserRoles.mockResolvedValue([])

      const response = await request(app).get(
        `/v1/tenants/${tenantId}/users/${tenantUserId}/roles`,
      )

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          roles: [],
        },
      })
    })

    it('should return 400 when tenant ID is invalid', async () => {
      const response = await request(app).get(
        `/v1/tenants/invalid-uuid/users/${tenantUserId}/roles`,
      )

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        name: 'ValidationError',
        message: 'Validation Failed',
        details: {
          params: [
            {
              message: '"tenantId" must be a valid GUID',
            },
          ],
        },
      })
    })

    it('should return 400 when tenant user ID is invalid', async () => {
      const response = await request(app).get(
        `/v1/tenants/${tenantId}/users/invalid-uuid/roles`,
      )

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        name: 'ValidationError',
        message: 'Validation Failed',
        details: {
          params: [
            {
              message: '"tenantUserId" must be a valid GUID',
            },
          ],
        },
      })
    })

    it('should return 500 when database error occurs', async () => {
      mockTMSRepository.getUserRoles.mockRejectedValue(
        new Error('Database connection failed'),
      )

      const response = await request(app).get(
        `/v1/tenants/${tenantId}/users/${tenantUserId}/roles`,
      )

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: 'Database connection failed',
        name: 'Error occurred getting roles for user',
      })
    })
  })

  describe('GET /v1/tenants/:tenantId/users/:tenantUserId', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const tenantUserId = '123e4567-e89b-12d3-a456-426614174001'
    const ssoUserId = 'fd33f1cef7ca4b19a71104d4ecf7066b'

    beforeEach(() => {
      app.get(
        '/v1/tenants/:tenantId/users/:tenantUserId',
        validate(validator.getTenantUser, {}, {}),
        (req, res) => tmsController.getTenantUser(req, res),
      )

      const validationErrorHandler: ErrorRequestHandler = (
        err,
        req,
        res,
        next,
      ) => {
        if (
          err &&
          typeof err === 'object' &&
          'name' in err &&
          (err as { name: string }).name === 'ValidationError'
        ) {
          return res
            .status((err as { statusCode: number }).statusCode)
            .json(err)
        }
        next(err)
      }
      app.use(validationErrorHandler)
    })

    it('should get tenant user with default response (no expand)', async () => {
      const mockTenantUser = {
        id: tenantUserId,
        ssoUser: {
          ssoUserId: ssoUserId,
          firstName: 'John',
          lastName: 'Smith',
          displayName: 'Smith, John: MOT: EX',
          userName: 'JSMITH1',
          email: 'john.smith@gov.bc.ca',
        },
        createdDateTime: '2024-01-01',
        updatedDateTime: '2024-01-01',
        createdBy: 'system',
        updatedBy: 'system',
      }

      mockTMSRepository.getTenantUser.mockResolvedValue(mockTenantUser)

      const response = await request(app).get(
        `/v1/tenants/${tenantId}/users/${tenantUserId}`,
      )

      expect(response.status).toBe(200)
      expect(response.body.data.tenantUser).toEqual(mockTenantUser)
      expect(mockTMSRepository.getTenantUser).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          tenantUserId,
          expand: [],
        }),
      )
    })

    it('should get tenant user with groups expand', async () => {
      const mockTenantUser = {
        id: tenantUserId,
        ssoUser: {
          ssoUserId: ssoUserId,
          firstName: 'John',
          lastName: 'Smith',
          displayName: 'Smith, John: MOT: EX',
          userName: 'JSMITH1',
          email: 'john.smith@gov.bc.ca',
        },
        createdDateTime: '2024-01-01',
        updatedDateTime: '2024-01-01',
        createdBy: 'system',
        updatedBy: 'system',
      }

      const mockGroups: GetTenantUserGroupsResult = [
        {
          id: 'group-1',
          name: 'Test Group',
          description: 'Test Group Description',
          createdDateTime: new Date('2024-01-01'),
          updatedDateTime: new Date('2024-01-01'),
          createdBy: 'system',
          updatedBy: 'system',
        },
      ]

      mockTMSRepository.getTenantUser.mockResolvedValue(mockTenantUser)
      mockGroupRepository.getTenantUserGroups.mockResolvedValue(mockGroups)

      const response = await request(app).get(
        `/v1/tenants/${tenantId}/users/${tenantUserId}?expand=groups`,
      )

      expect(response.status).toBe(200)
      expect(response.body.data.tenantUser.groups).toEqual([
        expect.objectContaining({
          ...mockGroups[0],
          createdDateTime: mockGroups[0].createdDateTime.toISOString(),
          updatedDateTime: mockGroups[0].updatedDateTime.toISOString(),
        }),
      ])
      expect(mockTMSRepository.getTenantUser).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          tenantUserId,
          expand: ['groups'],
        }),
      )
      expect(mockGroupRepository.getTenantUserGroups).toHaveBeenCalledWith(
        tenantUserId,
      )
    })

    it('should get tenant user with roles expand', async () => {
      const mockTenantUser = {
        id: tenantUserId,
        ssoUser: {
          ssoUserId: ssoUserId,
          firstName: 'John',
          lastName: 'Smith',
          displayName: 'Smith, John: MOT: EX',
          userName: 'JSMITH1',
          email: 'john.smith@gov.bc.ca',
        },
        roles: [
          {
            id: 'role-1',
            name: 'TENANT_OWNER',
            description: 'Tenant Owner Role',
            isDeleted: false,
          },
        ],
        createdDateTime: '2024-01-01',
        updatedDateTime: '2024-01-01',
        createdBy: 'system',
        updatedBy: 'system',
      }

      mockTMSRepository.getTenantUser.mockResolvedValue(mockTenantUser)

      const response = await request(app).get(
        `/v1/tenants/${tenantId}/users/${tenantUserId}?expand=roles`,
      )

      expect(response.status).toBe(200)
      expect(response.body.data.tenantUser.roles).toEqual(mockTenantUser.roles)
      expect(mockTMSRepository.getTenantUser).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          tenantUserId,
          expand: ['roles'],
        }),
      )
    })

    it('should get tenant user with sharedServices expand', async () => {
      const mockTenantUser = {
        id: tenantUserId,
        ssoUser: {
          ssoUserId: ssoUserId,
          firstName: 'John',
          lastName: 'Smith',
          displayName: 'Smith, John: MOT: EX',
          userName: 'JSMITH1',
          email: 'john.smith@gov.bc.ca',
        },
        createdDateTime: '2024-01-01',
        updatedDateTime: '2024-01-01',
        createdBy: 'system',
        updatedBy: 'system',
      }

      const mockSharedServices: GetTenantUserSharedServiceRolesResult = [
        {
          id: 'ss-1',
          name: 'Test Service',
          description: 'Test Service Description',
          clientIdentifier: 'test-client',
          isActive: true,
          sharedServiceRoles: [
            {
              id: 'ssr-1',
              name: 'ADMIN',
              description: 'Admin Role',
              allowedIdentityProviders: null,
            },
          ],
        },
      ]

      mockTMSRepository.getTenantUser.mockResolvedValue(mockTenantUser)
      mockGroupRepository.getTenantUserSharedServiceRoles.mockResolvedValue(
        mockSharedServices,
      )

      const response = await request(app).get(
        `/v1/tenants/${tenantId}/users/${tenantUserId}?expand=sharedServices`,
      )

      expect(response.status).toBe(200)
      expect(response.body.data.tenantUser.sharedServices).toEqual(
        mockSharedServices,
      )
      expect(mockTMSRepository.getTenantUser).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          tenantUserId,
          expand: ['sharedServices'],
        }),
      )
      expect(
        mockGroupRepository.getTenantUserSharedServiceRoles,
      ).toHaveBeenCalledWith(tenantUserId)
    })

    it('should get tenant user with multiple expand parameters', async () => {
      const mockTenantUser = {
        id: tenantUserId,
        ssoUser: {
          ssoUserId: ssoUserId,
          firstName: 'John',
          lastName: 'Smith',
          displayName: 'Smith, John: MOT: EX',
          userName: 'JSMITH1',
          email: 'john.smith@gov.bc.ca',
        },
        roles: [
          {
            id: 'role-1',
            name: 'TENANT_OWNER',
            description: 'Tenant Owner Role',
            isDeleted: false,
          },
        ],
        createdDateTime: '2024-01-01',
        updatedDateTime: '2024-01-01',
        createdBy: 'system',
        updatedBy: 'system',
      }

      const mockGroups: GetTenantUserGroupsResult = [
        {
          id: 'group-1',
          name: 'Test Group',
          description: 'Test Group Description',
          createdDateTime: new Date('2024-01-01'),
          updatedDateTime: new Date('2024-01-01'),
          createdBy: 'system',
          updatedBy: 'system',
        },
      ]

      mockTMSRepository.getTenantUser.mockResolvedValue(mockTenantUser)
      mockGroupRepository.getTenantUserGroups.mockResolvedValue(mockGroups)

      const response = await request(app).get(
        `/v1/tenants/${tenantId}/users/${tenantUserId}?expand=groups,roles`,
      )

      expect(response.status).toBe(200)
      expect(response.body.data.tenantUser.groups).toEqual([
        expect.objectContaining({
          ...mockGroups[0],
          createdDateTime: mockGroups[0].createdDateTime.toISOString(),
          updatedDateTime: mockGroups[0].updatedDateTime.toISOString(),
        }),
      ])
      expect(response.body.data.tenantUser.roles).toEqual(mockTenantUser.roles)
      expect(mockTMSRepository.getTenantUser).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          tenantUserId,
          expand: ['groups', 'roles'],
        }),
      )
      expect(mockGroupRepository.getTenantUserGroups).toHaveBeenCalledWith(
        tenantUserId,
      )
    })

    it('should return 400 when invalid expand values are provided', async () => {
      const response = await request(app).get(
        `/v1/tenants/${tenantId}/users/${tenantUserId}?expand=invalidExpand`,
      )

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Validation Failed')
    })

    it('should return 404 when tenant user is not found', async () => {
      mockTMSRepository.getTenantUser.mockRejectedValue(
        new NotFoundError(`Tenant user not found: ${tenantUserId}`),
      )

      const response = await request(app).get(
        `/v1/tenants/${tenantId}/users/${tenantUserId}`,
      )

      expect(response.status).toBe(404)
      expect(response.body.message).toBe(
        `Tenant user not found: ${tenantUserId}`,
      )
    })

    it('should return 400 when validation fails for invalid tenant ID', async () => {
      const invalidTenantId = 'invalid-uuid'

      const response = await request(app).get(
        `/v1/tenants/${invalidTenantId}/users/${tenantUserId}`,
      )

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Validation Failed')
    })

    it('should return 400 when validation fails for invalid tenant user ID', async () => {
      const invalidTenantUserId = 'invalid-uuid'

      const response = await request(app).get(
        `/v1/tenants/${tenantId}/users/${invalidTenantUserId}`,
      )

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Validation Failed')
    })

    it('should return 500 when database error occurs', async () => {
      mockTMSRepository.getTenantUser.mockRejectedValue(
        new Error('Database connection failed'),
      )

      const response = await request(app).get(
        `/v1/tenants/${tenantId}/users/${tenantUserId}`,
      )

      expect(response.status).toBe(500)
      expect(response.body.message).toBe('Database connection failed')
    })

    it('should return 400 when service throws bad request error', async () => {
      mockTMSRepository.getTenantUser.mockRejectedValue(
        new BadRequestError('Invalid tenant user request'),
      )

      const response = await request(app).get(
        `/v1/tenants/${tenantId}/users/${tenantUserId}`,
      )

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        errorMessage: 'Bad Request',
        httpResponseCode: 400,
        message: 'Invalid tenant user request',
        name: 'Error occurred getting tenant user',
      })
    })
  })

  describe('DELETE /v1/tenants/:tenantId/users/:tenantUserId', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const tenantUserId = '123e4567-e89b-12d3-a456-426614174001'

    beforeEach(() => {
      app.delete(
        '/v1/tenants/:tenantId/users/:tenantUserId',
        validate(validator.removeTenantUser, {}, {}),
        (req, res) => tmsController.removeTenantUser(req, res),
      )

      const validationErrorHandler: ErrorRequestHandler = (
        err,
        req,
        res,
        next,
      ) => {
        if (
          err &&
          typeof err === 'object' &&
          'name' in err &&
          (err as { name: string }).name === 'ValidationError'
        ) {
          return res
            .status((err as { statusCode: number }).statusCode)
            .json(err)
        }
        next(err)
      }
      app.use(validationErrorHandler)
    })

    it('should remove tenant user successfully', async () => {
      mockTMSRepository.removeTenantUser.mockResolvedValue(undefined)
      mockGroupRepository.removeUserFromAllGroups.mockResolvedValue(undefined)

      const response = await request(app).delete(
        `/v1/tenants/${tenantId}/users/${tenantUserId}`,
      )

      expect(response.status).toBe(204)
      expect(mockTMSRepository.removeTenantUser).toHaveBeenCalled()
      expect(mockGroupRepository.removeUserFromAllGroups).toHaveBeenCalled()
    })

    it('should return 404 when tenant user not found', async () => {
      mockTMSRepository.removeTenantUser.mockRejectedValue(
        new NotFoundError(
          `Tenant user not found or already deleted: ${tenantUserId}`,
        ),
      )

      const response = await request(app).delete(
        `/v1/tenants/${tenantId}/users/${tenantUserId}`,
      )

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: `Tenant user not found or already deleted: ${tenantUserId}`,
        name: 'Error occurred removing tenant user',
      })
    })

    it('should return 409 when trying to remove last tenant owner', async () => {
      mockTMSRepository.removeTenantUser.mockRejectedValue(
        new ConflictError(
          'Cannot remove the last tenant owner. At least one tenant owner must remain.',
        ),
      )

      const response = await request(app).delete(
        `/v1/tenants/${tenantId}/users/${tenantUserId}`,
      )

      expect(response.status).toBe(409)
      expect(response.body).toMatchObject({
        errorMessage: 'Conflict',
        httpResponseCode: 409,
        message:
          'Cannot remove the last tenant owner. At least one tenant owner must remain.',
        name: 'Error occurred removing tenant user',
      })
    })

    it('should return 400 when tenant ID is invalid', async () => {
      const response = await request(app).delete(
        `/v1/tenants/invalid-uuid/users/${tenantUserId}`,
      )

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        name: 'ValidationError',
        message: 'Validation Failed',
        details: {
          params: [
            {
              message: '"tenantId" must be a valid GUID',
            },
          ],
        },
      })
    })

    it('should return 400 when tenant user ID is invalid', async () => {
      const response = await request(app).delete(
        `/v1/tenants/${tenantId}/users/invalid-uuid`,
      )

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        name: 'ValidationError',
        message: 'Validation Failed',
        details: {
          params: [
            {
              message: '"tenantUserId" must be a valid GUID',
            },
          ],
        },
      })
    })

    it('should return 500 when database error occurs', async () => {
      mockTMSRepository.removeTenantUser.mockRejectedValue(
        new Error('Database connection failed'),
      )

      const response = await request(app).delete(
        `/v1/tenants/${tenantId}/users/${tenantUserId}`,
      )

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: 'Database connection failed',
        name: 'Error occurred removing tenant user',
      })
    })

    it('should handle transaction rollback when removeTenantUser succeeds but removeUserFromAllGroups fails', async () => {
      mockTMSRepository.removeTenantUser.mockResolvedValue(undefined)
      mockGroupRepository.removeUserFromAllGroups.mockRejectedValue(
        new Error('Database error during group removal'),
      )

      const response = await request(app).delete(
        `/v1/tenants/${tenantId}/users/${tenantUserId}`,
      )

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: 'Database error during group removal',
        name: 'Error occurred removing tenant user',
      })
      expect(mockTMSRepository.removeTenantUser).toHaveBeenCalled()
      expect(mockGroupRepository.removeUserFromAllGroups).toHaveBeenCalled()
    })

    it('should return 400 when service throws bad request error', async () => {
      mockTMSRepository.removeTenantUser.mockRejectedValue(
        new BadRequestError('Tenant user cannot be removed'),
      )

      const response = await request(app).delete(
        `/v1/tenants/${tenantId}/users/${tenantUserId}`,
      )

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        errorMessage: 'Bad Request',
        httpResponseCode: 400,
        message: 'Tenant user cannot be removed',
        name: 'Error occurred removing tenant user',
      })
    })
  })

  describe('GET /v1/users/bcgovssousers/idir/search', () => {
    beforeEach(() => {
      app.get(
        '/v1/users/bcgovssousers/idir/search',
        validate(validator.searchBCGOVSSOUsers, {}, {}),
        (req, res) => tmsController.searchBCGOVSSOUsers(req, res),
      )

      const validationErrorHandler: ErrorRequestHandler = (
        err,
        req,
        res,
        next,
      ) => {
        if (
          err &&
          typeof err === 'object' &&
          'name' in err &&
          (err as { name: string }).name === 'ValidationError'
        ) {
          return res
            .status((err as { statusCode: number }).statusCode)
            .json(err)
        }
        next(err)
      }
      app.use(validationErrorHandler)
    })

    it('should search IDIR users by email successfully', async () => {
      const mockSearchResults = {
        data: [
          {
            guid: 'F45AFBBD68C51D6F956BA3A1DE1878A1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@gov.bc.ca',
            displayName: 'Doe, John',
          },
        ],
      }

      const mockToken = 'mock-access-token'
      const mockAxiosGet = jest
        .fn()
        .mockResolvedValue({ data: mockSearchResults })
      const mockAxiosPost = jest
        .fn()
        .mockResolvedValue({ data: { access_token: mockToken } })

      jest.doMock('axios', () => ({
        default: {
          get: mockAxiosGet,
          post: mockAxiosPost,
        },
      }))

      jest
        .spyOn(tmsController.tmsService, 'searchBCGOVSSOUsers')
        .mockResolvedValue(mockSearchResults as unknown)

      const response = await request(app)
        .get('/v1/users/bcgovssousers/idir/search')
        .query({ email: 'john.doe@gov.bc.ca' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockSearchResults)
    })

    it('should search IDIR users by firstName successfully', async () => {
      const mockSearchResults = {
        data: [
          {
            guid: 'F45AFBBD68C51D6F956BA3A1DE1878A2',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@gov.bc.ca',
            displayName: 'Smith, Jane',
          },
        ],
      }

      jest
        .spyOn(tmsController.tmsService, 'searchBCGOVSSOUsers')
        .mockResolvedValue(mockSearchResults as unknown)

      const response = await request(app)
        .get('/v1/users/bcgovssousers/idir/search')
        .query({ firstName: 'Jane' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockSearchResults)
    })

    it('should search IDIR users by lastName successfully', async () => {
      const mockSearchResults = {
        data: [
          {
            guid: 'F45AFBBD68C51D6F956BA3A1DE1878A3',
            firstName: 'Bob',
            lastName: 'Johnson',
            email: 'bob.johnson@gov.bc.ca',
            displayName: 'Johnson, Bob',
          },
        ],
      }

      jest
        .spyOn(tmsController.tmsService, 'searchBCGOVSSOUsers')
        .mockResolvedValue(mockSearchResults as unknown)

      const response = await request(app)
        .get('/v1/users/bcgovssousers/idir/search')
        .query({ lastName: 'Johnson' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockSearchResults)
    })

    it('should search IDIR users by guid successfully', async () => {
      const mockSearchResults = {
        data: [
          {
            guid: 'F45AFBBD68C51D6F956BA3A1DE1878A4',
            firstName: 'Alice',
            lastName: 'Williams',
            email: 'alice.williams@gov.bc.ca',
            displayName: 'Williams, Alice',
          },
        ],
      }

      jest
        .spyOn(tmsController.tmsService, 'searchBCGOVSSOUsers')
        .mockResolvedValue(mockSearchResults as unknown)

      const response = await request(app)
        .get('/v1/users/bcgovssousers/idir/search')
        .query({ guid: 'F45AFBBD68C51D6F956BA3A1DE1878A4' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockSearchResults)
    })

    it('should deduplicate IDIR users by guid by default', async () => {
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

      jest
        .spyOn(
          tmsController.tmsService as unknown as {
            getToken: () => Promise<string>
          },
          'getToken',
        )
        .mockResolvedValue('mock-access-token')
      jest.spyOn(axios, 'get').mockResolvedValue({ data: mockSearchResults })

      const response = await request(app)
        .get('/v1/users/bcgovssousers/idir/search')
        .query({ email: 'john.doe@gov.bc.ca' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        data: [mockSearchResults.data[1], mockSearchResults.data[2]],
      })
      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: { email: 'john.doe@gov.bc.ca' },
        }),
      )
    })

    it('should return empty array when no users found', async () => {
      const mockSearchResults = { data: [] }

      jest
        .spyOn(tmsController.tmsService, 'searchBCGOVSSOUsers')
        .mockResolvedValue(mockSearchResults as unknown)

      const response = await request(app)
        .get('/v1/users/bcgovssousers/idir/search')
        .query({ email: 'nonexistent@gov.bc.ca' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockSearchResults)
    })

    it('should return 400 when no search parameters provided', async () => {
      const response = await request(app).get(
        '/v1/users/bcgovssousers/idir/search',
      )

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Validation Failed')
    })

    it('should return 400 when firstName is too short', async () => {
      const response = await request(app)
        .get('/v1/users/bcgovssousers/idir/search')
        .query({ firstName: 'A' })

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Validation Failed')
    })

    it('should return 400 when dedup query parameter is provided', async () => {
      const response = await request(app)
        .get('/v1/users/bcgovssousers/idir/search')
        .query({ email: 'john.doe@gov.bc.ca', dedup: 'true' })

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Validation Failed')
    })

    it('should return 400 when lastName is too short', async () => {
      const response = await request(app)
        .get('/v1/users/bcgovssousers/idir/search')
        .query({ lastName: 'B' })

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Validation Failed')
    })

    it('should return 400 when BC GOV SSO API returns bad request', async () => {
      const error = {
        response: {
          status: 400,
          data: { message: 'Invalid search parameters' },
        },
      }

      jest
        .spyOn(tmsController.tmsService, 'searchBCGOVSSOUsers')
        .mockRejectedValue(
          new BadRequestError(
            `BC GOV SSO API returned bad request: ${error.response.data.message}`,
          ),
        )

      const response = await request(app)
        .get('/v1/users/bcgovssousers/idir/search')
        .query({ email: 'invalid@email' })

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        errorMessage: 'Bad Request',
        httpResponseCode: 400,
        message: expect.stringContaining('BC GOV SSO API returned bad request'),
        name: 'Error occurred searching SSO users',
      })
    })

    it('should return 500 when API error occurs', async () => {
      jest
        .spyOn(tmsController.tmsService, 'searchBCGOVSSOUsers')
        .mockRejectedValue(new Error('Error invoking BC GOV SSO API'))

      const response = await request(app)
        .get('/v1/users/bcgovssousers/idir/search')
        .query({ email: 'test@gov.bc.ca' })

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: 'Error invoking BC GOV SSO API',
        name: 'Error occurred searching SSO users',
      })
    })
  })

  describe('GET /v1/users/bcgovssousers/bceid/search', () => {
    beforeEach(() => {
      app.get(
        '/v1/users/bcgovssousers/bceid/search',
        validate(validator.searchBCGOVSSOBceidUsers, {}, {}),
        (req, res) => tmsController.searchBCGOVSSOBceidUsers(req, res),
      )

      const validationErrorHandler: ErrorRequestHandler = (
        err,
        req,
        res,
        next,
      ) => {
        if (
          err &&
          typeof err === 'object' &&
          'name' in err &&
          (err as { name: string }).name === 'ValidationError'
        ) {
          return res
            .status((err as { statusCode: number }).statusCode)
            .json(err)
        }
        next(err)
      }
      app.use(validationErrorHandler)
    })

    it('should search BCEID users by displayName successfully', async () => {
      const mockSearchResults = {
        data: [
          {
            guid: 'F45AFBBD68C51D6F956BA3A1DE1878B2',
            displayName: 'Business User',
            username: 'businessuser',
            bceidType: 'business',
          },
        ],
      }

      jest
        .spyOn(tmsController.tmsService, 'searchBCGOVSSOBceidUsers')
        .mockResolvedValue(mockSearchResults as unknown)

      const response = await request(app)
        .get('/v1/users/bcgovssousers/bceid/search')
        .query({ bceidType: 'business', displayName: 'Business User' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockSearchResults)
    })

    it('should search BCEID users with business type before filtering to business users', async () => {
      const mockSearchResults = {
        data: [
          {
            firstName: 'Business',
            lastName: 'User',
            email: 'business.user@example.com',
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

      jest
        .spyOn(
          tmsController.tmsService as unknown as {
            getToken: () => Promise<string>
          },
          'getToken',
        )
        .mockResolvedValue('mock-access-token')
      jest.spyOn(axios, 'get').mockResolvedValue({ data: mockSearchResults })

      const response = await request(app)
        .get('/v1/users/bcgovssousers/bceid/search')
        .query({
          bceidType: 'business',
          username: 'business.user',
        })

      expect(response.status).toBe(200)
      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: { bceidType: 'business', username: 'business.user' },
        }),
      )
    })

    it('should accept both BCEID search type and filter out basic BCEID users', async () => {
      const mockSearchResults = {
        data: [
          {
            firstName: 'Basic',
            lastName: 'User',
            email: 'basic.user@example.com',
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
            email: 'business.user@example.com',
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

      jest
        .spyOn(
          tmsController.tmsService as unknown as {
            getToken: () => Promise<string>
          },
          'getToken',
        )
        .mockResolvedValue('mock-access-token')
      jest.spyOn(axios, 'get').mockResolvedValue({ data: mockSearchResults })

      const response = await request(app)
        .get('/v1/users/bcgovssousers/bceid/search')
        .query({
          bceidType: 'both',
          username: 'business.user',
        })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        data: [mockSearchResults.data[1]],
      })
      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: { bceidType: 'business', username: 'business.user' },
        }),
      )
    })

    it('should deduplicate BCEID users by guid by default', async () => {
      const mockSearchResults = {
        data: [
          {
            firstName: 'Master',
            lastName: '',
            email: '',
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
            email: 'master.chief@example.com',
            username: 'guid-1@bceidbusiness',
            attributes: {
              bceid_user_guid: ['GUID-1'],
              bceid_username: ['USER1'],
              display_name: ['Master Chief'],
              bceid_business_guid: ['BUSINESS-GUID-1'],
            },
          },
          {
            firstName: 'Shankar',
            lastName: 'Sethuraman',
            email: 'shankar@example.com',
            username: 'guid-2@bceidbusiness',
            attributes: {
              bceid_user_guid: ['GUID-2'],
              bceid_username: ['USER2'],
              display_name: ['Shankar Sethuraman'],
              bceid_business_guid: ['BUSINESS-GUID-2'],
            },
          },
        ],
      }

      jest
        .spyOn(
          tmsController.tmsService as unknown as {
            getToken: () => Promise<string>
          },
          'getToken',
        )
        .mockResolvedValue('mock-access-token')
      jest.spyOn(axios, 'get').mockResolvedValue({ data: mockSearchResults })

      const response = await request(app)
        .get('/v1/users/bcgovssousers/bceid/search')
        .query({
          bceidType: 'business',
          username: 'user1',
        })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        data: [mockSearchResults.data[1], mockSearchResults.data[2]],
      })
      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: { bceidType: 'business', username: 'user1' },
        }),
      )
    })

    it('should return empty array when no users found', async () => {
      const mockSearchResults = { data: [] }

      jest
        .spyOn(tmsController.tmsService, 'searchBCGOVSSOBceidUsers')
        .mockResolvedValue(mockSearchResults as unknown)

      const response = await request(app)
        .get('/v1/users/bcgovssousers/bceid/search')
        .query({ bceidType: 'business', guid: 'NONEXISTENT' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockSearchResults)
    })

    it('should default to business when bceidType is missing', async () => {
      const mockSearchResults = { data: [] }

      jest
        .spyOn(tmsController.tmsService, 'searchBCGOVSSOBceidUsers')
        .mockResolvedValue(mockSearchResults as unknown)

      const response = await request(app)
        .get('/v1/users/bcgovssousers/bceid/search')
        .query({ guid: 'F45AFBBD68C51D6F956BA3A1DE1878B1' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockSearchResults)
    })

    it('should return 400 when bceidType is invalid', async () => {
      const response = await request(app)
        .get('/v1/users/bcgovssousers/bceid/search')
        .query({
          bceidType: 'invalid',
          guid: 'F45AFBBD68C51D6F956BA3A1DE1878B1',
        })

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Validation Failed')
    })

    it('should return 400 when dedup query parameter is provided', async () => {
      const response = await request(app)
        .get('/v1/users/bcgovssousers/bceid/search')
        .query({
          bceidType: 'business',
          guid: 'F45AFBBD68C51D6F956BA3A1DE1878B1',
          dedup: 'true',
        })

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Validation Failed')
    })

    it('should return 400 when BC GOV SSO BCEID API returns bad request', async () => {
      const error = {
        response: {
          status: 400,
          data: { message: 'Invalid search parameters' },
        },
      }

      jest
        .spyOn(tmsController.tmsService, 'searchBCGOVSSOBceidUsers')
        .mockRejectedValue(
          new BadRequestError(
            `BC GOV SSO BCEID API returned bad request: ${error.response.data.message}`,
          ),
        )

      const response = await request(app)
        .get('/v1/users/bcgovssousers/bceid/search')
        .query({ bceidType: 'business', guid: 'invalid' })

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        errorMessage: 'Bad Request',
        httpResponseCode: 400,
        message: expect.stringContaining(
          'BC GOV SSO BCEID API returned bad request',
        ),
        name: 'Error occurred searching BCEID users',
      })
    })

    it('should return 500 when API error occurs', async () => {
      jest
        .spyOn(tmsController.tmsService, 'searchBCGOVSSOBceidUsers')
        .mockRejectedValue(new Error('Error invoking BC GOV SSO BCEID API'))

      const response = await request(app)
        .get('/v1/users/bcgovssousers/bceid/search')
        .query({
          bceidType: 'business',
          guid: 'F45AFBBD68C51D6F956BA3A1DE1878B1',
        })

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: 'Error invoking BC GOV SSO BCEID API',
        name: 'Error occurred searching BCEID users',
      })
    })
  })
})
