import request from 'supertest'
import express from 'express'
import { TMSRepository } from '../repositories/tms.repository'
import { TMSConstants } from '../common/tms.constants'
import { TMSController } from '../controllers/tms.controller'
import { validate } from 'express-validation'
import validator from '../common/tms.validator'
import { Tenant } from '../entities/Tenant'
import { TenantUser } from '../entities/TenantUser'
import { ConflictError } from '../errors/ConflictError'
import { NotFoundError } from '../errors/NotFoundError'

jest.mock('../repositories/tms.repository')
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
  let tmsController: TMSController

  beforeEach(() => {
    jest.clearAllMocks()
    app = express()
    app.use(express.json())
    
    tmsController = new TMSController()
    mockTMSRepository = TMSRepository.prototype as jest.Mocked<TMSRepository>

    app.post('/v1/tenants', 
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
  })

  describe('POST /v1/tenants/:tenantId/users', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const validUserData = {
      user: {
        firstName: 'Test',
        lastName: 'User',
        displayName: 'Test User',
        ssoUserId: 'F45AFBBD68C4466F956BA3A1D91878AD',
        email: 'test@gov.bc.ca'
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
        }]
      }

      mockTMSRepository.addTenantUsers.mockResolvedValue(mockResponse)

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

      expect(mockTMSRepository.addTenantUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { tenantId },
          body: validUserData
        })
      )
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
        ssoUserId,
        ['tenantUserRoles']
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
        invalidSsoUserId,
        ['tenantUserRoles']
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
          ssoUser: {
            id: '123e4567-e89b-12d3-a456-426614174004',
            ssoUserId: 'F45AFBBD68C44D6F956BA3A1D91878AD',
            firstName: 'Test',
            lastName: 'User',
            displayName: 'Test User',
            userName: 'testuser',
            email: 'test@gov.bc.ca',
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
        validate(validator.getRolesForSSOUser, {}, {}),
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
}) 