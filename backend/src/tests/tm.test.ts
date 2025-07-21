import request from 'supertest'
import express from 'express'
import { TMRepository } from '../repositories/tm.repository'
import { TMSRepository } from '../repositories/tms.repository'
import { TMSConstants } from '../common/tms.constants'
import { TMController } from '../controllers/tm.controller'
import { validate } from 'express-validation'
import validator from '../common/tms.validator'
import { Group } from '../entities/Group'
import { GroupUser } from '../entities/GroupUser'
import { ConflictError } from '../errors/ConflictError'
import { NotFoundError } from '../errors/NotFoundError'

jest.mock('../repositories/tm.repository')
jest.mock('../repositories/tms.repository')
jest.mock('../common/db.connection', () => ({
  connection: {
    manager: {
      transaction: jest.fn().mockImplementation((callback) => callback()),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn()
      }))
    }
  }
}))

describe('Tenant Management API', () => {
  let app: express.Application
  let mockTMRepository: jest.Mocked<TMRepository>
  let mockTMSRepository: jest.Mocked<TMSRepository>
  let tmController: TMController

  beforeEach(() => {
    jest.clearAllMocks()
    app = express()
    app.use(express.json())
    
    tmController = new TMController()
    mockTMRepository = TMRepository.prototype as jest.Mocked<TMRepository>
    mockTMSRepository = TMSRepository.prototype as jest.Mocked<TMSRepository>

    app.post('/v1/tenants/:tenantId/groups', 
      validate(validator.createGroup, {}, {}),
      (req, res) => tmController.createGroup(req, res)
    )

    app.put('/v1/tenants/:tenantId/groups/:groupId',
      validate(validator.updateGroup, {}, {}),
      (req, res) => tmController.updateGroup(req, res)
    )

    app.use((err: any, req: any, res: any, next: any) => {
      if (err.name === 'ValidationError') {
        return res.status(err.statusCode).json(err)
      }
      next(err)
    })
  })

  describe('POST /v1/tenants/:tenantId/groups', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const validGroupData = {
      name: 'Test Group',
      description: 'Test Group Description'
    }

    it('should create a group successfully', async () => {
      const mockGroup = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: validGroupData.name,
        description: validGroupData.description,
        tenant: { id: tenantId },
        users: [],
        createdBy: 'test-user',
        updatedBy: 'test-user',
        createdDateTime: new Date(),
        updatedDateTime: new Date()
      }

      mockTMRepository.saveGroup.mockResolvedValue(mockGroup)

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/groups`)
        .send(validGroupData)

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        data: {
          group: {
            id: mockGroup.id,
            name: mockGroup.name,
            description: mockGroup.description,
            tenant: { id: tenantId }
          }
        }
      })

      expect(mockTMRepository.saveGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { tenantId },
          body: validGroupData
        })
      )
    })

    it('should create a group with tenant user successfully', async () => {
      const tenantUserId = '123e4567-e89b-12d3-a456-426614174002'
      const groupDataWithUser = {
        ...validGroupData,
        tenantUserId
      }

      const mockGroupWithUser = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: validGroupData.name,
        description: validGroupData.description,
        tenant: { id: tenantId },
        users: [{
          id: '123e4567-e89b-12d3-a456-426614174003',
          group: { id: '123e4567-e89b-12d3-a456-426614174001' },
          tenantUser: { id: tenantUserId },
          isDeleted: false,
          createdBy: 'test-user',
          updatedBy: 'test-user'
        }],
        createdBy: 'test-user',
        updatedBy: 'test-user'
      }

      mockTMRepository.saveGroup.mockResolvedValue(mockGroupWithUser)

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/groups`)
        .send(groupDataWithUser)

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        data: {
          group: {
            id: mockGroupWithUser.id,
            name: mockGroupWithUser.name,
            users: expect.arrayContaining([
              expect.objectContaining({
                tenantUser: { id: tenantUserId }
              })
            ])
          }
        }
      })

      expect(mockTMRepository.saveGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { tenantId },
          body: groupDataWithUser
        })
      )
    })

    it('should fail when tenant does not exist', async () => {
      const errorMessage = `Tenant not found: ${tenantId}`
      mockTMRepository.saveGroup.mockRejectedValue(new NotFoundError(errorMessage))

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/groups`)
        .send(validGroupData)

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: errorMessage,
        name: 'Error occurred creating group'
      })
    })

    it('should fail when group name already exists in tenant', async () => {
      const errorMessage = `A group with name '${validGroupData.name}' already exists in this tenant`
      mockTMRepository.saveGroup.mockRejectedValue(new ConflictError(errorMessage))

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/groups`)
        .send(validGroupData)

      expect(response.status).toBe(409)
      expect(response.body).toMatchObject({
        errorMessage: 'Conflict',
        httpResponseCode: 409,
        message: errorMessage,
        name: 'Error occurred creating group'
      })
    })

    it('should fail when tenant user does not exist', async () => {
      const tenantUserId = '123e4567-e89b-12d3-a456-426614174002'
      const groupDataWithUser = {
        ...validGroupData,
        tenantUserId
      }

      const errorMessage = `Tenant user not found: ${tenantUserId}`
      mockTMRepository.saveGroup.mockRejectedValue(new NotFoundError(errorMessage))

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/groups`)
        .send(groupDataWithUser)

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: errorMessage,
        name: 'Error occurred creating group'
      })
    })

    it('should return 500 when database error occurs', async () => {
      const errorMessage = 'Database connection failed'
      mockTMRepository.saveGroup.mockRejectedValue(new Error(errorMessage))

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/groups`)
        .send(validGroupData)

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: errorMessage,
        name: 'Error occurred creating group'
      })
    })

    it('should return 400 when validation fails', async () => {
      const invalidData = {
        name: '', // Empty name
        description: 'A'.repeat(501) // Too long description
      }

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/groups`)
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body.message).toBe("Validation Failed")
    })

    it('should return 400 when tenant ID is invalid UUID', async () => {
      const invalidTenantId = 'invalid-uuid'

      const response = await request(app)
        .post(`/v1/tenants/${invalidTenantId}/groups`)
        .send(validGroupData)

      expect(response.status).toBe(400)
      expect(response.body.message).toBe("Validation Failed")
    })
  })

  describe('PUT /v1/tenants/:tenantId/groups/:groupId', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const groupId = '123e4567-e89b-12d3-a456-426614174001'
    const validUpdateData = {
      name: 'Updated Group Name',
      description: 'Updated Group Description'
    }

    it('should update a group successfully', async () => {
      const mockUpdatedGroup = {
        id: groupId,
        name: validUpdateData.name,
        description: validUpdateData.description,
        tenant: { id: tenantId },
        users: [],
        createdBy: 'test-user',
        updatedBy: 'test-user',
        createdDateTime: new Date(),
        updatedDateTime: new Date()
      }

      mockTMRepository.updateGroup.mockResolvedValue(mockUpdatedGroup as any)

      const response = await request(app)
        .put(`/v1/tenants/${tenantId}/groups/${groupId}`)
        .send(validUpdateData)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          group: {
            id: groupId,
            name: validUpdateData.name,
            description: validUpdateData.description,
            tenant: { id: tenantId }
          }
        }
      })

      expect(mockTMRepository.updateGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { tenantId, groupId },
          body: validUpdateData
        })
      )
    })

    it('should update only group name successfully', async () => {
      const updateNameOnly = {
        name: 'New Group Name Only'
      }

      const mockUpdatedGroup = {
        id: groupId,
        name: updateNameOnly.name,
        description: 'Original Description',
        tenant: { id: tenantId },
        users: [],
        createdBy: 'test-user',
        updatedBy: 'test-user'
      }

      mockTMRepository.updateGroup.mockResolvedValue(mockUpdatedGroup as any)

      const response = await request(app)
        .put(`/v1/tenants/${tenantId}/groups/${groupId}`)
        .send(updateNameOnly)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          group: {
            id: groupId,
            name: updateNameOnly.name,
            description: 'Original Description'
          }
        }
      })
    })

    it('should update only group description successfully', async () => {
      const updateDescriptionOnly = {
        description: 'New Description Only'
      }

      const mockUpdatedGroup = {
        id: groupId,
        name: 'Original Name',
        description: updateDescriptionOnly.description,
        tenant: { id: tenantId },
        users: [],
        createdBy: 'test-user',
        updatedBy: 'test-user'
      }

      mockTMRepository.updateGroup.mockResolvedValue(mockUpdatedGroup as any)

      const response = await request(app)
        .put(`/v1/tenants/${tenantId}/groups/${groupId}`)
        .send(updateDescriptionOnly)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          group: {
            id: groupId,
            name: 'Original Name',
            description: updateDescriptionOnly.description
          }
        }
      })
    })

    it('should fail when group does not exist', async () => {
      const errorMessage = `Group not found: ${groupId}`
      mockTMRepository.updateGroup.mockRejectedValue(new NotFoundError(errorMessage))

      const response = await request(app)
        .put(`/v1/tenants/${tenantId}/groups/${groupId}`)
        .send(validUpdateData)

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: errorMessage,
        name: 'Error occurred updating group'
      })
    })

    it('should fail when group name already exists in tenant', async () => {
      const errorMessage = `A group with name '${validUpdateData.name}' already exists in this tenant`
      mockTMRepository.updateGroup.mockRejectedValue(new ConflictError(errorMessage))

      const response = await request(app)
        .put(`/v1/tenants/${tenantId}/groups/${groupId}`)
        .send(validUpdateData)

      expect(response.status).toBe(409)
      expect(response.body).toMatchObject({
        errorMessage: 'Conflict',
        httpResponseCode: 409,
        message: errorMessage,
        name: 'Error occurred updating group'
      })
    })

    it('should return 500 when database error occurs', async () => {
      const errorMessage = 'Database connection failed'
      mockTMRepository.updateGroup.mockRejectedValue(new Error(errorMessage))

      const response = await request(app)
        .put(`/v1/tenants/${tenantId}/groups/${groupId}`)
        .send(validUpdateData)

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: errorMessage,
        name: 'Error occurred updating group'
      })
    })

    it('should return 400 when validation fails', async () => {
      const invalidData = {
        name: '', // Empty name
        description: 'A'.repeat(501) // Too long description
      }

      const response = await request(app)
        .put(`/v1/tenants/${tenantId}/groups/${groupId}`)
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body.message).toBe("Validation Failed")
    })

    it('should return 400 when tenant ID is invalid UUID', async () => {
      const invalidTenantId = 'invalid-uuid'

      const response = await request(app)
        .put(`/v1/tenants/${invalidTenantId}/groups/${groupId}`)
        .send(validUpdateData)

      expect(response.status).toBe(400)
      expect(response.body.message).toBe("Validation Failed")
    })

    it('should return 400 when group ID is invalid UUID', async () => {
      const invalidGroupId = 'invalid-uuid'

      const response = await request(app)
        .put(`/v1/tenants/${tenantId}/groups/${invalidGroupId}`)
        .send(validUpdateData)

      expect(response.status).toBe(400)
      expect(response.body.message).toBe("Validation Failed")
    })
  })
}) 