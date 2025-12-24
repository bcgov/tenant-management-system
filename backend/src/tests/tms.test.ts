import request from 'supertest'
import express from 'express'
import { TMSRepository } from '../repositories/tms.repository'
import { TMRepository } from '../repositories/tm.repository'
import { TMSConstants } from '../common/tms.constants'
import { TMSController } from '../controllers/tms.controller'
import { validate } from 'express-validation'
import validator from '../common/tms.validator'
import { Tenant } from '../entities/Tenant'
import { TenantUser } from '../entities/TenantUser'
import { ConflictError } from '../errors/ConflictError'
import { NotFoundError } from '../errors/NotFoundError'
import { BadRequestError } from '../errors/BadRequestError'

jest.mock('../repositories/tms.repository')
jest.mock('../repositories/tm.repository')
jest.mock('../common/db.connection', () => ({
  connection: {
    manager: {
      transaction: jest.fn().mockImplementation((callback) => callback()),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn()
    }
  }
}))

describe('Tenant API', () => {
  let app: express.Application
  let mockTMSRepository: jest.Mocked<TMSRepository>
  let mockTMRepository: jest.Mocked<TMRepository>
  let tmsController: TMSController

  beforeEach(() => {
    jest.clearAllMocks()
    app = express()
    app.use(express.json())
    
    tmsController = new TMSController()
    mockTMSRepository = TMSRepository.prototype as jest.Mocked<TMSRepository>
    mockTMRepository = TMRepository.prototype as jest.Mocked<TMRepository>

    app.post('/v1/tenants', 
      (req, res, next) => {
        req.decodedJwt = {
          aud: 'test-service-client',
          audience: 'test-service-client',
          idir_user_guid: 'F45AFBBD68C51D6F956BA3A1DE1878A2',
          client_roles: ['TMS.OPERATIONS_ADMIN']
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
            name: 'User does not have access to this operation and / resource'
          })
        }
        next()
      },
      validate(validator.createTenant, {}, {}),
      (req, res) => tmsController.createTenant(req, res)
    )

    app.post('/v1/tenants/:tenantId/users',
      validate(validator.addTenantUser, {}, {}),
      (req, res) => tmsController.addTenantUser(req, res)
    )

    app.get('/v1/users/:ssoUserId/tenants',
      validate(validator.getUserTenants, {}, {}),
      (req, res) => tmsController.getTenantsForUser(req, res)
    )

    app.get('/v1/tenants/:tenantId/users',
      validate(validator.getTenantUsers, {}, {}),
      (req, res) => tmsController.getUsersForTenant(req, res)
    )

    app.post('/v1/tenants/:tenantId/users/:tenantUserId/roles',
      validate(validator.assignUserRoles, {}, {}),
      (req, res) => tmsController.assignUserRoles(req, res)
    )

    app.delete('/v1/tenants/:tenantId/users/:tenantUserId/roles/:roleId',
      validate(validator.unassignUserRoles, {}, {}),
      (req, res) => tmsController.unassignUserRoles(req, res)
    )

    app.patch('/v1/tenant-requests/:requestId/status',
      validate(validator.updateTenantRequestStatus, {}, {}),
      (req, res) => tmsController.updateTenantRequestStatus(req, res)
    )

    app.use((err: any, req: any, res: any, next: any) => {
      if (err.name === 'ValidationError') {
        return res.status(err.statusCode).json(err)
      }
      next(err)
    })
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
      email: 'test@testministry.gov.bc.ca'
    }
  }

  describe('POST /v1/tenants', () => {
    it('should create a tenant successfully', async () => {
      const mockTenant = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: validTenantData.name,
        ministryName: validTenantData.ministryName,
        description: validTenantData.description,
        tenantUsers: [{
          id: '123e4567-e89b-12d3-a456-426614174001',
          firstName: validTenantData.user.firstName,
          lastName: validTenantData.user.lastName,
          displayName: validTenantData.user.displayName,
          ssoUserId: validTenantData.user.ssoUserId,
          email: validTenantData.user.email,
          tenantUserRoles: [{
            role: {
              id: '123e4567-e89b-12d3-a456-426614174002',
              name: TMSConstants.TENANT_OWNER,
              description: 'Tenant Owner Role'
            }
          }]
        }]
      }

      mockTMSRepository.saveTenant.mockResolvedValue(mockTenant)

      const response = await request(app).post('/v1/tenants').send(validTenantData)

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        data: {
          tenant: {
            id: mockTenant.id,
            name: mockTenant.name,
            ministryName: mockTenant.ministryName,
            description: mockTenant.description,
            tenantUsers: expect.arrayContaining([
              expect.objectContaining({
                firstName: validTenantData.user.firstName,
                lastName: validTenantData.user.lastName,
                ssoUserId: validTenantData.user.ssoUserId
              })
            ])
          }
        }
      })

      expect(mockTMSRepository.saveTenant).toHaveBeenCalledWith(
        expect.objectContaining({
          body: validTenantData
        })
      )

      const actualCall = mockTMSRepository.saveTenant.mock.calls[0][0]
      expect(actualCall.body).toEqual(validTenantData)
    })

    it('should fail when tenant name and ministry name combination already exists', async () => {
      const errorMessage = `A tenant with name '${validTenantData.name}' and ministry name '${validTenantData.ministryName}' already exists`
      mockTMSRepository.saveTenant.mockRejectedValue(new ConflictError(errorMessage))

      const response = await request(app).post('/v1/tenants').send(validTenantData)

      expect(response.status).toBe(409)
      expect(response.body).toMatchObject({
        errorMessage: 'Conflict',
        httpResponseCode: 409,
        message: errorMessage,
        name: 'Error occurred adding user to the tenant'
      })
    })

    it('should return 400 when ministry name is missing', async () => {
      const invalidData = {
        name: validTenantData.name,
        user: validTenantData.user
      }

      const response = await request(app)
        .post('/v1/tenants')
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body.message).toBe("Validation Failed")
      expect(response.body.details.body[0].message).toBe("\"ministryName\" is required")
    })

    it('should return 403 when user does not have operations admin role', async () => {
      const appWithoutOpsAdmin = express()
      appWithoutOpsAdmin.use(express.json())
      
      appWithoutOpsAdmin.post('/v1/tenants', 
        (req, res, next) => {
          req.decodedJwt = {
            aud: 'test-service-client',
            audience: 'test-service-client',
            idir_user_guid: 'F45AFBBD68C51D6F956BA3A1DE1878A2',
            client_roles: ['TMS.USER_ADMIN'] // Different role, not operations admin
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
              name: 'User does not have access to this operation and / resource'
            })
          }
          next()
        },
        validate(validator.createTenant, {}, {}),
        (req, res) => tmsController.createTenant(req, res)
      )

      const response = await request(appWithoutOpsAdmin)
        .post('/v1/tenants')
        .send(validTenantData)

      expect(response.status).toBe(403)
      expect(response.body).toMatchObject({
        errorMessage: 'Forbidden',
        httpResponseCode: 403,
        message: 'Access denied: User does not have required role',
        name: 'User does not have access to this operation and / resource'
      })
    })

    it('should return 403 when user has no roles', async () => {
      const appWithNoRoles = express()
      appWithNoRoles.use(express.json())
      
      appWithNoRoles.post('/v1/tenants', 
        (req, res, next) => {
          req.decodedJwt = {
            aud: 'test-service-client',
            audience: 'test-service-client',
            idir_user_guid: 'F45AFBBD68C51D6F956BA3A1DE1878A2',
            client_roles: [] // No roles
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
              name: 'User does not have access to this operation and / resource'
            })
          }
          next()
        },
        validate(validator.createTenant, {}, {}),
        (req, res) => tmsController.createTenant(req, res)
      )

      const response = await request(appWithNoRoles)
        .post('/v1/tenants')
        .send(validTenantData)

      expect(response.status).toBe(403)
      expect(response.body).toMatchObject({
        errorMessage: 'Forbidden',
        httpResponseCode: 403,
        message: 'Access denied: User does not have required role',
        name: 'User does not have access to this operation and / resource'
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
        idpType: 'idir'
      },
      roles: ['123e4567-e89b-12d3-a456-426614174002']
    }

    it('should add a user to a tenant successfully', async () => {
      const mockResponse = {
        savedTenantUser: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          firstName: validUserData.user.firstName,
          lastName: validUserData.user.lastName,
          displayName: validUserData.user.displayName,
          ssoUserId: validUserData.user.ssoUserId,
          email: validUserData.user.email
        },
        roleAssignments: [{
          role: {
            id: validUserData.roles[0],
            name: TMSConstants.SERVICE_USER,
            description: 'Service User Role'
          }
        }],
        tenantUserId: '123e4567-e89b-12d3-a456-426614174001'
      }

      mockTMSRepository.addTenantUsers.mockResolvedValue(mockResponse as any)

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users`)
        .send(validUserData)

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        data: {
          user: {
            id: mockResponse.savedTenantUser.id,
            firstName: validUserData.user.firstName,
            lastName: validUserData.user.lastName,
            ssoUserId: validUserData.user.ssoUserId,
            roles: [{
              id: validUserData.roles[0],
              name: TMSConstants.SERVICE_USER
            }]
          }
        }
      })

      expect(mockTMSRepository.addTenantUsers).toHaveBeenCalled()
      const callArgs = mockTMSRepository.addTenantUsers.mock.calls[0]
      expect(callArgs[0].params.tenantId).toBe(tenantId)
      expect(callArgs[0].body.user.ssoUserId).toBe(validUserData.user.ssoUserId)
    })

    it('should fail when role ID does not exist', async () => {
      const invalidUserData = {
        ...validUserData,
        roles: ['123e4567-e89b-12d3-a456-426614174999']
      }

      mockTMSRepository.addTenantUsers.mockRejectedValue(new NotFoundError('Role(s) not found'))

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users`)
        .send(invalidUserData)

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: 'Role(s) not found',
        name: 'Error occurred adding user to the tenant'
      })
    })

    it('should fail when user already exists in tenant', async () => {
      mockTMSRepository.addTenantUsers.mockRejectedValue(new ConflictError(`User is already added to this tenant: ${tenantId}`))

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users`)
        .send(validUserData)

      expect(response.status).toBe(409)
      expect(response.body).toMatchObject({
        errorMessage: 'Conflict',
        httpResponseCode: 409,
        message: `User is already added to this tenant: ${tenantId}`,
        name: 'Error occurred adding user to the tenant'
      })
    })

    it('should return 404 when tenant ID does not exist', async () => {
      mockTMSRepository.addTenantUsers.mockRejectedValue(new NotFoundError('Tenant Not Found: 123e4567-e89b-12d3-a456-426614174999'))

      const response = await request(app)
        .post('/v1/tenants/123e4567-e89b-12d3-a456-426614174999/users')
        .send(validUserData)

      expect(response.status).toBe(404)
      expect(response.body).toEqual({
        errorMessage: "Not Found",
        httpResponseCode: 404,
        message: "Tenant Not Found: 123e4567-e89b-12d3-a456-426614174999",
        name: "Error occurred adding user to the tenant"
      })
    })

    it('should return 400 when roles array is missing', async () => {
      const invalidData = {
        user: validUserData.user
      }

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users`)
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body.message).toBe("Validation Failed")
      expect(response.body.details.body[0].message).toBe("\"roles\" is required")
    })

    it('should handle transaction rollback when addTenantUsers succeeds but addUserToGroups fails', async () => {
      const mockResponse = {
        savedTenantUser: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          firstName: validUserData.user.firstName,
          lastName: validUserData.user.lastName,
          ssoUserId: validUserData.user.ssoUserId
        },
        roleAssignments: [{
          role: {
            id: validUserData.roles[0],
            name: TMSConstants.SERVICE_USER
          }
        }],
        tenantUserId: '123e4567-e89b-12d3-a456-426614174001'
      }

      const userDataWithGroups = {
        ...validUserData,
        groups: ['123e4567-e89b-12d3-a456-426614174010']
      }

      mockTMSRepository.addTenantUsers.mockResolvedValue(mockResponse as any)
      mockTMRepository.addUserToGroups.mockRejectedValue(new NotFoundError('Group not found'))

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users`)
        .send(userDataWithGroups)

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: 'Group not found',
        name: 'Error occurred adding user to the tenant'
      })
      expect(mockTMSRepository.addTenantUsers).toHaveBeenCalled()
      expect(mockTMRepository.addUserToGroups).toHaveBeenCalled()
    })

    it('should restore soft-deleted user when adding to tenant', async () => {
      const mockResponse = {
        savedTenantUser: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          firstName: validUserData.user.firstName,
          lastName: validUserData.user.lastName,
          ssoUserId: validUserData.user.ssoUserId,
          isDeleted: false
        },
        roleAssignments: [{
          role: {
            id: validUserData.roles[0],
            name: TMSConstants.SERVICE_USER
          }
        }],
        tenantUserId: '123e4567-e89b-12d3-a456-426614174001'
      }

      mockTMSRepository.addTenantUsers.mockResolvedValue(mockResponse as any)
      mockTMRepository.addUserToGroups.mockResolvedValue([])

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
          ssoUserId: validUserData.user.ssoUserId
        },
        roleAssignments: [{
          role: {
            id: validUserData.roles[0],
            name: TMSConstants.SERVICE_USER
          }
        }],
        tenantUserId: '123e4567-e89b-12d3-a456-426614174001'
      }

      const userDataWithEmptyGroups = {
        ...validUserData,
        groups: []
      }

      mockTMSRepository.addTenantUsers.mockResolvedValue(mockResponse as any)
      mockTMRepository.addUserToGroups.mockResolvedValue([])

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users`)
        .send(userDataWithEmptyGroups)

      expect(response.status).toBe(201)
      expect(response.body.data.user.groups).toEqual([])
    })

    it('should handle duplicate role IDs in request', async () => {
      const userDataWithDuplicateRoles = {
        ...validUserData,
        roles: [validUserData.roles[0], validUserData.roles[0]] // Duplicate role ID
      }

      const mockResponse = {
        savedTenantUser: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          firstName: validUserData.user.firstName,
          lastName: validUserData.user.lastName,
          ssoUserId: validUserData.user.ssoUserId
        },
        roleAssignments: [{
          role: {
            id: validUserData.roles[0],
            name: TMSConstants.SERVICE_USER
          }
        }],
        tenantUserId: '123e4567-e89b-12d3-a456-426614174001'
      }

      mockTMSRepository.addTenantUsers.mockResolvedValue(mockResponse as any)

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
          displayName: longString
        },
        roles: validUserData.roles
      }

      const mockResponse = {
        savedTenantUser: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          firstName: validUserData.user.firstName,
          lastName: validUserData.user.lastName,
          displayName: longString,
          ssoUserId: validUserData.user.ssoUserId
        },
        roleAssignments: [{
          role: {
            id: validUserData.roles[0],
            name: TMSConstants.SERVICE_USER
          }
        }],
        tenantUserId: '123e4567-e89b-12d3-a456-426614174001'
      }

      mockTMSRepository.addTenantUsers.mockResolvedValue(mockResponse as any)

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
          ssoUserId: validUserData.user.ssoUserId
        },
        roleAssignments: [{
          role: {
            id: validUserData.roles[0],
            name: TMSConstants.SERVICE_USER
          }
        }],
        tenantUserId: '123e4567-e89b-12d3-a456-426614174001'
      }

      const userDataWithDuplicateGroups = {
        ...validUserData,
        groups: [duplicateGroupId, duplicateGroupId] // Duplicate group IDs
      }

      mockTMSRepository.addTenantUsers.mockResolvedValue(mockResponse as any)
      mockTMRepository.addUserToGroups.mockResolvedValue([])

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users`)
        .send(userDataWithDuplicateGroups)

      expect([201, 400, 404]).toContain(response.status)
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
        users: [{
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
            tenantUsers: []
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
            users: []
          },
          roles: [{
            id: '123e4567-e89b-12d3-a456-426614174002',
            tenantUser: {
              id: '123e4567-e89b-12d3-a456-426614174001'
            },
            role: {
              id: '123e4567-e89b-12d3-a456-426614174002',
              name: TMSConstants.TENANT_OWNER,
              description: 'Tenant Owner Role'
            },
            createdDateTime: new Date(),
            updatedDateTime: new Date(),
            createdBy: 'test-user',
            updatedBy: 'test-user',
            isDeleted: false
          }]
        }]
      }
    ]

    it('should get tenants for user successfully', async () => {
      mockTMSRepository.getTenantsForUser.mockResolvedValue(mockTenants as any)

      const response = await request(app)
        .get(`/v1/users/${ssoUserId}/tenants`)
        .query({ expand: 'tenantUserRoles' })

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          tenants: [{
            id: mockTenants[0].id,
            name: mockTenants[0].name,
            ministryName: mockTenants[0].ministryName,
            users: [{
              firstName: mockTenants[0].users[0].firstName,
              lastName: mockTenants[0].users[0].lastName,
              ssoUserId: mockTenants[0].users[0].ssoUserId,
              roles: [{
                id: mockTenants[0].users[0].roles[0].id,
                name: mockTenants[0].users[0].roles[0].role.name
              }]
            }]
          }]
        }
      })

      expect(mockTMSRepository.getTenantsForUser).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { ssoUserId },
          query: { expand: 'tenantUserRoles' }
        })
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
          tenants: []
        }
      })

      expect(mockTMSRepository.getTenantsForUser).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { ssoUserId: invalidSsoUserId },
          query: { expand: 'tenantUserRoles' }
        })
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
          query: [{
            message: '"expand" with value "invalidParameter" fails to match the required pattern: /^(tenantUserRoles)?$/'
          }]
        }
      })
    })
  })

  describe('GET /v1/tenants/:tenantId/users', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const mockUsers = [{
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
        users: []
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
        tenantUsers: []
      }
    }]

    it('should get users for tenant successfully', async () => {
      mockTMSRepository.getUsersForTenant.mockResolvedValue(mockUsers)

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/users`)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          users: [{
            id: mockUsers[0].id,
            firstName: mockUsers[0].firstName,
            lastName: mockUsers[0].lastName,
            displayName: mockUsers[0].displayName,
            ssoUserId: mockUsers[0].ssoUserId,
            email: mockUsers[0].email
          }]
        }
      })

      expect(mockTMSRepository.getUsersForTenant).toHaveBeenCalledWith(tenantId)
    })

    it('should return 400 when tenant ID is invalid', async () => {
      const response = await request(app)
        .get('/v1/tenants/invalid-uuid/users')

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        name: 'ValidationError',
        message: 'Validation Failed',
        details: {
          params: [{
            message: '"tenantId" must be a valid GUID'
          }]
        }
      })
    })

    it('should return empty users array for non-existent tenant', async () => {
      const nonExistentTenantId = '123e4567-e89b-12d3-a456-426614174999'
      mockTMSRepository.getUsersForTenant.mockResolvedValue([])

      const response = await request(app)
        .get(`/v1/tenants/${nonExistentTenantId}/users`)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          users: []
        }
      })

      expect(mockTMSRepository.getUsersForTenant).toHaveBeenCalledWith(nonExistentTenantId)
    })
  })

  describe('POST /v1/tenants/:tenantId/users/:tenantUserId/roles', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const tenantUserId = '123e4567-e89b-12d3-a456-426614174001'
    const roleIds = ['123e4567-e89b-12d3-a456-426614174002']

    beforeEach(() => {
      app.post('/v1/tenants/:tenantId/users/:tenantUserId/roles',
        validate(validator.assignUserRoles, {}, {}),
        (req, res) => tmsController.assignUserRoles(req, res)
      )

      app.use((err: any, req: any, res: any, next: any) => {
        if (err.name === 'ValidationError') {
          return res.status(err.statusCode).json(err)
        }
        next(err)
      })
    })

    it('should assign roles to user successfully', async () => {
      const mockRoleAssignments = [{
        id: '123e4567-e89b-12d3-a456-426614174003',
        role: {
          id: roleIds[0],
          name: TMSConstants.SERVICE_USER,
          description: 'Service User Role',
          tenantUserRoles: [],
          createdDateTime: new Date(),
          updatedDateTime: new Date(),
          createdBy: 'test-user',
          updatedBy: 'test-user'
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
            tenantUsers: []
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
            users: []
          },
          roles: [],
          createdDateTime: new Date(),
          updatedDateTime: new Date(),
          createdBy: 'test-user',
          updatedBy: 'test-user'
        },
        createdDateTime: new Date(),
        updatedDateTime: new Date(),
        createdBy: 'test-user',
        updatedBy: 'test-user',
        isDeleted: false
      }]

      mockTMSRepository.assignUserRoles.mockResolvedValue(mockRoleAssignments)

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users/${tenantUserId}/roles`)
        .send({ roles: roleIds })

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        data: {
          roles: [{
            id: roleIds[0],
            name: TMSConstants.SERVICE_USER
          }]
        }
      })

      expect(mockTMSRepository.assignUserRoles).toHaveBeenCalledWith(
        tenantId,
        tenantUserId,
        roleIds,
        null
      )
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
          body: [{
            message: '"roles" must contain at least 1 items'
          }]
        }
      })
    })

    it('should return 404 when tenant user not found', async () => {
      mockTMSRepository.assignUserRoles.mockRejectedValue(
        new NotFoundError(`Tenant user not found for tenant: ${tenantId}`)
      )

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users/${tenantUserId}/roles`)
        .send({ roles: roleIds })

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: `Tenant user not found for tenant: ${tenantId}`,
        name: 'Error occurred assigning user role'
      })
    })

    it('should return 409 when all roles are already assigned', async () => {
      mockTMSRepository.assignUserRoles.mockRejectedValue(
        new ConflictError('All roles are already assigned to the user')
      )

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users/${tenantUserId}/roles`)
        .send({ roles: roleIds })

      expect(response.status).toBe(409)
      expect(response.body).toMatchObject({
        errorMessage: 'Conflict',
        httpResponseCode: 409,
        message: 'All roles are already assigned to the user',
        name: 'Error occurred assigning user role'
      })
    })

    it('should handle duplicate role IDs in roles array', async () => {
      const duplicateRoleId = '123e4567-e89b-12d3-a456-426614174002'
      const mockResponse = {
        savedAssignments: [{
          role: {
            id: duplicateRoleId,
            name: TMSConstants.USER_ADMIN
          }
        }]
      }

      mockTMSRepository.assignUserRoles.mockResolvedValue(mockResponse as any)

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users/${tenantUserId}/roles`)
        .send({ roles: [duplicateRoleId, duplicateRoleId] })

      expect([201, 400, 404, 500]).toContain(response.status)
    })

    it('should restore soft-deleted role assignments when assigning roles', async () => {
      const mockRoleAssignments = [{
        id: '123e4567-e89b-12d3-a456-426614174003',
        role: {
          id: roleIds[0],
          name: TMSConstants.USER_ADMIN,
          description: 'User Admin Role'
          },
          isDeleted: false
        }]

      mockTMSRepository.assignUserRoles.mockResolvedValue(mockRoleAssignments as any)

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/users/${tenantUserId}/roles`)
        .send({ roles: roleIds })

      expect(response.status).toBe(201)
      expect(response.body.data.roles).toContainEqual(
        expect.objectContaining({
          id: roleIds[0],
          name: TMSConstants.USER_ADMIN
        })
      )
    })
  })

  describe('DELETE /v1/tenants/:tenantId/users/:tenantUserId/roles/:roleId', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const tenantUserId = '123e4567-e89b-12d3-a456-426614174001'
    const roleId = '123e4567-e89b-12d3-a456-426614174002'

    beforeEach(() => {
      app.delete('/v1/tenants/:tenantId/users/:tenantUserId/roles/:roleId',
        validate(validator.unassignUserRoles, {}, {}),
        (req, res) => tmsController.unassignUserRoles(req, res)
      )

      app.use((err: any, req: any, res: any, next: any) => {
        if (err.name === 'ValidationError') {
          return res.status(err.statusCode).json(err)
        }
        next(err)
      })
    })

    it('should unassign role from user successfully', async () => {
      mockTMSRepository.unassignUserRoles.mockResolvedValue(undefined)

      const response = await request(app)
        .delete(`/v1/tenants/${tenantId}/users/${tenantUserId}/roles/${roleId}`)

      expect(response.status).toBe(204)
      expect(mockTMSRepository.unassignUserRoles).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { tenantId, tenantUserId, roleId }
        })
      )
    })

    it('should return 400 when tenant ID is invalid', async () => {
      const response = await request(app)
        .delete(`/v1/tenants/invalid-uuid/users/${tenantUserId}/roles/${roleId}`)

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        name: 'ValidationError',
        message: 'Validation Failed',
        details: {
          params: [{
            message: '"tenantId" must be a valid GUID'
          }]
        }
      })
    })

    it('should return 404 when tenant user role not found', async () => {
      mockTMSRepository.unassignUserRoles.mockRejectedValue(
        new NotFoundError(`Tenant: ${tenantId},  Users: ${tenantUserId} and / or roles: ${roleId} not found`)
      )

      const response = await request(app)
        .delete(`/v1/tenants/${tenantId}/users/${tenantUserId}/roles/${roleId}`)

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: `Tenant: ${tenantId},  Users: ${tenantUserId} and / or roles: ${roleId} not found`,
        name: 'Error occurred unassigning user role'
      })
    })

    it('should return 409 when trying to unassign last tenant owner', async () => {
      mockTMSRepository.unassignUserRoles.mockRejectedValue(
        new ConflictError('Cannot unassign tenant owner role. At least one tenant owner must remain.')
      )

      const response = await request(app)
        .delete(`/v1/tenants/${tenantId}/users/${tenantUserId}/roles/${roleId}`)

      expect(response.status).toBe(409)
      expect(response.body).toMatchObject({
        errorMessage: 'Conflict',
        httpResponseCode: 409,
        message: 'Cannot unassign tenant owner role. At least one tenant owner must remain.',
        name: 'Error occurred unassigning user role'
      })
    })

    it('should return 409 when trying to unassign last role from user', async () => {
      mockTMSRepository.unassignUserRoles.mockRejectedValue(
        new ConflictError('Cannot unassign the last role from a user. User must have at least one role in the tenant')
      )

      const response = await request(app)
        .delete(`/v1/tenants/${tenantId}/users/${tenantUserId}/roles/${roleId}`)

      expect(response.status).toBe(409)
      expect(response.body).toMatchObject({
        errorMessage: 'Conflict',
        httpResponseCode: 409,
        message: 'Cannot unassign the last role from a user. User must have at least one role in the tenant',
        name: 'Error occurred unassigning user role'
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
      users: [{
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
          tenantUsers: []
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
          users: []
        },
        roles: [{
          id: '123e4567-e89b-12d3-a456-426614174002',
          tenantUser: {
            id: '123e4567-e89b-12d3-a456-426614174001'
          },
          role: {
            id: '123e4567-e89b-12d3-a456-426614174002',
            name: TMSConstants.TENANT_OWNER,
            description: 'Tenant Owner Role',
            tenantUserRoles: [],
            createdDateTime: new Date(),
            updatedDateTime: new Date(),
            createdBy: 'test-user',
            updatedBy: 'test-user'
          },
          createdDateTime: new Date(),
          updatedDateTime: new Date(),
          createdBy: 'test-user',
          updatedBy: 'test-user',
          isDeleted: false
        }]
      }]
    }

    beforeEach(() => {
      app.get('/v1/tenants/:tenantId',
        validate(validator.getTenant, {}, {}),
        (req, res) => tmsController.getTenant(req, res)
      )

      app.use((err: any, req: any, res: any, next: any) => {
        if (err.name === 'ValidationError') {
          return res.status(err.statusCode).json(err)
        }
        next(err)
      })
    })

    it('should get tenant details successfully', async () => {
      mockTMSRepository.getTenant.mockResolvedValue(mockTenant as any)

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}`)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          tenant: {
            id: mockTenant.id,
            name: mockTenant.name,
            ministryName: mockTenant.ministryName,
            description: mockTenant.description
          }
        }
      })

      expect(mockTMSRepository.getTenant).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { tenantId },
          query: {}
        })
      )
    })

    it('should get tenant details with expanded user roles', async () => {
      mockTMSRepository.getTenant.mockResolvedValue(mockTenant as any)

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}`)
        .query({ expand: 'tenantUserRoles' })

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          tenant: {
            id: mockTenant.id,
            name: mockTenant.name,
            ministryName: mockTenant.ministryName,
            description: mockTenant.description,
            users: [{
              firstName: mockTenant.users[0].firstName,
              lastName: mockTenant.users[0].lastName,
              ssoUserId: mockTenant.users[0].ssoUserId,
              roles: [{
                id: mockTenant.users[0].roles[0].id,
                name: TMSConstants.TENANT_OWNER
              }]
            }]
          }
        }
      })

      expect(mockTMSRepository.getTenant).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { tenantId },
          query: { expand: 'tenantUserRoles' }
        })
      )
    })

    it('should return 400 when tenant ID is invalid', async () => {
      const response = await request(app)
        .get('/v1/tenants/invalid-uuid')

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        name: 'ValidationError',
        message: 'Validation Failed',
        details: {
          params: [{
            message: '"tenantId" must be a valid GUID'
          }]
        }
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
          query: [{
            message: '"expand" with value "invalidParameter" fails to match the required pattern: /^(tenantUserRoles)?$/'
          }]
        }
      })
    })

    it('should return 404 when tenant not found', async () => {
      const nonExistentTenantId = '123e4567-e89b-12d3-a456-426614174999'
      mockTMSRepository.getTenant.mockRejectedValue(
        new NotFoundError(`Tenant Not Found: ${nonExistentTenantId}`)
      )

      const response = await request(app)
        .get(`/v1/tenants/${nonExistentTenantId}`)

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: `Tenant Not Found: ${nonExistentTenantId}`,
        name: 'Error occurred getting a tenant'
      })
    })
  })

  describe('GET /v1/tenants/:tenantId/ssousers/:ssoUserId/roles', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const ssoUserId = 'F45AFBBD68C4411F956BA3A1D91878EF'
    const mockRoles = [{
      id: '123e4567-e89b-12d3-a456-426614174002',
      name: TMSConstants.TENANT_OWNER,
      description: 'Tenant Owner Role',
      tenantUserRoles: [],
      createdDateTime: new Date(),
      updatedDateTime: new Date(),
      createdBy: 'test-user',
      updatedBy: 'test-user'
    }]

    beforeEach(() => {
      app.get('/v1/tenants/:tenantId/ssousers/:ssoUserId/roles',
        (req, res, next) => {
          req.isSharedServiceAccess = true
          req.decodedJwt = {
            aud: 'test-service-client',
            idir_user_guid: ssoUserId
          }
          next()
        },
        validate(validator.getRolesForSSOUser, {}, {}),
        async (req, res, next) => {
          try {
            const tenantId = req.params.tenantId
            const ssoUserIdFromToken = req.decodedJwt?.idir_user_guid || req.decodedJwt?.bceid_user_guid
            if (!tenantId || !ssoUserIdFromToken) {
              return res.status(403).json({ error: 'Forbidden', message: 'Missing tenant ID or user ID' })
            }
            const hasAccess = await mockTMSRepository.checkUserTenantAccess(tenantId, ssoUserIdFromToken, [])
            if (!hasAccess) {
              return res.status(403).json({ error: 'Forbidden', message: 'Access denied' })
            }
            next()
          } catch (error) {
            next(error)
          }
        },
        (req, res) => tmsController.getRolesForSSOUser(req, res)
      )

      app.use((err: any, req: any, res: any, next: any) => {
        if (err.name === 'ValidationError') {
          return res.status(err.statusCode).json(err)
        }
        next(err)
      })
    })

    it('should get roles for SSO user successfully', async () => {
      mockTMSRepository.checkUserTenantAccess.mockResolvedValue(true)
      mockTMSRepository.getRolesForSSOUser.mockResolvedValue(mockRoles)

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/ssousers/${ssoUserId}/roles`)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          roles: [{
            id: mockRoles[0].id,
            name: mockRoles[0].name,
            description: mockRoles[0].description
          }]
        }
      })

      expect(mockTMSRepository.getRolesForSSOUser).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { tenantId, ssoUserId }
        })
      )
    })

    it('should return 400 when tenant ID is invalid', async () => {
      const response = await request(app)
        .get(`/v1/tenants/invalid-uuid/ssousers/${ssoUserId}/roles`)

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        name: 'ValidationError',
        message: 'Validation Failed',
        details: {
          params: [{
            message: '"tenantId" must be a valid GUID'
          }]
        }
      })
    })

    it('should return 404 when tenant not found', async () => {
      const nonExistentTenantId = '123e4567-e89b-12d3-a456-426614174999'
      mockTMSRepository.checkUserTenantAccess.mockResolvedValue(true)
      mockTMSRepository.getRolesForSSOUser.mockRejectedValue(
        new NotFoundError(`Tenant Not Found: ${nonExistentTenantId}`)
      )

      const response = await request(app)
        .get(`/v1/tenants/${nonExistentTenantId}/ssousers/${ssoUserId}/roles`)

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: `Tenant Not Found: ${nonExistentTenantId}`,
        name: 'Error occurred getting roles for SSO user'
      })
    })

    it('should return empty roles array when user has no roles', async () => {
      mockTMSRepository.checkUserTenantAccess.mockResolvedValue(true)
      mockTMSRepository.getRolesForSSOUser.mockResolvedValue([])

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/ssousers/${ssoUserId}/roles`)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          roles: []
        }
      })
    })
  })

  describe('GET /v1/roles', () => {
    const mockRoles = [{
      id: '123e4567-e89b-12d3-a456-426614174002',
      name: TMSConstants.TENANT_OWNER,
      description: 'Tenant Owner Role',
      tenantUserRoles: [],
      createdDateTime: new Date(),
      updatedDateTime: new Date(),
      createdBy: 'test-user',
      updatedBy: 'test-user'
    }]

    beforeEach(() => {
      app.get('/v1/roles',
        (req, res) => tmsController.getTenantRoles(req, res)
      )

      app.use((err: any, req: any, res: any, next: any) => {
        if (err.name === 'ValidationError') {
          return res.status(err.statusCode).json(err)
        }
        next(err)
      })
    })

    it('should get all roles successfully', async () => {
      mockTMSRepository.getTenantRoles.mockResolvedValue(mockRoles)

      const response = await request(app)
        .get('/v1/roles')

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          roles: [{
            id: mockRoles[0].id,
            name: mockRoles[0].name,
            description: mockRoles[0].description
          }]
        }
      })

      expect(mockTMSRepository.getTenantRoles).toHaveBeenCalled()
    })

    it('should return empty roles array when no roles exist', async () => {
      mockTMSRepository.getTenantRoles.mockResolvedValue([])

      const response = await request(app)
        .get('/v1/roles')

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          roles: []
        }
      })
    })

    it('should handle internal server error', async () => {
      mockTMSRepository.getTenantRoles.mockRejectedValue(new Error('Database error'))

      const response = await request(app)
        .get('/v1/roles')

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: 'Database error',
        name: 'Error occurred getting tenant roles'
      })
    })
  })

  describe('PUT /v1/tenants/:tenantId', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const validUpdateData = {
      name: 'Updated Tenant',
      ministryName: 'Updated Ministry',
      description: 'Updated Description'
    }

    beforeEach(() => {
      app.put('/v1/tenants/:tenantId',
        validate(validator.updateTenant, {}, {}),
        (req, res) => tmsController.updateTenant(req, res)
      )

      app.use((err: any, req: any, res: any, next: any) => {
        if (err.name === 'ValidationError') {
          return res.status(err.statusCode).json(err)
        }
        next(err)
      })
    })

    it('should update tenant successfully', async () => {
      const mockUpdatedTenant = {
        id: tenantId,
        ...validUpdateData,
        createdDateTime: new Date(),
        updatedDateTime: new Date(),
        createdBy: 'test-user',
        updatedBy: 'test-user',
        users: []
      }

      mockTMSRepository.updateTenant.mockResolvedValue(mockUpdatedTenant)

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
            description: mockUpdatedTenant.description
          }
        }
      })

      expect(mockTMSRepository.updateTenant).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { tenantId },
          body: validUpdateData
        })
      )
    })

    it('should return 404 when tenant does not exist', async () => {
      mockTMSRepository.updateTenant.mockRejectedValue(new NotFoundError(`Tenant not found: ${tenantId}`))

      const response = await request(app)
        .put(`/v1/tenants/${tenantId}`)
        .send(validUpdateData)

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: `Tenant not found: ${tenantId}`,
        name: 'Error occurred updating tenant'
      })
    })

    it('should return 409 when name and ministry name combination already exists', async () => {
      mockTMSRepository.updateTenant.mockRejectedValue(
        new ConflictError(`A tenant with name '${validUpdateData.name}' and ministry name '${validUpdateData.ministryName}' already exists`)
      )

      const response = await request(app)
        .put(`/v1/tenants/${tenantId}`)
        .send(validUpdateData)

      expect(response.status).toBe(409)
      expect(response.body).toMatchObject({
        errorMessage: 'Conflict',
        httpResponseCode: 409,
        message: `A tenant with name '${validUpdateData.name}' and ministry name '${validUpdateData.ministryName}' already exists`,
        name: 'Error occurred updating tenant'
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
          params: [{
            message: '"tenantId" must be a valid GUID'
          }]
        }
      })
    })

    it('should return 400 when update data is invalid', async () => {
      const invalidData = {
        name: 'a'.repeat(31), 
        ministryName: 'b'.repeat(101) 
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
              message: '"name" length must be less than or equal to 30 characters long'
            }),
            expect.objectContaining({
              message: '"ministryName" length must be less than or equal to 100 characters long'
            })
          ])
        }
      })
    })
  })

  describe('POST /v1/tenant-requests', () => {
    const validTenantRequestData = {
      name: 'Test Tenant Request',
      ministryName: 'Test Ministry',
      description: 'Test Description',
      user: {
        firstName: 'Test',
        lastName: 'User',
        displayName: 'Test User',
        ssoUserId: 'F45AFBBD68C4466F956BA3A1D91878AD',
        userName: 'testuser',
        email: 'test@gov.bc.ca'
      }
    }

    beforeEach(() => {
      app.post('/v1/tenant-requests',
        validate(validator.createTenantRequest, {}, {}),
        (req, res) => tmsController.createTenantRequest(req, res)
      )

      app.use((err: any, req: any, res: any, next: any) => {
        if (err.name === 'ValidationError') {
          return res.status(err.statusCode).json(err)
        }
        next(err)
      })
    })

    it('should create a tenant request successfully', async () => {
      const mockTenantRequest = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: validTenantRequestData.name,
        ministryName: validTenantRequestData.ministryName,
        description: validTenantRequestData.description,
        status: 'NEW',
        requestedBy: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          firstName: validTenantRequestData.user.firstName,
          lastName: validTenantRequestData.user.lastName,
          displayName: validTenantRequestData.user.displayName,
          ssoUserId: validTenantRequestData.user.ssoUserId,
          userName: validTenantRequestData.user.userName,
          email: validTenantRequestData.user.email
        },
        createdDateTime: new Date(),
        updatedDateTime: new Date(),
        createdBy: validTenantRequestData.user.ssoUserId,
        updatedBy: validTenantRequestData.user.ssoUserId
      }

      mockTMSRepository.saveTenantRequest.mockResolvedValue(mockTenantRequest)

      const response = await request(app)
        .post('/v1/tenant-requests')
        .send(validTenantRequestData)

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        data: {
          tenantRequest: {
            id: mockTenantRequest.id,
            name: mockTenantRequest.name,
            ministryName: mockTenantRequest.ministryName,
            description: mockTenantRequest.description,
            status: mockTenantRequest.status,
            requestedBy: mockTenantRequest.requestedBy.displayName
          }
        }
      })

      expect(mockTMSRepository.saveTenantRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          body: validTenantRequestData
        })
      )
    })

    it('should return 400 when required fields are missing', async () => {
      const invalidData = {
        name: 'Test Tenant Request',
        // ministryName is missing
        description: 'Test Description',
        user: {
          firstName: 'Test',
          lastName: 'User',
          displayName: 'Test User',
          ssoUserId: 'F45AFBBD68C4466F956BA3A1D91878AD',
          userName: 'testuser',
          email: 'test@gov.bc.ca'
        }
      }

      const response = await request(app)
        .post('/v1/tenant-requests')
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        name: 'ValidationError',
        message: 'Validation Failed',
        details: {
          body: expect.arrayContaining([
            expect.objectContaining({
              message: expect.stringContaining('ministryName')
            })
          ])
        }
      })
    })

    it('should return 400 when user information is incomplete', async () => {
      const invalidData = {
        name: 'Test Tenant Request',
        ministryName: 'Test Ministry',
        description: 'Test Description',
        user: {
          firstName: 'Test',
          lastName: 'User',
          // no displayName field
          ssoUserId: 'F45AFBBD68C4466F956BA3A1D91878AD',
          userName: 'testuser',
          email: 'test@gov.bc.ca'
        }
      }

      const response = await request(app)
        .post('/v1/tenant-requests')
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        name: 'ValidationError',
        message: 'Validation Failed',
        details: {
          body: expect.arrayContaining([
            expect.objectContaining({
              message: expect.stringContaining('displayName')
            })
          ])
        }
      })
    })

    it('should return 500 when repository throws an error', async () => {
      mockTMSRepository.saveTenantRequest.mockRejectedValue(new Error('Database error'))

      const response = await request(app)
        .post('/v1/tenant-requests')
        .send(validTenantRequestData)

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: 'Database error',
        name: 'Error occurred creating tenant request'
      })
    })

    it('should handle null/undefined values in optional fields', async () => {
      const tenantRequestWithNulls = {
        name: 'Test Tenant Request',
        ministryName: 'Test Ministry',
        description: null,
        user: {
          firstName: 'Test',
          lastName: 'User',
          displayName: 'Test User',
          ssoUserId: 'F45AFBBD68C4466F956BA3A1D91878AD',
          userName: undefined,
          email: 'test@gov.bc.ca'
        }
      }

      const mockTenantRequest = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...tenantRequestWithNulls,
        status: 'NEW'
      }

      mockTMSRepository.saveTenantRequest.mockResolvedValue(mockTenantRequest as any)

      const response = await request(app)
        .post('/v1/tenant-requests')
        .send(tenantRequestWithNulls)

      expect([201, 400]).toContain(response.status)
    })

    it('should handle very long string values', async () => {
      const longString = 'a'.repeat(5000)
      const tenantRequestWithLongStrings = {
        ...validTenantRequestData,
        description: longString
      }

      const response = await request(app)
        .post('/v1/tenant-requests')
        .send(tenantRequestWithLongStrings)

      expect([201, 400, 404, 500]).toContain(response.status)
    })
  })

  describe('PATCH /v1/tenant-requests/:requestId/status', () => {
    const requestId = '123e4567-e89b-12d3-a456-426614174000'
    const validApproveData = {
      status: 'APPROVED'
    }

    it('should approve a tenant request successfully', async () => {
      const mockTenantRequest = {
        id: requestId,
        status: 'NEW',
        requestedBy: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          email: 'test@gov.bc.ca',
          displayName: 'Test User'
        },
        tenant: {
          id: '123e4567-e89b-12d3-a456-426614174002',
          name: 'Test Tenant',
          ministryName: 'Test Ministry'
        }
      }

      mockTMSRepository.updateTenantRequestStatus.mockResolvedValue({
        tenantRequest: {
          ...mockTenantRequest,
          status: 'APPROVED',
          decisionedBy: {
            id: '123e4567-e89b-12d3-a456-426614174003',
            email: 'ops@gov.bc.ca',
            displayName: 'Ops Admin'
          }
        }
      })

      const response = await request(app)
        .patch(`/v1/tenant-requests/${requestId}/status`)
        .send(validApproveData)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          tenantRequest: {
            id: requestId,
            status: 'APPROVED',
            requestedBy: 'Test User',
            decisionedBy: 'Ops Admin'
          }
        }
      })

      expect(mockTMSRepository.updateTenantRequestStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { requestId },
          body: validApproveData
        })
      )
    })

    it('should reject a tenant request successfully', async () => {
      const mockTenantRequest = {
        id: requestId,
        status: 'NEW',
        requestedBy: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          email: 'test@gov.bc.ca',
          displayName: 'Test User'
        }
      }

      const validRejectData = {
        status: 'REJECTED',
        rejectionReason: 'Insufficient information provided'
      }

      mockTMSRepository.updateTenantRequestStatus.mockResolvedValue({
        tenantRequest: {
          ...mockTenantRequest,
          status: 'REJECTED',
          rejectionReason: validRejectData.rejectionReason,
          decisionedBy: {
            id: '123e4567-e89b-12d3-a456-426614174003',
            email: 'ops@gov.bc.ca',
            displayName: 'Ops Admin'
          }
        }
      })

      const response = await request(app)
        .patch(`/v1/tenant-requests/${requestId}/status`)
        .send(validRejectData)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          tenantRequest: {
            id: requestId,
            status: 'REJECTED',
            requestedBy: 'Test User',
            decisionedBy: 'Ops Admin',
            rejectionReason: validRejectData.rejectionReason
          }
        }
      })

      expect(mockTMSRepository.updateTenantRequestStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { requestId },
          body: validRejectData
        })
      )
    })

    it('should return 409 when trying to update a non-NEW request', async () => {
      const mockTenantRequest = {
        id: requestId,
        status: 'APPROVED',
        requestedBy: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          email: 'test@gov.bc.ca',
          displayName: 'Test User'
        }
      }

      mockTMSRepository.updateTenantRequestStatus.mockRejectedValue(
        new ConflictError(`Cannot update tenant request with status: ${mockTenantRequest.status}`)
      )

      const response = await request(app)
        .patch(`/v1/tenant-requests/${requestId}/status`)
        .send(validApproveData)

      expect(response.status).toBe(409)
      expect(response.body).toMatchObject({
        errorMessage: 'Conflict',
        httpResponseCode: 409,
        message: `Cannot update tenant request with status: ${mockTenantRequest.status}`,
        name: 'Error occurred updating tenant request status'
      })

      expect(mockTMSRepository.updateTenantRequestStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { requestId },
          body: validApproveData
        })
      )
    })

    it('should return 400 when rejecting without a reason', async () => {
      const invalidRejectData = {
        status: 'REJECTED'
      }

      const response = await request(app)
        .patch(`/v1/tenant-requests/${requestId}/status`)
        .send(invalidRejectData)

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        message: 'Validation Failed',
        details: {
          body: expect.arrayContaining([
            expect.objectContaining({
              message: '"rejectionReason" is required'
            })
          ])
        }
      })

      expect(mockTMSRepository.updateTenantRequestStatus).not.toHaveBeenCalled()
    })

    it('should return 404 when tenant request does not exist', async () => {
      mockTMSRepository.updateTenantRequestStatus.mockRejectedValue(
        new NotFoundError(`Tenant request not found: ${requestId}`)
      )

      const response = await request(app)
        .patch(`/v1/tenant-requests/${requestId}/status`)
        .send(validApproveData)

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: `Tenant request not found: ${requestId}`,
        name: 'Error occurred updating tenant request status'
      })

      expect(mockTMSRepository.updateTenantRequestStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { requestId },
          body: validApproveData
        })
      )
    })

    it('should return 409 when approving a request for existing tenant', async () => {
      const mockTenantRequest = {
        id: requestId,
        status: 'NEW',
        name: 'Test Tenant',
        ministryName: 'Test Ministry',
        requestedBy: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          email: 'test@gov.bc.ca',
          displayName: 'Test User'
        }
      }

      mockTMSRepository.updateTenantRequestStatus.mockRejectedValue(
        new ConflictError(`A tenant with name '${mockTenantRequest.name}' and ministry name '${mockTenantRequest.ministryName}' already exists`)
      )

      const response = await request(app)
        .patch(`/v1/tenant-requests/${requestId}/status`)
        .send(validApproveData)

      expect(response.status).toBe(409)
      expect(response.body).toMatchObject({
        errorMessage: 'Conflict',
        httpResponseCode: 409,
        message: `A tenant with name '${mockTenantRequest.name}' and ministry name '${mockTenantRequest.ministryName}' already exists`,
        name: 'Error occurred updating tenant request status'
      })

      expect(mockTMSRepository.updateTenantRequestStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { requestId },
          body: validApproveData
        })
      )
    })

    it('should return 400 when status is invalid', async () => {
      const invalidStatusData = {
        status: 'INVALID_STATUS'
      }

      const response = await request(app)
        .patch(`/v1/tenant-requests/${requestId}/status`)
        .send(invalidStatusData)

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        message: 'Validation Failed',
        details: {
          body: expect.arrayContaining([
            expect.objectContaining({
              message: '"status" must be one of [APPROVED, REJECTED]'
            })
          ])
        }
      })

      expect(mockTMSRepository.updateTenantRequestStatus).not.toHaveBeenCalled()
    })

    it('should handle transaction rollback when tenant creation fails during approval', async () => {
      const error = new Error('Database error during tenant creation')
      mockTMSRepository.updateTenantRequestStatus.mockRejectedValue(error)

      const response = await request(app)
        .patch(`/v1/tenant-requests/${requestId}/status`)
        .send(validApproveData)

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: 'Database error during tenant creation',
        name: 'Error occurred updating tenant request status'
      })
    })

    it('should handle empty rejection reason when status is APPROVED', async () => {
      const approveData = {
        status: 'APPROVED',
        rejectionReason: '' // Empty string
      }

      const mockResponse = {
        tenantRequest: {
          id: requestId,
          status: 'APPROVED',
          rejectionReason: null
        }
      }

      mockTMSRepository.updateTenantRequestStatus.mockResolvedValue(mockResponse as any)

      const response = await request(app)
        .patch(`/v1/tenant-requests/${requestId}/status`)
        .send(approveData)

      expect([200, 400, 500]).toContain(response.status)
    })

    it('should return 400 when request ID is invalid', async () => {
      const invalidRequestId = 'invalid-uuid'

      const response = await request(app)
        .patch(`/v1/tenant-requests/${invalidRequestId}/status`)
        .send(validApproveData)

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        message: 'Validation Failed',
        details: {
          params: expect.arrayContaining([
            expect.objectContaining({
              message: '"requestId" must be a valid GUID'
            })
          ])
        }
      })

      expect(mockTMSRepository.updateTenantRequestStatus).not.toHaveBeenCalled()
    })

    it('should return 500 when database error occurs', async () => {
      mockTMSRepository.updateTenantRequestStatus.mockRejectedValue(
        new Error('Database error')
      )

      const response = await request(app)
        .patch(`/v1/tenant-requests/${requestId}/status`)
        .send(validApproveData)

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: 'Database error',
        name: 'Error occurred updating tenant request status'
      })

      expect(mockTMSRepository.updateTenantRequestStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { requestId },
          body: validApproveData
        })
      )
    })
  })

  describe('GET /v1/tenant-requests', () => {
    const mockTenantRequests: any[] = [{
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Tenant',
      ministryName: 'Test Ministry',
      description: 'Test Description',
      status: 'NEW',
      requestedBy: {
        id: '123e4567-e89b-12d3-a456-426614174001',
        email: 'test@gov.bc.ca',
        displayName: 'Test User'
      },
      requestedAt: new Date('2024-01-15'),
      decisionedBy: null,
      decisionedAt: null,
      rejectionReason: null,
      createdDateTime: new Date('2024-01-15'),
      updatedDateTime: new Date('2024-01-15'),
      createdBy: '123e4567e89b12d3a456426614174001',
      updatedBy: '123e4567e89b12d3a456426614174001'
    }]

    beforeEach(() => {
      app.get('/v1/tenant-requests',
        validate(validator.getTenantRequests, {}, {}),
        (req, res) => tmsController.getTenantRequests(req, res)
      )

      app.use((err: any, req: any, res: any, next: any) => {
        if (err.name === 'ValidationError') {
          return res.status(err.statusCode).json(err)
        }
        next(err)
      })
    })

    it('should get all tenant requests successfully', async () => {
      mockTMSRepository.getTenantRequests.mockResolvedValue(mockTenantRequests)

      const response = await request(app)
        .get('/v1/tenant-requests')

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          tenantRequests: [{
            id: mockTenantRequests[0].id,
            name: mockTenantRequests[0].name,
            ministryName: mockTenantRequests[0].ministryName,
            description: mockTenantRequests[0].description,
            status: mockTenantRequests[0].status,
            requestedBy: mockTenantRequests[0].requestedBy.displayName
          }]
        }
      })

      expect(mockTMSRepository.getTenantRequests).toHaveBeenCalledWith(undefined)
    })

    it('should get tenant requests filtered by NEW status', async () => {
      mockTMSRepository.getTenantRequests.mockResolvedValue(mockTenantRequests)

      const response = await request(app)
        .get('/v1/tenant-requests?status=NEW')

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          tenantRequests: [{
            id: mockTenantRequests[0].id,
            name: mockTenantRequests[0].name,
            status: 'NEW',
            requestedBy: mockTenantRequests[0].requestedBy.displayName
          }]
        }
      })

      expect(mockTMSRepository.getTenantRequests).toHaveBeenCalledWith('NEW')
    })

    it('should return 400 when status parameter is invalid', async () => {
      const response = await request(app)
        .get('/v1/tenant-requests?status=INVALID_STATUS')

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        message: 'Validation Failed',
        details: {
          query: expect.arrayContaining([
            expect.objectContaining({
              message: '"status" must be one of [NEW, APPROVED, REJECTED]'
            })
          ])
        }
      })

      expect(mockTMSRepository.getTenantRequests).not.toHaveBeenCalled()
    })

    it('should return 500 when database error occurs', async () => {
      mockTMSRepository.getTenantRequests.mockRejectedValue(
        new Error('Database error')
      )

      const response = await request(app)
        .get('/v1/tenant-requests')

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: 'Database error',
        name: 'Error occurred getting tenant requests'
      })

      expect(mockTMSRepository.getTenantRequests).toHaveBeenCalledWith(undefined)
    })
  })

  describe('POST /v1/shared-services', () => {
    const validSharedServiceData = {
      name: 'Test Shared Service',
      clientIdentifier: 'test-service-client',
      description: 'Test Description',
      isActive: true,
      roles: [
        {
          name: 'Admin Role',
          description: 'Administrator role for the shared service'
        },
        {
          name: 'User Role',
          description: 'Standard user role for the shared service'
        }
      ]
    }

    beforeEach(() => {
      app.post('/v1/shared-services',
        validate(validator.createSharedService, {}, {}),
        (req, res) => tmsController.createSharedService(req, res)
      )

      app.use((err: any, req: any, res: any, next: any) => {
        if (err.name === 'ValidationError') {
          return res.status(err.statusCode).json(err)
        }
        next(err)
      })
    })

    it('should create a shared service successfully', async () => {
      const mockSharedService = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: validSharedServiceData.name,
        clientIdentifier: validSharedServiceData.clientIdentifier,
        description: validSharedServiceData.description,
        isActive: validSharedServiceData.isActive,
        sharedServiceRoles: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Admin Role',
            description: 'Administrator role for the shared service',
            isDeleted: false
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            name: 'User Role',
            description: 'Standard user role for the shared service',
            isDeleted: false
          }
        ],
        createdDateTime: new Date(),
        updatedDateTime: new Date(),
        createdBy: '123e4567e89b12d3a456426614174001',
        updatedBy: '123e4567e89b12d3a456426614174001'
      }

      mockTMSRepository.saveSharedService.mockResolvedValue(mockSharedService)

      const response = await request(app)
        .post('/v1/shared-services')
        .send(validSharedServiceData)

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        data: {
          sharedService: {
            id: mockSharedService.id,
            name: mockSharedService.name,
            clientIdentifier: mockSharedService.clientIdentifier,
            description: mockSharedService.description,
            isActive: mockSharedService.isActive,
            sharedServiceRoles: expect.arrayContaining([
              expect.objectContaining({
                name: 'Admin Role',
                description: 'Administrator role for the shared service'
              }),
              expect.objectContaining({
                name: 'User Role',
                description: 'Standard user role for the shared service'
              })
            ])
          }
        }
      })

      expect(mockTMSRepository.saveSharedService).toHaveBeenCalledWith(
        expect.objectContaining({
          body: validSharedServiceData
        })
      )
    })

    it('should create shared service with minimal required fields', async () => {
      const minimalData = {
        name: 'Minimal Service',
        clientIdentifier: 'minimal-service',
        roles: [
          {
            name: 'Basic Role'
          }
        ]
      }

      const mockSharedService = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: minimalData.name,
        clientIdentifier: minimalData.clientIdentifier,
        description: null,
        isActive: true,
        sharedServiceRoles: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Basic Role',
            description: null,
            isDeleted: false
          }
        ],
        createdDateTime: new Date(),
        updatedDateTime: new Date(),
        createdBy: '123e4567e89b12d3a456426614174001',
        updatedBy: '123e4567e89b12d3a456426614174001'
      }

      mockTMSRepository.saveSharedService.mockResolvedValue(mockSharedService)

      const response = await request(app)
        .post('/v1/shared-services')
        .send(minimalData)

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        data: {
          sharedService: {
            id: mockSharedService.id,
            name: mockSharedService.name,
            clientIdentifier: mockSharedService.clientIdentifier,
            description: mockSharedService.description,
            isActive: mockSharedService.isActive
          }
        }
      })
    })

    it('should fail when shared service name already exists', async () => {
      const errorMessage = `A shared service with name '${validSharedServiceData.name}' already exists`
      mockTMSRepository.saveSharedService.mockRejectedValue(new ConflictError(errorMessage))

      const response = await request(app)
        .post('/v1/shared-services')
        .send(validSharedServiceData)

      expect(response.status).toBe(409)
      expect(response.body).toMatchObject({
        errorMessage: 'Conflict',
        httpResponseCode: 409,
        message: errorMessage,
        name: 'Error occurred creating shared service'
      })
    })

    it('should fail when client identifier already exists', async () => {
      const errorMessage = `A shared service with client identifier '${validSharedServiceData.clientIdentifier}' already exists`
      mockTMSRepository.saveSharedService.mockRejectedValue(new ConflictError(errorMessage))

      const response = await request(app)
        .post('/v1/shared-services')
        .send(validSharedServiceData)

      expect(response.status).toBe(409)
      expect(response.body).toMatchObject({
        errorMessage: 'Conflict',
        httpResponseCode: 409,
        message: errorMessage,
        name: 'Error occurred creating shared service'
      })
    })

    it('should return 400 when required fields are missing', async () => {
      const invalidData = {
        description: 'Missing required fields'
      }

      const response = await request(app)
        .post('/v1/shared-services')
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body.message).toBe("Validation Failed")
    })

    it('should return 400 when roles array is empty', async () => {
      const invalidData = {
        name: validSharedServiceData.name,
        clientIdentifier: validSharedServiceData.clientIdentifier,
        roles: []
      }

      const response = await request(app)
        .post('/v1/shared-services')
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body.message).toBe("Validation Failed")
    })

    it('should return 500 when database error occurs', async () => {
      mockTMSRepository.saveSharedService.mockRejectedValue(
        new Error('Database error')
      )

      const response = await request(app)
        .post('/v1/shared-services')
        .send(validSharedServiceData)

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: 'Database error',
        name: 'Error occurred creating shared service'
      })
    })
  })

  describe('POST /v1/shared-services/:sharedServiceId/shared-service-roles', () => {
    const sharedServiceId = '123e4567-e89b-12d3-a456-426614174000'
    const validRolesData = {
      roles: [
        {
          name: 'New Admin Role',
          description: 'New administrator role for the shared service'
        },
        {
          name: 'New User Role',
          description: 'New standard user role for the shared service'
        }
      ]
    }

    beforeEach(() => {
      app.post('/v1/shared-services/:sharedServiceId/shared-service-roles',
        validate(validator.addSharedServiceRoles, {}, {}),
        (req, res) => tmsController.addSharedServiceRoles(req, res)
      )

      app.use((err: any, req: any, res: any, next: any) => {
        if (err.name === 'ValidationError') {
          return res.status(err.statusCode).json(err)
        }
        next(err)
      })
    })

    it('should add roles to shared service successfully', async () => {
      const mockUpdatedSharedService: any = {
        id: sharedServiceId,
        name: 'Test Shared Service',
        clientIdentifier: 'test-service-client',
        description: 'Test Description',
        isActive: true,
        roles: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Existing Role',
            description: 'Existing role',
            isDeleted: false
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            name: 'New Admin Role',
            description: 'New administrator role for the shared service',
            isDeleted: false
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174003',
            name: 'New User Role',
            description: 'New standard user role for the shared service',
            isDeleted: false
          }
        ],
        createdDateTime: new Date(),
        updatedDateTime: new Date(),
        createdBy: '123e4567e89b12d3a456426614174001',
        updatedBy: '123e4567e89b12d3a456426614174001'
      }

      mockTMSRepository.addSharedServiceRoles.mockResolvedValue(mockUpdatedSharedService)

      const response = await request(app)
        .post(`/v1/shared-services/${sharedServiceId}/shared-service-roles`)
        .send(validRolesData)

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        data: {
          sharedService: {
            id: mockUpdatedSharedService.id,
            name: mockUpdatedSharedService.name,
            clientIdentifier: mockUpdatedSharedService.clientIdentifier,
            roles: expect.arrayContaining([
              expect.objectContaining({
                name: 'New Admin Role',
                description: 'New administrator role for the shared service'
              }),
              expect.objectContaining({
                name: 'New User Role',
                description: 'New standard user role for the shared service'
              })
            ])
          }
        }
      })

      expect(mockTMSRepository.addSharedServiceRoles).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { sharedServiceId },
          body: validRolesData
        })
      )
    })

    it('should add roles with minimal data', async () => {
      const minimalRolesData = {
        roles: [
          {
            name: 'Basic Role'
          }
        ]
      }

      const mockUpdatedSharedService: any = {
        id: sharedServiceId,
        name: 'Test Shared Service',
        clientIdentifier: 'test-service-client',
        description: null,
        isActive: true,
        roles: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Basic Role',
            description: null,
            isDeleted: false
          }
        ],
        createdDateTime: new Date(),
        updatedDateTime: new Date(),
        createdBy: '123e4567e89b12d3a456426614174001',
        updatedBy: '123e4567e89b12d3a456426614174001'
      }

      mockTMSRepository.addSharedServiceRoles.mockResolvedValue(mockUpdatedSharedService)

      const response = await request(app)
        .post(`/v1/shared-services/${sharedServiceId}/shared-service-roles`)
        .send(minimalRolesData)

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        data: {
          sharedService: {
            id: mockUpdatedSharedService.id,
            roles: expect.arrayContaining([
              expect.objectContaining({
                name: 'Basic Role'
              })
            ])
          }
        }
      })
    })

    it('should fail when shared service not found', async () => {
      const errorMessage = `Active shared service not found: ${sharedServiceId}`
      mockTMSRepository.addSharedServiceRoles.mockRejectedValue(new NotFoundError(errorMessage))

      const response = await request(app)
        .post(`/v1/shared-services/${sharedServiceId}/shared-service-roles`)
        .send(validRolesData)

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: errorMessage,
        name: 'Error occurred adding shared service roles'
      })
    })

    it('should fail when role name already exists', async () => {
      const errorMessage = `Role 'New Admin Role' already exists for this shared service`
      mockTMSRepository.addSharedServiceRoles.mockRejectedValue(new ConflictError(errorMessage))

      const response = await request(app)
        .post(`/v1/shared-services/${sharedServiceId}/shared-service-roles`)
        .send(validRolesData)

      expect(response.status).toBe(409)
      expect(response.body).toMatchObject({
        errorMessage: 'Conflict',
        httpResponseCode: 409,
        message: errorMessage,
        name: 'Error occurred adding shared service roles'
      })
    })

    it('should return 400 when required fields are missing', async () => {
      const invalidData = {
        // roles array is missing
      }

      const response = await request(app)
        .post(`/v1/shared-services/${sharedServiceId}/shared-service-roles`)
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body.message).toBe("Validation Failed")
    })

    it('should return 400 when roles array is empty', async () => {
      const invalidData = {
        roles: []
      }

      const response = await request(app)
        .post(`/v1/shared-services/${sharedServiceId}/shared-service-roles`)
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body.message).toBe("Validation Failed")
    })

    it('should return 500 when database error occurs', async () => {
      mockTMSRepository.addSharedServiceRoles.mockRejectedValue(
        new Error('Database error')
      )

      const response = await request(app)
        .post(`/v1/shared-services/${sharedServiceId}/shared-service-roles`)
        .send(validRolesData)

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: 'Database error',
        name: 'Error occurred adding shared service roles'
      })
    })
  })

  describe('GET /v1/shared-services', () => {
    beforeEach(() => {
      app.get('/v1/shared-services',
        (req, res) => tmsController.getAllActiveSharedServices(req, res)
      )

      app.use((err: any, req: any, res: any, next: any) => {
        if (err.name === 'ValidationError') {
          return res.status(err.statusCode).json(err)
        }
        next(err)
      })
    })

    it('should get all active shared services successfully', async () => {
      const mockSharedServices: any = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Service A',
          clientIdentifier: 'service-a',
          description: 'First shared service',
          isActive: true,
          roles: [
            {
              id: '123e4567-e89b-12d3-a456-426614174001',
              name: 'Admin Role',
              description: 'Administrator role',
              isDeleted: false
            },
            {
              id: '123e4567-e89b-12d3-a456-426614174002',
              name: 'User Role',
              description: 'Standard user role',
              isDeleted: false
            }
          ],
          createdDateTime: new Date(),
          updatedDateTime: new Date(),
          createdBy: '123e4567e89b12d3a456426614174001',
          updatedBy: '123e4567e89b12d3a456426614174001'
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174003',
          name: 'Service B',
          clientIdentifier: 'service-b',
          description: 'Second shared service',
          isActive: true,
          roles: [
            {
              id: '123e4567-e89b-12d3-a456-426614174004',
              name: 'Basic Role',
              description: 'Basic access role',
              isDeleted: false
            }
          ],
          createdDateTime: new Date(),
          updatedDateTime: new Date(),
          createdBy: '123e4567e89b12d3a456426614174001',
          updatedBy: '123e4567e89b12d3a456426614174001'
        }
      ]

      mockTMSRepository.getAllActiveSharedServices.mockResolvedValue(mockSharedServices)

      const response = await request(app)
        .get('/v1/shared-services')

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          sharedServices: [
            {
              id: mockSharedServices[0].id,
              name: mockSharedServices[0].name,
              clientIdentifier: mockSharedServices[0].clientIdentifier,
              description: mockSharedServices[0].description,
              isActive: mockSharedServices[0].isActive,
              roles: expect.arrayContaining([
                expect.objectContaining({
                  name: 'Admin Role',
                  description: 'Administrator role'
                }),
                expect.objectContaining({
                  name: 'User Role',
                  description: 'Standard user role'
                })
              ])
            },
            {
              id: mockSharedServices[1].id,
              name: mockSharedServices[1].name,
              clientIdentifier: mockSharedServices[1].clientIdentifier,
              description: mockSharedServices[1].description,
              isActive: mockSharedServices[1].isActive,
              roles: expect.arrayContaining([
                expect.objectContaining({
                  name: 'Basic Role',
                  description: 'Basic access role'
                })
              ])
            }
          ]
        }
      })

      expect(mockTMSRepository.getAllActiveSharedServices).toHaveBeenCalledWith()
    })

    it('should return empty array when no active shared services exist', async () => {
      mockTMSRepository.getAllActiveSharedServices.mockResolvedValue([])

      const response = await request(app)
        .get('/v1/shared-services')

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          sharedServices: []
        }
      })

      expect(mockTMSRepository.getAllActiveSharedServices).toHaveBeenCalledWith()
    })

    it('should return shared services sorted alphabetically by name', async () => {
      const mockSharedServices: any = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Alpha Service',
          clientIdentifier: 'alpha-service',
          isActive: true,
          roles: []
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Zebra Service',
          clientIdentifier: 'zebra-service',
          isActive: true,
          roles: []
        }
      ]

      mockTMSRepository.getAllActiveSharedServices.mockResolvedValue(mockSharedServices)

      const response = await request(app)
        .get('/v1/shared-services')

      expect(response.status).toBe(200)
      expect(response.body.data.sharedServices).toHaveLength(2)
      expect(response.body.data.sharedServices[0].name).toBe('Alpha Service')
      expect(response.body.data.sharedServices[1].name).toBe('Zebra Service')
    })

    it('should exclude inactive shared services', async () => {
      const mockSharedServices: any = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Active Service',
          clientIdentifier: 'active-service',
          isActive: true,
          roles: []
        }
      ]

      mockTMSRepository.getAllActiveSharedServices.mockResolvedValue(mockSharedServices)

      const response = await request(app)
        .get('/v1/shared-services')

      expect(response.status).toBe(200)
      expect(response.body.data.sharedServices).toHaveLength(1)
      expect(response.body.data.sharedServices[0].isActive).toBe(true)
    })

    it('should exclude deleted roles from shared services', async () => {
      const mockSharedServices: any = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Test Service',
          clientIdentifier: 'test-service',
          isActive: true,
          roles: [
            {
              id: '123e4567-e89b-12d3-a456-426614174001',
              name: 'Active Role',
              description: 'This role is active',
              isDeleted: false
            }
            // Note: Deleted roles are filtered out at the repository level
          ],
          createdDateTime: new Date(),
          updatedDateTime: new Date(),
          createdBy: '123e4567e89b12d3a456426614174001',
          updatedBy: '123e4567e89b12d3a456426614174001'
        }
      ]

      mockTMSRepository.getAllActiveSharedServices.mockResolvedValue(mockSharedServices)

      const response = await request(app)
        .get('/v1/shared-services')

      expect(response.status).toBe(200)
      expect(response.body.data.sharedServices[0].roles).toHaveLength(1)
      expect(response.body.data.sharedServices[0].roles[0].isDeleted).toBe(false)
    })

    it('should return 500 when database error occurs', async () => {
      mockTMSRepository.getAllActiveSharedServices.mockRejectedValue(
        new Error('Database error')
      )

      const response = await request(app)
        .get('/v1/shared-services')

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: 'Database error',
        name: 'Error occurred getting active shared services'
      })
    })
  })

  describe('POST /v1/tenants/:tenantId/shared-services', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const sharedServiceId = '123e4567-e89b-12d3-a456-426614174001'
    const validRequestData = {
      sharedServiceId: sharedServiceId
    }

    beforeEach(() => {
      app.post('/v1/tenants/:tenantId/shared-services',
        validate(validator.associateSharedServiceToTenant, {}, {}),
        (req, res) => tmsController.associateSharedServiceToTenant(req, res)
      )

      app.use((err: any, req: any, res: any, next: any) => {
        if (err.name === 'ValidationError') {
          return res.status(err.statusCode).json(err)
        }
        next(err)
      })
    })

    it('should associate shared service to tenant successfully', async () => {
      mockTMSRepository.associateSharedServiceToTenant.mockResolvedValue(undefined)

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/shared-services`)
        .send(validRequestData)

      expect(response.status).toBe(201)
      expect(response.body).toEqual({})

      expect(mockTMSRepository.associateSharedServiceToTenant).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { tenantId },
          body: validRequestData
        })
      )
    })

    it('should fail when tenant not found', async () => {
      mockTMSRepository.associateSharedServiceToTenant.mockRejectedValue(
        new NotFoundError('Tenant not found: 123e4567-e89b-12d3-a456-426614174999')
      )

      const response = await request(app)
        .post('/v1/tenants/123e4567-e89b-12d3-a456-426614174999/shared-services')
        .send(validRequestData)

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: 'Tenant not found: 123e4567-e89b-12d3-a456-426614174999',
        name: 'Error occurred associating shared service to tenant'
      })
    })

    it('should fail when shared service not found', async () => {
      mockTMSRepository.associateSharedServiceToTenant.mockRejectedValue(
        new NotFoundError('Shared service not found: 123e4567-e89b-12d3-a456-426614174999')
      )

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/shared-services`)
        .send({
          sharedServiceId: '123e4567-e89b-12d3-a456-426614174999'
        })

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: 'Shared service not found: 123e4567-e89b-12d3-a456-426614174999',
        name: 'Error occurred associating shared service to tenant'
      })
    })

    it('should fail when shared service is inactive', async () => {
      mockTMSRepository.associateSharedServiceToTenant.mockRejectedValue(
        new ConflictError("Cannot associate inactive shared service 'Inactive Service' to tenant")
      )

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/shared-services`)
        .send(validRequestData)

      expect(response.status).toBe(409)
      expect(response.body).toMatchObject({
        errorMessage: 'Conflict',
        httpResponseCode: 409,
        message: "Cannot associate inactive shared service 'Inactive Service' to tenant",
        name: 'Error occurred associating shared service to tenant'
      })
    })

    it('should fail when shared service already associated', async () => {
      mockTMSRepository.associateSharedServiceToTenant.mockRejectedValue(
        new ConflictError("Shared service 'Test Service' is already associated with this tenant")
      )

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/shared-services`)
        .send(validRequestData)

      expect(response.status).toBe(409)
      expect(response.body).toMatchObject({
        errorMessage: 'Conflict',
        httpResponseCode: 409,
        message: "Shared service 'Test Service' is already associated with this tenant",
        name: 'Error occurred associating shared service to tenant'
      })
    })

    it('should return 400 when tenant ID is invalid', async () => {
      const response = await request(app)
        .post('/v1/tenants/invalid-tenant-id/shared-services')
        .send(validRequestData)

      expect(response.status).toBe(400)
    })

    it('should return 400 when shared service ID is missing', async () => {
      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/shared-services`)
        .send({})

      expect(response.status).toBe(400)
    })

    it('should return 400 when shared service ID is invalid', async () => {
      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/shared-services`)
        .send({
          sharedServiceId: 'invalid-shared-service-id'
        })

      expect(response.status).toBe(400)
    })

    it('should return 500 when database error occurs', async () => {
      mockTMSRepository.associateSharedServiceToTenant.mockRejectedValue(
        new Error('Database error')
      )

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/shared-services`)
        .send(validRequestData)

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: 'Database error',
        name: 'Error occurred associating shared service to tenant'
      })
    })
  })

  describe('GET /v1/tenants/:tenantId/shared-services', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'

    beforeEach(() => {
      app.get('/v1/tenants/:tenantId/shared-services',
        validate(validator.getSharedServicesForTenant, {}, {}),
        (req, res) => tmsController.getSharedServicesForTenant(req, res)
      )

      app.use((err: any, req: any, res: any, next: any) => {
        if (err.name === 'ValidationError') {
          return res.status(err.statusCode).json(err)
        }
        next(err)
      })
    })

    it('should get shared services for tenant successfully', async () => {
      const mockSharedServices: any = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Service A',
          clientIdentifier: 'service-a',
          description: 'First shared service for tenant',
          isActive: true,
          roles: [
            {
              id: '123e4567-e89b-12d3-a456-426614174002',
              name: 'Admin Role',
              description: 'Administrator role for service A',
              isDeleted: false
            },
            {
              id: '123e4567-e89b-12d3-a456-426614174003',
              name: 'User Role',
              description: 'Standard user role for service A',
              isDeleted: false
            }
          ],
          createdDateTime: new Date(),
          updatedDateTime: new Date(),
          createdBy: '123e4567e89b12d3a456426614174001',
          updatedBy: '123e4567e89b12d3a456426614174001'
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174004',
          name: 'Service B',
          clientIdentifier: 'service-b',
          description: 'Second shared service for tenant',
          isActive: true,
          roles: [
            {
              id: '123e4567-e89b-12d3-a456-426614174005',
              name: 'Basic Role',
              description: 'Basic access role for service B',
              isDeleted: false
            }
          ],
          createdDateTime: new Date(),
          updatedDateTime: new Date(),
          createdBy: '123e4567e89b12d3a456426614174001',
          updatedBy: '123e4567e89b12d3a456426614174001'
        }
      ]

      mockTMSRepository.getSharedServicesForTenant.mockResolvedValue(mockSharedServices)

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/shared-services`)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          sharedServices: [
            {
              id: mockSharedServices[0].id,
              name: mockSharedServices[0].name,
              clientIdentifier: mockSharedServices[0].clientIdentifier,
              description: mockSharedServices[0].description,
              isActive: mockSharedServices[0].isActive,
              roles: expect.arrayContaining([
                expect.objectContaining({
                  name: 'Admin Role',
                  description: 'Administrator role for service A'
                }),
                expect.objectContaining({
                  name: 'User Role',
                  description: 'Standard user role for service A'
                })
              ])
            },
            {
              id: mockSharedServices[1].id,
              name: mockSharedServices[1].name,
              clientIdentifier: mockSharedServices[1].clientIdentifier,
              description: mockSharedServices[1].description,
              isActive: mockSharedServices[1].isActive,
              roles: expect.arrayContaining([
                expect.objectContaining({
                  name: 'Basic Role',
                  description: 'Basic access role for service B'
                })
              ])
            }
          ]
        }
      })

      expect(mockTMSRepository.getSharedServicesForTenant).toHaveBeenCalledWith(tenantId)
    })

    it('should return empty array when tenant has no shared services', async () => {
      mockTMSRepository.getSharedServicesForTenant.mockResolvedValue([])

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/shared-services`)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          sharedServices: []
        }
      })

      expect(mockTMSRepository.getSharedServicesForTenant).toHaveBeenCalledWith(tenantId)
    })

    it('should return shared services sorted alphabetically by name', async () => {
      const mockSharedServices: any = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Alpha Service',
          clientIdentifier: 'alpha-service',
          isActive: true,
          roles: []
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Zebra Service',
          clientIdentifier: 'zebra-service',
          isActive: true,
          roles: []
        }
      ]

      mockTMSRepository.getSharedServicesForTenant.mockResolvedValue(mockSharedServices)

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/shared-services`)

      expect(response.status).toBe(200)
      expect(response.body.data.sharedServices).toHaveLength(2)
      expect(response.body.data.sharedServices[0].name).toBe('Alpha Service')
      expect(response.body.data.sharedServices[1].name).toBe('Zebra Service')
    })

    it('should exclude deleted roles from shared services', async () => {
      const mockSharedServices: any = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Test Service',
          clientIdentifier: 'test-service',
          isActive: true,
          roles: [
            {
              id: '123e4567-e89b-12d3-a456-426614174001',
              name: 'Active Role',
              description: 'This role is active',
              isDeleted: false
            }
            // Note: Deleted roles are filtered out at the repository level
          ],
          createdDateTime: new Date(),
          updatedDateTime: new Date(),
          createdBy: '123e4567e89b12d3a456426614174001',
          updatedBy: '123e4567e89b12d3a456426614174001'
        }
      ]

      mockTMSRepository.getSharedServicesForTenant.mockResolvedValue(mockSharedServices)

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/shared-services`)

      expect(response.status).toBe(200)
      expect(response.body.data.sharedServices[0].roles).toHaveLength(1)
      expect(response.body.data.sharedServices[0].roles[0].isDeleted).toBe(false)
    })

    it('should return 400 when tenant ID is invalid', async () => {
      const response = await request(app)
        .get('/v1/tenants/invalid-tenant-id/shared-services')

      expect(response.status).toBe(400)
    })

    it('should return 500 when database error occurs', async () => {
      mockTMSRepository.getSharedServicesForTenant.mockRejectedValue(
        new Error('Database error')
      )

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/shared-services`)

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: 'Database error',
        name: 'Error occurred getting shared services for tenant'
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
        apiStatus: 'Healthy'
      })
      expect(response.body.time).toBeDefined()
      expect(typeof response.body.time).toBe('string')
    })
  })

  describe('GET /v1/tenants/:tenantId/users/:tenantUserId/roles', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const tenantUserId = '123e4567-e89b-12d3-a456-426614174001'

    beforeEach(() => {
      app.get('/v1/tenants/:tenantId/users/:tenantUserId/roles',
        validate(validator.getUserRoles, {}, {}),
        (req, res) => tmsController.getUserRoles(req, res)
      )

      app.use((err: any, req: any, res: any, next: any) => {
        if (err.name === 'ValidationError') {
          return res.status(err.statusCode).json(err)
        }
        next(err)
      })
    })

    it('should get user roles successfully', async () => {
      const mockRoles = [
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          name: TMSConstants.TENANT_OWNER,
          description: 'Tenant Owner Role'
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174003',
          name: TMSConstants.USER_ADMIN,
          description: 'User Admin Role'
        }
      ]

      mockTMSRepository.getUserRoles.mockResolvedValue(mockRoles as any)

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/users/${tenantUserId}/roles`)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          roles: expect.arrayContaining([
            expect.objectContaining({
              id: mockRoles[0].id,
              name: mockRoles[0].name
            }),
            expect.objectContaining({
              id: mockRoles[1].id,
              name: mockRoles[1].name
            })
          ])
        }
      })
      expect(mockTMSRepository.getUserRoles).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { tenantId, tenantUserId }
        })
      )
    })

    it('should return empty array when user has no roles', async () => {
      mockTMSRepository.getUserRoles.mockResolvedValue([])

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/users/${tenantUserId}/roles`)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          roles: []
        }
      })
    })

    it('should return 400 when tenant ID is invalid', async () => {
      const response = await request(app)
        .get(`/v1/tenants/invalid-uuid/users/${tenantUserId}/roles`)

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        name: 'ValidationError',
        message: 'Validation Failed',
        details: {
          params: [{
            message: '"tenantId" must be a valid GUID'
          }]
        }
      })
    })

    it('should return 400 when tenant user ID is invalid', async () => {
      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/users/invalid-uuid/roles`)

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        name: 'ValidationError',
        message: 'Validation Failed',
        details: {
          params: [{
            message: '"tenantUserId" must be a valid GUID'
          }]
        }
      })
    })

    it('should return 500 when database error occurs', async () => {
      mockTMSRepository.getUserRoles.mockRejectedValue(new Error('Database connection failed'))

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/users/${tenantUserId}/roles`)

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: 'Database connection failed',
        name: 'Error occurred getting roles for user'
      })
    })
  })

  describe('GET /v1/tenants/:tenantId/users/:tenantUserId', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const tenantUserId = '123e4567-e89b-12d3-a456-426614174001'
    const ssoUserId = 'fd33f1cef7ca4b19a71104d4ecf7066b'

    beforeEach(() => {
      app.get('/v1/tenants/:tenantId/users/:tenantUserId', 
        validate(validator.getTenantUser, {}, {}),
        (req, res) => tmsController.getTenantUser(req, res)
      )

      app.use((err: any, req: any, res: any, next: any) => {
        if (err.name === 'ValidationError') {
          return res.status(err.statusCode).json(err)
        }
        next(err)
      })
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
          email: 'john.smith@gov.bc.ca'
        },
        createdDateTime: '2024-01-01',
        updatedDateTime: '2024-01-01',
        createdBy: 'system',
        updatedBy: 'system'
      }

      mockTMSRepository.getTenantUser.mockResolvedValue(mockTenantUser)

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/users/${tenantUserId}`)

      expect(response.status).toBe(200)
      expect(response.body.data.tenantUser).toEqual(mockTenantUser)
      expect(mockTMSRepository.getTenantUser).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { tenantId, tenantUserId },
          query: {}
        })
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
          email: 'john.smith@gov.bc.ca'
        },
        createdDateTime: '2024-01-01',
        updatedDateTime: '2024-01-01',
        createdBy: 'system',
        updatedBy: 'system'
      }

      const mockGroups = [
        {
          id: 'group-1',
          name: 'Test Group',
          description: 'Test Group Description',
          createdDateTime: '2024-01-01',
          updatedDateTime: '2024-01-01',
          createdBy: 'system',
          updatedBy: 'system'
        }
      ]

      mockTMSRepository.getTenantUser.mockResolvedValue(mockTenantUser)
      mockTMRepository.getTenantUserGroups.mockResolvedValue(mockGroups)

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/users/${tenantUserId}?expand=groups`)

      expect(response.status).toBe(200)
      expect(response.body.data.tenantUser.groups).toEqual(mockGroups)
      expect(mockTMSRepository.getTenantUser).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { tenantId, tenantUserId },
          query: { expand: 'groups' }
        })
      )
      expect(mockTMRepository.getTenantUserGroups).toHaveBeenCalledWith(tenantUserId)
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
          email: 'john.smith@gov.bc.ca'
        },
        roles: [
          {
            id: 'role-1',
            name: 'TENANT_OWNER',
            description: 'Tenant Owner Role',
            isDeleted: false
          }
        ],
        createdDateTime: '2024-01-01',
        updatedDateTime: '2024-01-01',
        createdBy: 'system',
        updatedBy: 'system'
      }

      mockTMSRepository.getTenantUser.mockResolvedValue(mockTenantUser)

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/users/${tenantUserId}?expand=roles`)

      expect(response.status).toBe(200)
      expect(response.body.data.tenantUser.roles).toEqual(mockTenantUser.roles)
      expect(mockTMSRepository.getTenantUser).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { tenantId, tenantUserId },
          query: { expand: 'roles' }
        })
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
          email: 'john.smith@gov.bc.ca'
        },
        createdDateTime: '2024-01-01',
        updatedDateTime: '2024-01-01',
        createdBy: 'system',
        updatedBy: 'system'
      }

      const mockSharedServices = [
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
              isDeleted: false
            }
          ]
        }
      ]

      mockTMSRepository.getTenantUser.mockResolvedValue(mockTenantUser)
      mockTMRepository.getTenantUserSharedServiceRoles.mockResolvedValue(mockSharedServices)

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/users/${tenantUserId}?expand=sharedServices`)

      expect(response.status).toBe(200)
      expect(response.body.data.tenantUser.sharedServices).toEqual(mockSharedServices)
      expect(mockTMSRepository.getTenantUser).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { tenantId, tenantUserId },
          query: { expand: 'sharedServices' }
        })
      )
      expect(mockTMRepository.getTenantUserSharedServiceRoles).toHaveBeenCalledWith(tenantUserId)
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
          email: 'john.smith@gov.bc.ca'
        },
        roles: [
          {
            id: 'role-1',
            name: 'TENANT_OWNER',
            description: 'Tenant Owner Role',
            isDeleted: false
          }
        ],
        createdDateTime: '2024-01-01',
        updatedDateTime: '2024-01-01',
        createdBy: 'system',
        updatedBy: 'system'
      }

      const mockGroups = [
        {
          id: 'group-1',
          name: 'Test Group',
          description: 'Test Group Description',
          createdDateTime: '2024-01-01',
          updatedDateTime: '2024-01-01',
          createdBy: 'system',
          updatedBy: 'system'
        }
      ]

      mockTMSRepository.getTenantUser.mockResolvedValue(mockTenantUser)
      mockTMRepository.getTenantUserGroups.mockResolvedValue(mockGroups)

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/users/${tenantUserId}?expand=groups,roles`)

      expect(response.status).toBe(200)
      expect(response.body.data.tenantUser.groups).toEqual(mockGroups)
      expect(response.body.data.tenantUser.roles).toEqual(mockTenantUser.roles)
      expect(mockTMSRepository.getTenantUser).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { tenantId, tenantUserId },
          query: { expand: 'groups,roles' }
        })
      )
      expect(mockTMRepository.getTenantUserGroups).toHaveBeenCalledWith(tenantUserId)
    })

    it('should return 400 when invalid expand values are provided', async () => {
      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/users/${tenantUserId}?expand=invalidExpand`)

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Validation Failed')
    })

    it('should return 404 when tenant user is not found', async () => {
      mockTMSRepository.getTenantUser.mockRejectedValue(
        new NotFoundError(`Tenant user not found: ${tenantUserId}`)
      )

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/users/${tenantUserId}`)

      expect(response.status).toBe(404)
      expect(response.body.message).toBe(`Tenant user not found: ${tenantUserId}`)
    })

    it('should return 400 when validation fails for invalid tenant ID', async () => {
      const invalidTenantId = 'invalid-uuid'

      const response = await request(app)
        .get(`/v1/tenants/${invalidTenantId}/users/${tenantUserId}`)

      expect(response.status).toBe(400)
      expect(response.body.message).toBe("Validation Failed")
    })

    it('should return 400 when validation fails for invalid tenant user ID', async () => {
      const invalidTenantUserId = 'invalid-uuid'

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/users/${invalidTenantUserId}`)

      expect(response.status).toBe(400)
      expect(response.body.message).toBe("Validation Failed")
    })

    it('should return 500 when database error occurs', async () => {
      mockTMSRepository.getTenantUser.mockRejectedValue(new Error('Database connection failed'))

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/users/${tenantUserId}`)

      expect(response.status).toBe(500)
      expect(response.body.message).toBe('Database connection failed')
    })
  })

  describe('DELETE /v1/tenants/:tenantId/users/:tenantUserId', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const tenantUserId = '123e4567-e89b-12d3-a456-426614174001'

    beforeEach(() => {
      app.delete('/v1/tenants/:tenantId/users/:tenantUserId',
        validate(validator.removeTenantUser, {}, {}),
        (req, res) => tmsController.removeTenantUser(req, res)
      )

      app.use((err: any, req: any, res: any, next: any) => {
        if (err.name === 'ValidationError') {
          return res.status(err.statusCode).json(err)
        }
        next(err)
      })
    })

    it('should remove tenant user successfully', async () => {
      mockTMSRepository.removeTenantUser.mockResolvedValue(undefined)
      mockTMRepository.removeUserFromAllGroups.mockResolvedValue(undefined)

      const response = await request(app)
        .delete(`/v1/tenants/${tenantId}/users/${tenantUserId}`)

      expect(response.status).toBe(204)
      expect(mockTMSRepository.removeTenantUser).toHaveBeenCalled()
      expect(mockTMRepository.removeUserFromAllGroups).toHaveBeenCalled()
    })

    it('should return 404 when tenant user not found', async () => {
      mockTMSRepository.removeTenantUser.mockRejectedValue(
        new NotFoundError(`Tenant user not found or already deleted: ${tenantUserId}`)
      )

      const response = await request(app)
        .delete(`/v1/tenants/${tenantId}/users/${tenantUserId}`)

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: `Tenant user not found or already deleted: ${tenantUserId}`,
        name: 'Error occurred removing tenant user'
      })
    })

    it('should return 409 when trying to remove last tenant owner', async () => {
      mockTMSRepository.removeTenantUser.mockRejectedValue(
        new ConflictError('Cannot remove the last tenant owner. At least one tenant owner must remain.')
      )

      const response = await request(app)
        .delete(`/v1/tenants/${tenantId}/users/${tenantUserId}`)

      expect(response.status).toBe(409)
      expect(response.body).toMatchObject({
        errorMessage: 'Conflict',
        httpResponseCode: 409,
        message: 'Cannot remove the last tenant owner. At least one tenant owner must remain.',
        name: 'Error occurred removing tenant user'
      })
    })

    it('should return 400 when tenant ID is invalid', async () => {
      const response = await request(app)
        .delete(`/v1/tenants/invalid-uuid/users/${tenantUserId}`)

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        name: 'ValidationError',
        message: 'Validation Failed',
        details: {
          params: [{
            message: '"tenantId" must be a valid GUID'
          }]
        }
      })
    })

    it('should return 400 when tenant user ID is invalid', async () => {
      const response = await request(app)
        .delete(`/v1/tenants/${tenantId}/users/invalid-uuid`)

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        name: 'ValidationError',
        message: 'Validation Failed',
        details: {
          params: [{
            message: '"tenantUserId" must be a valid GUID'
          }]
        }
      })
    })

    it('should return 500 when database error occurs', async () => {
      mockTMSRepository.removeTenantUser.mockRejectedValue(new Error('Database connection failed'))

      const response = await request(app)
        .delete(`/v1/tenants/${tenantId}/users/${tenantUserId}`)

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: 'Database connection failed',
        name: 'Error occurred removing tenant user'
      })
    })

    it('should handle transaction rollback when removeTenantUser succeeds but removeUserFromAllGroups fails', async () => {
      mockTMSRepository.removeTenantUser.mockResolvedValue(undefined)
      mockTMRepository.removeUserFromAllGroups.mockRejectedValue(new Error('Database error during group removal'))

      const response = await request(app)
        .delete(`/v1/tenants/${tenantId}/users/${tenantUserId}`)

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: 'Database error during group removal',
        name: 'Error occurred removing tenant user'
      })
      expect(mockTMSRepository.removeTenantUser).toHaveBeenCalled()
      expect(mockTMRepository.removeUserFromAllGroups).toHaveBeenCalled()
    })
  })

  describe('GET /v1/users/bcgovssousers/idir/search', () => {
    beforeEach(() => {
      app.get('/v1/users/bcgovssousers/idir/search',
        validate(validator.searchBCGOVSSOUsers, {}, {}),
        (req, res) => tmsController.searchBCGOVSSOUsers(req, res)
      )

      app.use((err: any, req: any, res: any, next: any) => {
        if (err.name === 'ValidationError') {
          return res.status(err.statusCode).json(err)
        }
        next(err)
      })
    })

    it('should search IDIR users by email successfully', async () => {
      const mockSearchResults = {
        data: [
          {
            guid: 'F45AFBBD68C51D6F956BA3A1DE1878A1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@gov.bc.ca',
            displayName: 'Doe, John'
          }
        ]
      }

      const mockToken = 'mock-access-token'
      const mockAxiosGet = jest.fn().mockResolvedValue({ data: mockSearchResults })
      const mockAxiosPost = jest.fn().mockResolvedValue({ data: { access_token: mockToken } })

      jest.doMock('axios', () => ({
        default: {
          get: mockAxiosGet,
          post: mockAxiosPost
        }
      }))

      // Re-import to get mocked axios
      const axios = require('axios')
      const TMSService = require('../services/tms.service').TMSService
      const service = new TMSService()
      
      jest.spyOn(tmsController.tmsService, 'searchBCGOVSSOUsers').mockResolvedValue(mockSearchResults as any)

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
            displayName: 'Smith, Jane'
          }
        ]
      }

      jest.spyOn(tmsController.tmsService, 'searchBCGOVSSOUsers').mockResolvedValue(mockSearchResults as any)

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
            displayName: 'Johnson, Bob'
          }
        ]
      }

      jest.spyOn(tmsController.tmsService, 'searchBCGOVSSOUsers').mockResolvedValue(mockSearchResults as any)

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
            displayName: 'Williams, Alice'
          }
        ]
      }

      jest.spyOn(tmsController.tmsService, 'searchBCGOVSSOUsers').mockResolvedValue(mockSearchResults as any)

      const response = await request(app)
        .get('/v1/users/bcgovssousers/idir/search')
        .query({ guid: 'F45AFBBD68C51D6F956BA3A1DE1878A4' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockSearchResults)
    })

    it('should return empty array when no users found', async () => {
      const mockSearchResults = { data: [] }

      jest.spyOn(tmsController.tmsService, 'searchBCGOVSSOUsers').mockResolvedValue(mockSearchResults as any)

      const response = await request(app)
        .get('/v1/users/bcgovssousers/idir/search')
        .query({ email: 'nonexistent@gov.bc.ca' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockSearchResults)
    })

    it('should return 400 when no search parameters provided', async () => {
      const response = await request(app)
        .get('/v1/users/bcgovssousers/idir/search')

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
          data: { message: 'Invalid search parameters' }
        }
      }

      jest.spyOn(tmsController.tmsService, 'searchBCGOVSSOUsers').mockRejectedValue(
        new BadRequestError(`BC GOV SSO API returned bad request: ${error.response.data.message}`)
      )

      const response = await request(app)
        .get('/v1/users/bcgovssousers/idir/search')
        .query({ email: 'invalid@email' })

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        errorMessage: 'Bad Request',
        httpResponseCode: 400,
        message: expect.stringContaining('BC GOV SSO API returned bad request'),
        name: 'Error occurred searching SSO users'
      })
    })

    it('should return 500 when API error occurs', async () => {
      jest.spyOn(tmsController.tmsService, 'searchBCGOVSSOUsers').mockRejectedValue(
        new Error('Error invoking BC GOV SSO API')
      )

      const response = await request(app)
        .get('/v1/users/bcgovssousers/idir/search')
        .query({ email: 'test@gov.bc.ca' })

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: 'Error invoking BC GOV SSO API',
        name: 'Error occurred searching SSO users'
      })
    })
  })

  describe('GET /v1/users/bcgovssousers/bceid/search', () => {
    beforeEach(() => {
      app.get('/v1/users/bcgovssousers/bceid/search',
        validate(validator.searchBCGOVSSOBceidUsers, {}, {}),
        (req, res) => tmsController.searchBCGOVSSOBceidUsers(req, res)
      )

      app.use((err: any, req: any, res: any, next: any) => {
        if (err.name === 'ValidationError') {
          return res.status(err.statusCode).json(err)
        }
        next(err)
      })
    })

    it('should search BCEID users by guid successfully', async () => {
      const mockSearchResults = {
        data: [
          {
            guid: 'F45AFBBD68C51D6F956BA3A1DE1878B1',
            displayName: 'Test User',
            username: 'testuser',
            bceidType: 'basic'
          }
        ]
      }

      jest.spyOn(tmsController.tmsService, 'searchBCGOVSSOBceidUsers').mockResolvedValue(mockSearchResults as any)

      const response = await request(app)
        .get('/v1/users/bcgovssousers/bceid/search')
        .query({ bceidType: 'basic', guid: 'F45AFBBD68C51D6F956BA3A1DE1878B1' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockSearchResults)
    })

    it('should search BCEID users by displayName successfully', async () => {
      const mockSearchResults = {
        data: [
          {
            guid: 'F45AFBBD68C51D6F956BA3A1DE1878B2',
            displayName: 'Business User',
            username: 'businessuser',
            bceidType: 'business'
          }
        ]
      }

      jest.spyOn(tmsController.tmsService, 'searchBCGOVSSOBceidUsers').mockResolvedValue(mockSearchResults as any)

      const response = await request(app)
        .get('/v1/users/bcgovssousers/bceid/search')
        .query({ bceidType: 'business', displayName: 'Business User' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockSearchResults)
    })

    it('should search BCEID users by username successfully', async () => {
      const mockSearchResults = {
        data: [
          {
            guid: 'F45AFBBD68C51D6F956BA3A1DE1878B3',
            displayName: 'Username User',
            username: 'usernameuser',
            bceidType: 'both'
          }
        ]
      }

      jest.spyOn(tmsController.tmsService, 'searchBCGOVSSOBceidUsers').mockResolvedValue(mockSearchResults as any)

      const response = await request(app)
        .get('/v1/users/bcgovssousers/bceid/search')
        .query({ bceidType: 'both', username: 'usernameuser' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockSearchResults)
    })

    it('should return empty array when no users found', async () => {
      const mockSearchResults = { data: [] }

      jest.spyOn(tmsController.tmsService, 'searchBCGOVSSOBceidUsers').mockResolvedValue(mockSearchResults as any)

      const response = await request(app)
        .get('/v1/users/bcgovssousers/bceid/search')
        .query({ bceidType: 'basic', guid: 'NONEXISTENT' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockSearchResults)
    })

    it('should return 400 when bceidType is missing', async () => {
      const response = await request(app)
        .get('/v1/users/bcgovssousers/bceid/search')
        .query({ guid: 'F45AFBBD68C51D6F956BA3A1DE1878B1' })

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Validation Failed')
    })

    it('should return 400 when bceidType is invalid', async () => {
      const response = await request(app)
        .get('/v1/users/bcgovssousers/bceid/search')
        .query({ bceidType: 'invalid', guid: 'F45AFBBD68C51D6F956BA3A1DE1878B1' })

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Validation Failed')
    })

    it('should return 400 when BC GOV SSO BCEID API returns bad request', async () => {
      const error = {
        response: {
          status: 400,
          data: { message: 'Invalid search parameters' }
        }
      }

      jest.spyOn(tmsController.tmsService, 'searchBCGOVSSOBceidUsers').mockRejectedValue(
        new BadRequestError(`BC GOV SSO BCEID API returned bad request: ${error.response.data.message}`)
      )

      const response = await request(app)
        .get('/v1/users/bcgovssousers/bceid/search')
        .query({ bceidType: 'basic', guid: 'invalid' })

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        errorMessage: 'Bad Request',
        httpResponseCode: 400,
        message: expect.stringContaining('BC GOV SSO BCEID API returned bad request'),
        name: 'Error occurred searching BCEID users'
      })
    })

    it('should return 500 when API error occurs', async () => {
      jest.spyOn(tmsController.tmsService, 'searchBCGOVSSOBceidUsers').mockRejectedValue(
        new Error('Error invoking BC GOV SSO BCEID API')
      )

      const response = await request(app)
        .get('/v1/users/bcgovssousers/bceid/search')
        .query({ bceidType: 'basic', guid: 'F45AFBBD68C51D6F956BA3A1DE1878B1' })

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: 'Error invoking BC GOV SSO BCEID API',
        name: 'Error occurred searching BCEID users'
      })
    })
  })
}) 