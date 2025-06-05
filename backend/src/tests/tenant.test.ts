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
        ssoUserId: 'test-guid',
        email: 'test@example.com'
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
}) 