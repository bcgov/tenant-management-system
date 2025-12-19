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
import { BadRequestError } from '../errors/BadRequestError'
import { UnauthorizedError } from '../errors/UnauthorizedError'

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

    app.post('/v1/tenants/:tenantId/groups/:groupId/users',
      validate(validator.addGroupUser, {}, {}),
      (req, res) => tmController.addGroupUser(req, res)
    )

    app.delete('/v1/tenants/:tenantId/groups/:groupId/users/:groupUserId',
      validate(validator.removeGroupUser, {}, {}),
      (req, res) => tmController.removeGroupUser(req, res)
    )

    app.get('/v1/tenants/:tenantId/groups/:groupId',
      validate(validator.getGroup, {}, {}),
      (req, res) => tmController.getGroup(req, res)
    )

    app.get('/v1/tenants/:tenantId/groups',
      validate(validator.getTenantGroups, {}, {}),
      (req, res) => tmController.getTenantGroups(req, res)
    )

    app.get('/v1/tenants/:tenantId/groups/:groupId/shared-services/shared-service-roles',
      validate(validator.getSharedServiceRolesForGroup, {}, {}),
      (req, res) => tmController.getSharedServiceRolesForGroup(req, res)
    )

    app.put('/v1/tenants/:tenantId/groups/:groupId/shared-services/shared-service-roles',
      validate(validator.updateSharedServiceRolesForGroup, {}, {}),
      (req, res) => tmController.updateSharedServiceRolesForGroup(req, res)
    )

    app.get('/v1/tenants/:tenantId/users/:ssoUserId/groups/shared-service-roles',
      validate(validator.getUserGroupsWithSharedServiceRoles, {}, {}),
      (req, res, next) => {
        req.decodedJwt = {
          aud: 'test-service-client',
          audience: 'test-service-client',
          idir_user_guid: 'F45AFBBD68C51D6F956BA3A1DE1878A2'
        }
        req.isSharedServiceAccess = true
        next()
      },
      (req, res, next) => {
        next()
      },
      (req, res) => tmController.getUserGroupsWithSharedServiceRoles(req, res)
    )

    app.get('/v1/tenants/:tenantId/ssousers/:ssoUserId/shared-service-roles',
      validate(validator.getEffectiveSharedServiceRoles, {}, {}),
      (req, res, next) => {
        req.decodedJwt = {
          aud: 'test-service-client',
          audience: 'test-service-client',
          idir_user_guid: 'F45AFBBD68C51D6F956BA3A1DE1878A2'
        }
        req.isSharedServiceAccess = true
        req.idpType = 'idir'
        next()
      },
      (req, res, next) => {
        next()
      },
      (req, res) => tmController.getEffectiveSharedServiceRoles(req, res)
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
        name: '',
        description: 'A'.repeat(501)
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

    it('should handle empty group name', async () => {
      const groupDataWithEmptyName = {
        ...validGroupData,
        name: ''
      }

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/groups`)
        .send(groupDataWithEmptyName)

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Validation Failed')
    })

    it('should handle very long group name', async () => {
      const longName = 'a'.repeat(500)
      const groupDataWithLongName = {
        ...validGroupData,
        name: longName
      }

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/groups`)
        .send(groupDataWithLongName)

      expect([201, 400, 404, 500]).toContain(response.status)
    })

    it('should handle special characters in group name', async () => {
      const groupDataWithSpecialChars = {
        ...validGroupData,
        name: "Test & Group <script>alert('xss')</script>"
      }

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/groups`)
        .send(groupDataWithSpecialChars)

      expect([201, 400, 500]).toContain(response.status)
    })

    it('should handle null description', async () => {
      const groupDataWithNullDescription = {
        ...validGroupData,
        description: null
      }

      const mockGroup = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: validGroupData.name,
        description: null,
        tenant: { id: tenantId }
      }

      mockTMRepository.saveGroup.mockResolvedValue(mockGroup as any)

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/groups`)
        .send(groupDataWithNullDescription)

      expect([201, 400]).toContain(response.status)
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
        name: '',
        description: 'A'.repeat(501)
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

  describe('POST /v1/tenants/:tenantId/groups/:groupId/users', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const groupId = '123e4567-e89b-12d3-a456-426614174001'
    const validUserData = {
      user: {
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        ssoUserId: 'F45AFBBD68C51D6F956BA3A1DE1878A1',
        email: 'john.doe@gov.bc.ca',
        userName: 'johndoe',
        idpType: 'idir'
      }
    }

    it('should add a user to a group successfully', async () => {
      const mockGroup = { id: groupId, name: 'Test Group' }
      const mockTenantUser = { id: '123e4567-e89b-12d3-a456-426614174003' }
      const mockGroupUser = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        group: { id: groupId },
        tenantUser: {
          id: '123e4567-e89b-12d3-a456-426614174003',
          firstName: validUserData.user.firstName,
          lastName: validUserData.user.lastName,
          displayName: validUserData.user.displayName,
          ssoUserId: validUserData.user.ssoUserId,
          email: validUserData.user.email,
          userName: validUserData.user.userName
        },
        isDeleted: false,
        createdBy: 'test-user',
        updatedBy: 'test-user',
        createdDateTime: new Date(),
        updatedDateTime: new Date()
      }

      mockTMRepository.checkIfGroupExistsInTenant.mockResolvedValue(mockGroup as any)
      mockTMSRepository.ensureTenantUserExists.mockResolvedValue(mockTenantUser as any)
      mockTMRepository.addGroupUser.mockResolvedValue(mockGroupUser as any)

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/groups/${groupId}/users`)
        .send(validUserData)

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        data: {
          groupUser: {
            id: mockGroupUser.id,
            group: { id: groupId },
            tenantUser: {
              firstName: validUserData.user.firstName,
              lastName: validUserData.user.lastName,
              ssoUserId: validUserData.user.ssoUserId,
              email: validUserData.user.email
            }
          }
        }
      })

      expect(mockTMRepository.addGroupUser).toHaveBeenCalled()
      const callArgs = mockTMRepository.addGroupUser.mock.calls[0]
      expect(callArgs[0].params.tenantId).toBe(tenantId)
      expect(callArgs[0].params.groupId).toBe(groupId)
      expect(callArgs[0].body.tenantUserId).toBe(mockTenantUser.id)
      expect(callArgs.length).toBeGreaterThanOrEqual(2)
    })

    it('should add a user to a group without optional fields successfully', async () => {
      const userDataWithoutOptional = {
        user: {
          firstName: 'Jane',
          lastName: 'Smith',
          displayName: 'Jane Smith',
          ssoUserId: 'F45AFBBD68C51D6F956BA3A1DE1878A2'
        }
      }

      const mockGroup = { id: groupId, name: 'Test Group' }
      const mockTenantUser = { id: '123e4567-e89b-12d3-a456-426614174003' }
      const mockGroupUser = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        group: { id: groupId },
        tenantUser: {
          id: '123e4567-e89b-12d3-a456-426614174003',
          firstName: userDataWithoutOptional.user.firstName,
          lastName: userDataWithoutOptional.user.lastName,
          displayName: userDataWithoutOptional.user.displayName,
          ssoUserId: userDataWithoutOptional.user.ssoUserId
        },
        isDeleted: false,
        createdBy: 'test-user',
        updatedBy: 'test-user'
      }

      mockTMRepository.checkIfGroupExistsInTenant.mockResolvedValue(mockGroup as any)
      mockTMSRepository.ensureTenantUserExists.mockResolvedValue(mockTenantUser as any)
      mockTMRepository.addGroupUser.mockResolvedValue(mockGroupUser as any)

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/groups/${groupId}/users`)
        .send(userDataWithoutOptional)

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        data: {
          groupUser: {
            id: mockGroupUser.id,
            tenantUser: {
              firstName: userDataWithoutOptional.user.firstName,
              lastName: userDataWithoutOptional.user.lastName,
              ssoUserId: userDataWithoutOptional.user.ssoUserId
            }
          }
        }
      })
    })

    it('should fail when group does not exist', async () => {
      const errorMessage = `Group not found or does not exist for tenant: ${tenantId}`
      mockTMRepository.checkIfGroupExistsInTenant.mockResolvedValue(null)

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/groups/${groupId}/users`)
        .send(validUserData)

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: errorMessage,
        name: 'Error occurred adding user to group'
      })
    })

    it('should fail when user is already in the group', async () => {
      const mockGroup = { id: groupId, name: 'Test Group' }
      const mockTenantUser = { id: '123e4567-e89b-12d3-a456-426614174003' }
      const errorMessage = `User is already a member of this group`
      mockTMRepository.checkIfGroupExistsInTenant.mockResolvedValue(mockGroup as any)
      mockTMSRepository.ensureTenantUserExists.mockResolvedValue(mockTenantUser as any)
      mockTMRepository.addGroupUser.mockRejectedValue(new ConflictError(errorMessage))

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/groups/${groupId}/users`)
        .send(validUserData)

      expect(response.status).toBe(409)
      expect(response.body).toMatchObject({
        errorMessage: 'Conflict',
        httpResponseCode: 409,
        message: errorMessage,
        name: 'Error occurred adding user to group'
      })
    })

    it('should return 500 when database error occurs', async () => {
      const mockGroup = { id: groupId, name: 'Test Group' }
      const mockTenantUser = { id: '123e4567-e89b-12d3-a456-426614174003' }
      const errorMessage = 'Database connection failed'
      mockTMRepository.checkIfGroupExistsInTenant.mockResolvedValue(mockGroup as any)
      mockTMSRepository.ensureTenantUserExists.mockResolvedValue(mockTenantUser as any)
      mockTMRepository.addGroupUser.mockRejectedValue(new Error(errorMessage))

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/groups/${groupId}/users`)
        .send(validUserData)

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: errorMessage,
        name: 'Error occurred adding user to group'
      })
    })

    it('should return 400 when validation fails', async () => {
      const invalidTenantId = 'invalid-uuid'
      const invalidGroupId = 'invalid-uuid'
      const invalidData = {
        user: {
          firstName: '',
          lastName: 'Doe',
          displayName: 'John Doe',
          ssoUserId: 'F45AFBBD68C51D6F956BA3A1DE1878A1'
        }
      }

      const response1 = await request(app)
        .post(`/v1/tenants/${invalidTenantId}/groups/${groupId}/users`)
        .send(validUserData)

      expect(response1.status).toBe(400)
      expect(response1.body.message).toBe("Validation Failed")

      const response2 = await request(app)
        .post(`/v1/tenants/${tenantId}/groups/${invalidGroupId}/users`)
        .send(validUserData)

      expect(response2.status).toBe(400)
      expect(response2.body.message).toBe("Validation Failed")

      const response3 = await request(app)
        .post(`/v1/tenants/${tenantId}/groups/${groupId}/users`)
        .send(invalidData)

      expect(response3.status).toBe(400)
      expect(response3.body.message).toBe("Validation Failed")
    })

    it('should handle transaction rollback when checkIfGroupExistsInTenant succeeds but addGroupUser fails', async () => {
      const mockGroup = { id: groupId, name: 'Test Group' }
      const mockTenantUser = { id: '123e4567-e89b-12d3-a456-426614174003' }

      mockTMRepository.checkIfGroupExistsInTenant.mockResolvedValue(mockGroup as any)
      mockTMSRepository.ensureTenantUserExists.mockResolvedValue(mockTenantUser as any)
      mockTMRepository.addGroupUser.mockRejectedValue(new Error('Database error during group user creation'))

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/groups/${groupId}/users`)
        .send(validUserData)

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: 'Database error during group user creation',
        name: 'Error occurred adding user to group'
      })
      expect(mockTMRepository.checkIfGroupExistsInTenant).toHaveBeenCalled()
      expect(mockTMSRepository.ensureTenantUserExists).toHaveBeenCalled()
      expect(mockTMRepository.addGroupUser).toHaveBeenCalled()
    })

    it('should handle transaction rollback when ensureTenantUserExists fails', async () => {
      const mockGroup = { id: groupId, name: 'Test Group' }

      mockTMRepository.checkIfGroupExistsInTenant.mockResolvedValue(mockGroup as any)
      mockTMSRepository.ensureTenantUserExists.mockRejectedValue(new Error('Database error during tenant user creation'))

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/groups/${groupId}/users`)
        .send(validUserData)

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: 'Database error during tenant user creation',
        name: 'Error occurred adding user to group'
      })
      expect(mockTMRepository.checkIfGroupExistsInTenant).toHaveBeenCalled()
      expect(mockTMSRepository.ensureTenantUserExists).toHaveBeenCalled()
      expect(mockTMRepository.addGroupUser).not.toHaveBeenCalled()
    })

    it('should restore soft-deleted group user when adding user to group', async () => {
      const mockGroup = { id: groupId, name: 'Test Group' }
      const mockTenantUser = { id: '123e4567-e89b-12d3-a456-426614174003' }
      const mockGroupUser = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        group: { id: groupId },
        tenantUser: {
          id: '123e4567-e89b-12d3-a456-426614174003',
          firstName: validUserData.user.firstName,
          lastName: validUserData.user.lastName,
          ssoUserId: validUserData.user.ssoUserId
        },
        isDeleted: false,
        updatedBy: 'test-user',
        updatedDateTime: new Date()
      }

      mockTMRepository.checkIfGroupExistsInTenant.mockResolvedValue(mockGroup as any)
      mockTMSRepository.ensureTenantUserExists.mockResolvedValue(mockTenantUser as any)
      mockTMRepository.addGroupUser.mockResolvedValue(mockGroupUser as any)

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/groups/${groupId}/users`)
        .send(validUserData)

      expect(response.status).toBe(201)
      expect(response.body.data.groupUser.id).toBe(mockGroupUser.id)
      expect(response.body.data.groupUser.isDeleted).toBe(false)
    })

    it('should restore soft-deleted tenant user when adding user to group', async () => {
      const mockGroup = { id: groupId, name: 'Test Group' }
      const mockRestoredTenantUser = { 
        id: '123e4567-e89b-12d3-a456-426614174003',
        isDeleted: false
      }
      const mockGroupUser = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        group: { id: groupId },
        tenantUser: {
          id: '123e4567-e89b-12d3-a456-426614174003',
          firstName: validUserData.user.firstName,
          lastName: validUserData.user.lastName,
          ssoUserId: validUserData.user.ssoUserId
        },
        isDeleted: false
      }

      mockTMRepository.checkIfGroupExistsInTenant.mockResolvedValue(mockGroup as any)
      mockTMSRepository.ensureTenantUserExists.mockResolvedValue(mockRestoredTenantUser as any)
      mockTMRepository.addGroupUser.mockResolvedValue(mockGroupUser as any)

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/groups/${groupId}/users`)
        .send(validUserData)

      expect(response.status).toBe(201)
      expect(response.body.data.groupUser.id).toBe(mockGroupUser.id)
      expect(mockTMSRepository.ensureTenantUserExists).toHaveBeenCalled()
    })

    it('should handle null/undefined values in optional fields', async () => {
      const userDataWithNulls = {
        user: {
          firstName: 'John',
          lastName: 'Doe',
          displayName: 'John Doe',
          ssoUserId: 'F45AFBBD68C51D6F956BA3A1DE1878A1',
          email: null,
          userName: undefined
        }
      }

      const mockGroup = { id: groupId, name: 'Test Group' }
      const mockTenantUser = { id: '123e4567-e89b-12d3-a456-426614174003' }
      const mockGroupUser = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        group: { id: groupId },
        tenantUser: {
          id: '123e4567-e89b-12d3-a456-426614174003',
          firstName: userDataWithNulls.user.firstName,
          lastName: userDataWithNulls.user.lastName,
          ssoUserId: userDataWithNulls.user.ssoUserId
        },
        isDeleted: false
      }

      mockTMRepository.checkIfGroupExistsInTenant.mockResolvedValue(mockGroup as any)
      mockTMSRepository.ensureTenantUserExists.mockResolvedValue(mockTenantUser as any)
      mockTMRepository.addGroupUser.mockResolvedValue(mockGroupUser as any)

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/groups/${groupId}/users`)
        .send(userDataWithNulls)

      expect([201, 400]).toContain(response.status)
    })

    it('should handle special characters in user data', async () => {
      const userDataWithSpecialChars = {
        user: {
          firstName: "O'Brien",
          lastName: 'Smith-Johnson',
          displayName: 'Test & User <script>',
          ssoUserId: 'F45AFBBD68C51D6F956BA3A1DE1878A1',
          email: 'test+user@example.com'
        }
      }

      const mockGroup = { id: groupId, name: 'Test Group' }
      const mockTenantUser = { id: '123e4567-e89b-12d3-a456-426614174003' }
      const mockGroupUser = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        group: { id: groupId },
        tenantUser: {
          id: '123e4567-e89b-12d3-a456-426614174003',
          firstName: userDataWithSpecialChars.user.firstName,
          lastName: userDataWithSpecialChars.user.lastName,
          displayName: userDataWithSpecialChars.user.displayName,
          ssoUserId: userDataWithSpecialChars.user.ssoUserId
        },
        isDeleted: false
      }

      mockTMRepository.checkIfGroupExistsInTenant.mockResolvedValue(mockGroup as any)
      mockTMSRepository.ensureTenantUserExists.mockResolvedValue(mockTenantUser as any)
      mockTMRepository.addGroupUser.mockResolvedValue(mockGroupUser as any)

      const response = await request(app)
        .post(`/v1/tenants/${tenantId}/groups/${groupId}/users`)
        .send(userDataWithSpecialChars)

      expect([201, 400]).toContain(response.status)
    })
  })

  describe('DELETE /v1/tenants/:tenantId/groups/:groupId/users/:groupUserId', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const groupId = '123e4567-e89b-12d3-a456-426614174001'
    const groupUserId = '123e4567-e89b-12d3-a456-426614174002'

    it('should remove a user from a group successfully', async () => {
      mockTMRepository.removeGroupUser.mockResolvedValue(undefined)

      const response = await request(app)
        .delete(`/v1/tenants/${tenantId}/groups/${groupId}/users/${groupUserId}`)

      expect(response.status).toBe(204)
      expect(response.body).toEqual({})

      expect(mockTMRepository.removeGroupUser).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { tenantId, groupId, groupUserId }
        })
      )
    })

    it('should fail when group does not exist', async () => {
      const errorMessage = `Group not found: ${groupId}`
      mockTMRepository.removeGroupUser.mockRejectedValue(new NotFoundError(errorMessage))

      const response = await request(app)
        .delete(`/v1/tenants/${tenantId}/groups/${groupId}/users/${groupUserId}`)

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: errorMessage,
        name: 'Error occurred removing user from group'
      })
    })

    it('should fail when group user does not exist', async () => {
      const errorMessage = `Group user not found: ${groupUserId}`
      mockTMRepository.removeGroupUser.mockRejectedValue(new NotFoundError(errorMessage))

      const response = await request(app)
        .delete(`/v1/tenants/${tenantId}/groups/${groupId}/users/${groupUserId}`)

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: errorMessage,
        name: 'Error occurred removing user from group'
      })
    })

    it('should fail when user is not in the group', async () => {
      const errorMessage = `User is not a member of this group`
      mockTMRepository.removeGroupUser.mockRejectedValue(new ConflictError(errorMessage))

      const response = await request(app)
        .delete(`/v1/tenants/${tenantId}/groups/${groupId}/users/${groupUserId}`)

      expect(response.status).toBe(409)
      expect(response.body).toMatchObject({
        errorMessage: 'Conflict',
        httpResponseCode: 409,
        message: errorMessage,
        name: 'Error occurred removing user from group'
      })
    })

    it('should return 500 when database error occurs', async () => {
      const errorMessage = 'Database connection failed'
      mockTMRepository.removeGroupUser.mockRejectedValue(new Error(errorMessage))

      const response = await request(app)
        .delete(`/v1/tenants/${tenantId}/groups/${groupId}/users/${groupUserId}`)

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: errorMessage,
        name: 'Error occurred removing user from group'
      })
    })

    it('should return 400 when validation fails', async () => {
      const invalidTenantId = 'invalid-uuid'
      const invalidGroupId = 'invalid-uuid'
      const invalidGroupUserId = 'invalid-uuid'

      const response1 = await request(app)
        .delete(`/v1/tenants/${invalidTenantId}/groups/${groupId}/users/${groupUserId}`)

      expect(response1.status).toBe(400)
      expect(response1.body.message).toBe("Validation Failed")

      const response2 = await request(app)
        .delete(`/v1/tenants/${tenantId}/groups/${invalidGroupId}/users/${groupUserId}`)

      expect(response2.status).toBe(400)
      expect(response2.body.message).toBe("Validation Failed")

      const response3 = await request(app)
        .delete(`/v1/tenants/${tenantId}/groups/${groupId}/users/${invalidGroupUserId}`)

      expect(response3.status).toBe(400)
      expect(response3.body.message).toBe("Validation Failed")
    })
  })

  describe('GET /v1/tenants/:tenantId/groups/:groupId', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const groupId = '123e4567-e89b-12d3-a456-426614174001'

    it('should get a group successfully', async () => {
      const mockGroup = {
        id: groupId,
        name: 'Test Group',
        description: 'Test Group Description',
        tenant: { id: tenantId },
        users: [],
        sharedServiceRoles: [],
        createdBy: 'test-user',
        updatedBy: 'test-user',
        createdDateTime: new Date(),
        updatedDateTime: new Date()
      }

      mockTMRepository.getGroup.mockResolvedValue(mockGroup as any)

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/groups/${groupId}`)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          group: {
            id: groupId,
            name: mockGroup.name,
            description: mockGroup.description,
            tenant: { id: tenantId }
          }
        }
      })

      expect(mockTMRepository.getGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { tenantId, groupId }
        })
      )
    })

    it('should get a group with expanded users successfully', async () => {
      const mockGroupWithUsers = {
        id: groupId,
        name: 'Test Group',
        description: 'Test Group Description',
        tenant: { id: tenantId },
        users: [{
          id: '123e4567-e89b-12d3-a456-426614174002',
          isDeleted: false,
          createdDateTime: new Date(),
          updatedDateTime: new Date(),
          createdBy: 'test-user',
          updatedBy: 'test-user',
          user: {
            id: '123e4567-e89b-12d3-a456-426614174003',
            ssoUser: {
              id: '123e4567-e89b-12d3-a456-426614174004',
              firstName: 'John',
              lastName: 'Doe',
              displayName: 'John Doe',
              ssoUserId: 'F45AFBBD68C51D6F956BA3A1DE1878A1',
              email: 'john.doe@gov.bc.ca',
              userName: 'johndoe'
            },
            createdDateTime: new Date(),
            updatedDateTime: new Date(),
            createdBy: 'system',
            updatedBy: 'system'
          }
        }],
        sharedServiceRoles: [],
        createdBy: 'test-user',
        updatedBy: 'test-user'
      }

      mockTMRepository.getGroup.mockResolvedValue(mockGroupWithUsers as any)

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/groups/${groupId}`)
        .query({ expand: 'groupUsers' })

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          group: {
            id: groupId,
            name: mockGroupWithUsers.name,
            users: [
              {
                id: '123e4567-e89b-12d3-a456-426614174002',
                isDeleted: false,
                createdBy: 'test-user',
                updatedBy: 'test-user',
                user: {
                  id: '123e4567-e89b-12d3-a456-426614174003',
                  ssoUser: {
                    id: '123e4567-e89b-12d3-a456-426614174004',
                    firstName: 'John',
                    lastName: 'Doe',
                    displayName: 'John Doe',
                    ssoUserId: 'F45AFBBD68C51D6F956BA3A1DE1878A1',
                    email: 'john.doe@gov.bc.ca',
                    userName: 'johndoe'
                  },
                  createdBy: 'system',
                  updatedBy: 'system'
                }
              }
            ]
          }
        }
      })

      expect(mockTMRepository.getGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { tenantId, groupId },
          query: { expand: 'groupUsers' }
        })
      )
    })

    it('should fail when group does not exist', async () => {
      const errorMessage = `Group not found: ${groupId}`
      mockTMRepository.getGroup.mockRejectedValue(new NotFoundError(errorMessage))

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/groups/${groupId}`)

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: errorMessage,
        name: 'Error occurred getting a group'
      })
    })

    it('should return 500 when database error occurs', async () => {
      const errorMessage = 'Database connection failed'
      mockTMRepository.getGroup.mockRejectedValue(new Error(errorMessage))

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/groups/${groupId}`)

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: errorMessage,
        name: 'Error occurred getting a group'
      })
    })

    it('should return 400 when validation fails', async () => {
      const invalidTenantId = 'invalid-uuid'
      const invalidGroupId = 'invalid-uuid'
      const invalidExpand = 'invalid-expand'

      const response1 = await request(app)
        .get(`/v1/tenants/${invalidTenantId}/groups/${groupId}`)

      expect(response1.status).toBe(400)
      expect(response1.body.message).toBe("Validation Failed")

      const response2 = await request(app)
        .get(`/v1/tenants/${tenantId}/groups/${invalidGroupId}`)

      expect(response2.status).toBe(400)
      expect(response2.body.message).toBe("Validation Failed")

      const response3 = await request(app)
        .get(`/v1/tenants/${tenantId}/groups/${groupId}`)
        .query({ expand: invalidExpand })

      expect(response3.status).toBe(400)
      expect(response3.body.message).toBe("Validation Failed")
    })
  })

  describe('GET /v1/tenants/:tenantId/groups', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'

    it('should get all groups for a tenant successfully', async () => {
      const mockGroups = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Admin Group',
          description: 'Administrators group',
          tenant: { id: tenantId },
          users: [],
          sharedServiceRoles: [],
          createdBy: 'test-user',
          updatedBy: 'test-user',
          createdDateTime: new Date(),
          updatedDateTime: new Date()
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          name: 'User Group',
          description: 'Regular users group',
          tenant: { id: tenantId },
          users: [],
          sharedServiceRoles: [],
          createdBy: 'test-user',
          updatedBy: 'test-user',
          createdDateTime: new Date(),
          updatedDateTime: new Date()
        }
      ]

      mockTMRepository.getTenantGroups.mockResolvedValue(mockGroups as any)

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/groups`)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          groups: [
            {
              id: '123e4567-e89b-12d3-a456-426614174001',
              name: 'Admin Group',
              description: 'Administrators group',
              tenant: { id: tenantId }
            },
            {
              id: '123e4567-e89b-12d3-a456-426614174002',
              name: 'User Group',
              description: 'Regular users group',
              tenant: { id: tenantId }
            }
          ]
        }
      })

      expect(mockTMRepository.getTenantGroups).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { tenantId }
        })
      )
    })

    it('should return empty array when tenant has no groups', async () => {
      const mockEmptyGroups: any[] = []

      mockTMRepository.getTenantGroups.mockResolvedValue(mockEmptyGroups)

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/groups`)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          groups: []
        }
      })
    })

    it('should return groups sorted alphabetically by name', async () => {
      const mockGroups = [
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          name: 'User Group',
          description: 'Regular users group',
          tenant: { id: tenantId },
          users: [],
          sharedServiceRoles: [],
          createdBy: 'test-user',
          updatedBy: 'test-user'
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Admin Group',
          description: 'Administrators group',
          tenant: { id: tenantId },
          users: [],
          sharedServiceRoles: [],
          createdBy: 'test-user',
          updatedBy: 'test-user'
        }
      ]

      mockTMRepository.getTenantGroups.mockResolvedValue(mockGroups as any)

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/groups`)

      expect(response.status).toBe(200)
      expect(response.body.data.groups).toHaveLength(2)
      expect(response.body.data.groups[0].name).toBe('User Group')
      expect(response.body.data.groups[1].name).toBe('Admin Group')
    })

    it('should fail when tenant does not exist', async () => {
      const errorMessage = `Tenant not found: ${tenantId}`
      mockTMRepository.getTenantGroups.mockRejectedValue(new NotFoundError(errorMessage))

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/groups`)

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: errorMessage,
        name: 'Error occurred getting tenant groups'
      })
    })

    it('should return 500 when database error occurs', async () => {
      const errorMessage = 'Database connection failed'
      mockTMRepository.getTenantGroups.mockRejectedValue(new Error(errorMessage))

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/groups`)

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: errorMessage,
        name: 'Error occurred getting tenant groups'
      })
    })

    it('should return 400 when validation fails', async () => {
      const invalidTenantId = 'invalid-uuid'

      const response = await request(app)
        .get(`/v1/tenants/${invalidTenantId}/groups`)

      expect(response.status).toBe(400)
      expect(response.body.message).toBe("Validation Failed")
    })
  })

  describe('GET /v1/tenants/:tenantId/groups/:groupId/shared-services/shared-service-roles', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const groupId = '123e4567-e89b-12d3-a456-426614174001'

    it('should get shared service roles for a group successfully', async () => {
      const mockSharedServices = [
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          name: 'Test Service 1',
          clientIdentifier: 'test-service-1',
          description: 'Test Service 1 Description',
          isActive: true,
          roles: [
            {
              id: '123e4567-e89b-12d3-a456-426614174003',
              name: 'Admin Role',
              description: 'Administrator role',
              enabled: true
            },
            {
              id: '123e4567-e89b-12d3-a456-426614174004',
              name: 'User Role',
              description: 'User role',
              enabled: false
            }
          ]
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174005',
          name: 'Test Service 2',
          clientIdentifier: 'test-service-2',
          description: 'Test Service 2 Description',
          isActive: true,
          roles: [
            {
              id: '123e4567-e89b-12d3-a456-426614174006',
              name: 'Viewer Role',
              description: 'Viewer role',
              enabled: true
            }
          ]
        }
      ]

      mockTMRepository.getSharedServiceRolesForGroup.mockResolvedValue(mockSharedServices as any)

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/groups/${groupId}/shared-services/shared-service-roles`)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          sharedServices: [
            {
              id: '123e4567-e89b-12d3-a456-426614174002',
              name: 'Test Service 1',
              clientIdentifier: 'test-service-1',
              description: 'Test Service 1 Description',
              isActive: true,
              roles: [
                {
                  id: '123e4567-e89b-12d3-a456-426614174003',
                  name: 'Admin Role',
                  description: 'Administrator role',
                  enabled: true
                },
                {
                  id: '123e4567-e89b-12d3-a456-426614174004',
                  name: 'User Role',
                  description: 'User role',
                  enabled: false
                }
              ]
            },
            {
              id: '123e4567-e89b-12d3-a456-426614174005',
              name: 'Test Service 2',
              clientIdentifier: 'test-service-2',
              description: 'Test Service 2 Description',
              isActive: true,
              roles: [
                {
                  id: '123e4567-e89b-12d3-a456-426614174006',
                  name: 'Viewer Role',
                  description: 'Viewer role',
                  enabled: true
                }
              ]
            }
          ]
        }
      })

      expect(mockTMRepository.getSharedServiceRolesForGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { tenantId, groupId }
        })
      )
    })

    it('should return empty array when group has no shared service roles', async () => {
      const mockEmptySharedServices: any[] = []

      mockTMRepository.getSharedServiceRolesForGroup.mockResolvedValue(mockEmptySharedServices)

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/groups/${groupId}/shared-services/shared-service-roles`)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          sharedServices: []
        }
      })
    })

    it('should return shared services sorted alphabetically by name', async () => {
      const mockSharedServices = [
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          name: 'Alpha Service',
          clientIdentifier: 'alpha-service',
          description: 'Alpha Service Description',
          isActive: true,
          roles: []
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174005',
          name: 'Zebra Service',
          clientIdentifier: 'zebra-service',
          description: 'Zebra Service Description',
          isActive: true,
          roles: []
        }
      ]

      mockTMRepository.getSharedServiceRolesForGroup.mockResolvedValue(mockSharedServices as any)

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/groups/${groupId}/shared-services/shared-service-roles`)

      expect(response.status).toBe(200)
      expect(response.body.data.sharedServices).toHaveLength(2)
      expect(response.body.data.sharedServices[0].name).toBe('Alpha Service')
      expect(response.body.data.sharedServices[1].name).toBe('Zebra Service')
    })

    it('should fail when group does not exist', async () => {
      const errorMessage = `Group not found: ${groupId}`
      mockTMRepository.getSharedServiceRolesForGroup.mockRejectedValue(new NotFoundError(errorMessage))

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/groups/${groupId}/shared-services/shared-service-roles`)

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: errorMessage,
        name: 'Error occurred getting shared service roles for group'
      })
    })

    it('should return 500 when database error occurs', async () => {
      const errorMessage = 'Database connection failed'
      mockTMRepository.getSharedServiceRolesForGroup.mockRejectedValue(new Error(errorMessage))

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/groups/${groupId}/shared-services/shared-service-roles`)

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: errorMessage,
        name: 'Error occurred getting shared service roles for group'
      })
    })

    it('should return 400 when validation fails', async () => {
      const invalidTenantId = 'invalid-uuid'
      const invalidGroupId = 'invalid-uuid'

      const response1 = await request(app)
        .get(`/v1/tenants/${invalidTenantId}/groups/${groupId}/shared-services/shared-service-roles`)

      expect(response1.status).toBe(400)
      expect(response1.body.message).toBe("Validation Failed")

      const response2 = await request(app)
        .get(`/v1/tenants/${tenantId}/groups/${invalidGroupId}/shared-services/shared-service-roles`)

      expect(response2.status).toBe(400)
      expect(response2.body.message).toBe("Validation Failed")
    })
  })

  describe('PUT /v1/tenants/:tenantId/groups/:groupId/shared-services/shared-service-roles', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const groupId = '123e4567-e89b-12d3-a456-426614174001'

    it('should update shared service roles for a group successfully', async () => {
      const updateData = {
        sharedServices: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            sharedServiceRoles: [
              {
                id: '123e4567-e89b-12d3-a456-426614174003',
                enabled: true
              },
              {
                id: '123e4567-e89b-12d3-a456-426614174004',
                enabled: false
              }
            ]
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174005',
            sharedServiceRoles: [
              {
                id: '123e4567-e89b-12d3-a456-426614174006',
                enabled: true
              }
            ]
          }
        ]
      }

      const mockUpdatedSharedServices = [
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          name: 'Test Service 1',
          clientIdentifier: 'test-service-1',
          description: 'Test Service 1 Description',
          isActive: true,
          roles: [
            {
              id: '123e4567-e89b-12d3-a456-426614174003',
              name: 'Admin Role',
              description: 'Administrator role',
              enabled: true
            },
            {
              id: '123e4567-e89b-12d3-a456-426614174004',
              name: 'User Role',
              description: 'User role',
              enabled: false
            }
          ]
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174005',
          name: 'Test Service 2',
          clientIdentifier: 'test-service-2',
          description: 'Test Service 2 Description',
          isActive: true,
          roles: [
            {
              id: '123e4567-e89b-12d3-a456-426614174006',
              name: 'Viewer Role',
              description: 'Viewer role',
              enabled: true
            }
          ]
        }
      ]

      mockTMRepository.updateSharedServiceRolesForGroup.mockResolvedValue(mockUpdatedSharedServices as any)

      const response = await request(app)
        .put(`/v1/tenants/${tenantId}/groups/${groupId}/shared-services/shared-service-roles`)
        .send(updateData)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          sharedServices: [
            {
              id: '123e4567-e89b-12d3-a456-426614174002',
              name: 'Test Service 1',
              roles: [
                {
                  id: '123e4567-e89b-12d3-a456-426614174003',
                  name: 'Admin Role',
                  enabled: true
                },
                {
                  id: '123e4567-e89b-12d3-a456-426614174004',
                  name: 'User Role',
                  enabled: false
                }
              ]
            },
            {
              id: '123e4567-e89b-12d3-a456-426614174005',
              name: 'Test Service 2',
              roles: [
                {
                  id: '123e4567-e89b-12d3-a456-426614174006',
                  name: 'Viewer Role',
                  enabled: true
                }
              ]
            }
          ]
        }
      })

      expect(mockTMRepository.updateSharedServiceRolesForGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { tenantId, groupId },
          body: updateData
        })
      )
    })

    it('should update single shared service role successfully', async () => {
      const updateData = {
        sharedServices: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            sharedServiceRoles: [
              {
                id: '123e4567-e89b-12d3-a456-426614174003',
                enabled: false
              }
            ]
          }
        ]
      }

      const mockUpdatedSharedServices = [
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          name: 'Test Service 1',
          clientIdentifier: 'test-service-1',
          description: 'Test Service 1 Description',
          isActive: true,
          roles: [
            {
              id: '123e4567-e89b-12d3-a456-426614174003',
              name: 'Admin Role',
              description: 'Administrator role',
              enabled: false
            }
          ]
        }
      ]

      mockTMRepository.updateSharedServiceRolesForGroup.mockResolvedValue(mockUpdatedSharedServices as any)

      const response = await request(app)
        .put(`/v1/tenants/${tenantId}/groups/${groupId}/shared-services/shared-service-roles`)
        .send(updateData)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          sharedServices: [
            {
              id: '123e4567-e89b-12d3-a456-426614174002',
              roles: [
                {
                  id: '123e4567-e89b-12d3-a456-426614174003',
                  enabled: false
                }
              ]
            }
          ]
        }
      })
    })

    it('should fail when group does not exist', async () => {
      const updateData = {
        sharedServices: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            sharedServiceRoles: [
              {
                id: '123e4567-e89b-12d3-a456-426614174003',
                enabled: true
              }
            ]
          }
        ]
      }

      const errorMessage = `Group not found: ${groupId}`
      mockTMRepository.updateSharedServiceRolesForGroup.mockRejectedValue(new NotFoundError(errorMessage))

      const response = await request(app)
        .put(`/v1/tenants/${tenantId}/groups/${groupId}/shared-services/shared-service-roles`)
        .send(updateData)

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: errorMessage,
        name: 'Error occurred updating shared service roles for group'
      })
    })

    it('should fail when shared service does not exist', async () => {
      const updateData = {
        sharedServices: [
          {
            id: '123e4567-e89b-12d3-a456-426614174999',
            sharedServiceRoles: [
              {
                id: '123e4567-e89b-12d3-a456-426614174003',
                enabled: true
              }
            ]
          }
        ]
      }

      const errorMessage = `Shared service not found: 123e4567-e89b-12d3-a456-426614174999`
      mockTMRepository.updateSharedServiceRolesForGroup.mockRejectedValue(new NotFoundError(errorMessage))

      const response = await request(app)
        .put(`/v1/tenants/${tenantId}/groups/${groupId}/shared-services/shared-service-roles`)
        .send(updateData)

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: errorMessage,
        name: 'Error occurred updating shared service roles for group'
      })
    })

    it('should fail when shared service role does not exist', async () => {
      const updateData = {
        sharedServices: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            sharedServiceRoles: [
              {
                id: '123e4567-e89b-12d3-a456-426614174999',
                enabled: true
              }
            ]
          }
        ]
      }

      const errorMessage = `Shared service role not found: 123e4567-e89b-12d3-a456-426614174999`
      mockTMRepository.updateSharedServiceRolesForGroup.mockRejectedValue(new NotFoundError(errorMessage))

      const response = await request(app)
        .put(`/v1/tenants/${tenantId}/groups/${groupId}/shared-services/shared-service-roles`)
        .send(updateData)

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: errorMessage,
        name: 'Error occurred updating shared service roles for group'
      })
    })

    it('should return 500 when database error occurs', async () => {
      const updateData = {
        sharedServices: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            sharedServiceRoles: [
              {
                id: '123e4567-e89b-12d3-a456-426614174003',
                enabled: true
              }
            ]
          }
        ]
      }

      const errorMessage = 'Database connection failed'
      mockTMRepository.updateSharedServiceRolesForGroup.mockRejectedValue(new Error(errorMessage))

      const response = await request(app)
        .put(`/v1/tenants/${tenantId}/groups/${groupId}/shared-services/shared-service-roles`)
        .send(updateData)

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: errorMessage,
        name: 'Error occurred updating shared service roles for group'
      })
    })

    it('should return 400 when validation fails', async () => {
      const invalidTenantId = 'invalid-uuid'
      const invalidGroupId = 'invalid-uuid'
      const invalidUpdateData = {
        sharedServices: [
          {
            id: 'invalid-uuid',
            sharedServiceRoles: [
              {
                id: 'invalid-uuid',
                enabled: 'not-boolean'
              }
            ]
          }
        ]
      }

      const response1 = await request(app)
        .put(`/v1/tenants/${invalidTenantId}/groups/${groupId}/shared-services/shared-service-roles`)
        .send({ sharedServices: [] })

      expect(response1.status).toBe(400)
      expect(response1.body.message).toBe("Validation Failed")

      const response2 = await request(app)
        .put(`/v1/tenants/${tenantId}/groups/${invalidGroupId}/shared-services/shared-service-roles`)
        .send({ sharedServices: [] })

      expect(response2.status).toBe(400)
      expect(response2.body.message).toBe("Validation Failed")

      const response3 = await request(app)
        .put(`/v1/tenants/${tenantId}/groups/${groupId}/shared-services/shared-service-roles`)
        .send(invalidUpdateData)

      expect(response3.status).toBe(400)
      expect(response3.body.message).toBe("Validation Failed")
    })
  })

  describe('GET /v1/tenants/:tenantId/users/:ssoUserId/groups/shared-service-roles', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const ssoUserId = 'F45AFBBD68C51D6F956BA3A1DE1878A2'

    it('should return user groups with shared service roles successfully', async () => {
      const mockUserGroups = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Admin Group',
          description: 'Administrator group',
          sharedServiceRoles: [
            {
              id: '123e4567-e89b-12d3-a456-426614174002',
              enabled: true,
              sharedService: {
                id: '123e4567-e89b-12d3-a456-426614174003',
                name: 'Test Service 1',
                clientIdentifier: 'test-service-1',
                description: 'Test Service 1 Description',
                isActive: true
              },
              sharedServiceRole: {
                id: '123e4567-e89b-12d3-a456-426614174004',
                name: 'Admin Role',
                description: 'Administrator role'
              }
            },
            {
              id: '123e4567-e89b-12d3-a456-426614174005',
              enabled: false,
              sharedService: {
                id: '123e4567-e89b-12d3-a456-426614174006',
                name: 'Test Service 2',
                clientIdentifier: 'test-service-2',
                description: 'Test Service 2 Description',
                isActive: true
              },
              sharedServiceRole: {
                id: '123e4567-e89b-12d3-a456-426614174007',
                name: 'User Role',
                description: 'User role'
              }
            }
          ]
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174008',
          name: 'User Group',
          description: 'Regular user group',
          sharedServiceRoles: [
            {
              id: '123e4567-e89b-12d3-a456-426614174009',
              enabled: true,
              sharedService: {
                id: '123e4567-e89b-12d3-a456-426614174003',
                name: 'Test Service 1',
                clientIdentifier: 'test-service-1',
                description: 'Test Service 1 Description',
                isActive: true
              },
              sharedServiceRole: {
                id: '123e4567-e89b-12d3-a456-426614174010',
                name: 'Viewer Role',
                description: 'Viewer role'
              }
            }
          ]
        }
      ]

      mockTMRepository.getUserGroupsWithSharedServiceRoles.mockResolvedValue(mockUserGroups as any)

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/users/${ssoUserId}/groups/shared-service-roles`)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Admin Group',
            description: 'Administrator group',
            sharedServiceRoles: [
              {
                id: '123e4567-e89b-12d3-a456-426614174002',
                enabled: true,
                sharedService: {
                  id: '123e4567-e89b-12d3-a456-426614174003',
                  name: 'Test Service 1',
                  clientIdentifier: 'test-service-1',
                  isActive: true
                },
                sharedServiceRole: {
                  id: '123e4567-e89b-12d3-a456-426614174004',
                  name: 'Admin Role'
                }
              },
              {
                id: '123e4567-e89b-12d3-a456-426614174005',
                enabled: false,
                sharedService: {
                  id: '123e4567-e89b-12d3-a456-426614174006',
                  name: 'Test Service 2',
                  clientIdentifier: 'test-service-2',
                  isActive: true
                },
                sharedServiceRole: {
                  id: '123e4567-e89b-12d3-a456-426614174007',
                  name: 'User Role'
                }
              }
            ]
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174008',
            name: 'User Group',
            description: 'Regular user group',
            sharedServiceRoles: [
              {
                id: '123e4567-e89b-12d3-a456-426614174009',
                enabled: true,
                sharedService: {
                  id: '123e4567-e89b-12d3-a456-426614174003',
                  name: 'Test Service 1',
                  clientIdentifier: 'test-service-1',
                  isActive: true
                },
                sharedServiceRole: {
                  id: '123e4567-e89b-12d3-a456-426614174010',
                  name: 'Viewer Role'
                }
              }
            ]
          }
        ]
      })

      expect(mockTMRepository.getUserGroupsWithSharedServiceRoles).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { tenantId, ssoUserId }
        }),
        'test-service-client'
      )
    })

    it('should return empty array when user has no groups', async () => {
      mockTMRepository.getUserGroupsWithSharedServiceRoles.mockResolvedValue([] as any)

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/users/${ssoUserId}/groups/shared-service-roles`)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: []
      })
    })

    it('should return groups with no shared service roles', async () => {
      const mockUserGroups = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Admin Group',
          description: 'Administrator group',
          sharedServiceRoles: []
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174008',
          name: 'User Group',
          description: 'Regular user group',
          sharedServiceRoles: []
        }
      ]

      mockTMRepository.getUserGroupsWithSharedServiceRoles.mockResolvedValue(mockUserGroups as any)

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/users/${ssoUserId}/groups/shared-service-roles`)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Admin Group',
            sharedServiceRoles: []
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174008',
            name: 'User Group',
            sharedServiceRoles: []
          }
        ]
      })
    })

    it('should return groups sorted alphabetically by name', async () => {
      const mockUserGroups = [
        {
          id: '123e4567-e89b-12d3-a456-426614174008',
          name: 'User Group',
          description: 'Regular user group',
          sharedServiceRoles: []
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Admin Group',
          description: 'Administrator group',
          sharedServiceRoles: []
        }
      ]

      mockTMRepository.getUserGroupsWithSharedServiceRoles.mockResolvedValue(mockUserGroups as any)

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/users/${ssoUserId}/groups/shared-service-roles`)

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(2)
      expect(response.body.data[0].name).toBe('User Group')
      expect(response.body.data[1].name).toBe('Admin Group')
    })

    it('should fail when tenant does not exist', async () => {
      const errorMessage = `Tenant not found: ${tenantId}`
      mockTMRepository.getUserGroupsWithSharedServiceRoles.mockRejectedValue(new NotFoundError(errorMessage))

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/users/${ssoUserId}/groups/shared-service-roles`)

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: errorMessage,
        name: 'Error occurred getting user groups with shared services'
      })
    })

    it('should fail when user does not exist in tenant', async () => {
      const errorMessage = `User not found in tenant: ${ssoUserId}`
      mockTMRepository.getUserGroupsWithSharedServiceRoles.mockRejectedValue(new NotFoundError(errorMessage))

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/users/${ssoUserId}/groups/shared-service-roles`)

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: errorMessage,
        name: 'Error occurred getting user groups with shared services'
      })
    })

    it('should return 500 when database error occurs', async () => {
      const errorMessage = 'Database connection failed'
      mockTMRepository.getUserGroupsWithSharedServiceRoles.mockRejectedValue(new Error(errorMessage))

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/users/${ssoUserId}/groups/shared-service-roles`)

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: errorMessage,
        name: 'Error occurred getting user groups with shared services'
      })
    })

    it('should return 400 when validation fails', async () => {
      const invalidTenantId = 'invalid-uuid'

      const response = await request(app)
        .get(`/v1/tenants/${invalidTenantId}/users/${ssoUserId}/groups/shared-service-roles`)

      expect(response.status).toBe(400)
      expect(response.body.message).toBe("Validation Failed")
    })
  })

  describe('GET /v1/tenants/:tenantId/ssousers/:ssoUserId/shared-service-roles', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const ssoUserId = 'F45AFBBD68C51D6F956BA3A1DE1878A2'

    it('should return effective shared service roles successfully', async () => {
      const mockSharedServiceRoles = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'ADMIN',
          description: 'Administrator role',
          allowedIdentityProviders: ['idir', 'bceidbusiness'],
          groups: [
            { id: '123e4567-e89b-12d3-a456-426614174002', name: 'IT Administrators' },
            { id: '123e4567-e89b-12d3-a456-426614174003', name: 'System Admins' }
          ]
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174004',
          name: 'VIEWER',
          description: 'Viewer role',
          allowedIdentityProviders: null,
          groups: [
            { id: '123e4567-e89b-12d3-a456-426614174005', name: 'All Users' }
          ]
        }
      ]

      mockTMRepository.getEffectiveSharedServiceRoles.mockResolvedValue(mockSharedServiceRoles as any)

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/ssousers/${ssoUserId}/shared-service-roles`)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          sharedServiceRoles: [
            {
              id: '123e4567-e89b-12d3-a456-426614174001',
              name: 'ADMIN',
              description: 'Administrator role',
              allowedIdentityProviders: ['idir', 'bceidbusiness'],
              groups: [
                { id: '123e4567-e89b-12d3-a456-426614174002', name: 'IT Administrators' },
                { id: '123e4567-e89b-12d3-a456-426614174003', name: 'System Admins' }
              ]
            },
            {
              id: '123e4567-e89b-12d3-a456-426614174004',
              name: 'VIEWER',
              description: 'Viewer role',
              allowedIdentityProviders: null,
              groups: [
                { id: '123e4567-e89b-12d3-a456-426614174005', name: 'All Users' }
              ]
            }
          ]
        }
      })

      expect(mockTMRepository.getEffectiveSharedServiceRoles).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { tenantId, ssoUserId }
        }),
        'test-service-client'
      )
    })

    it('should return empty array when user has no shared service roles', async () => {
      mockTMRepository.getEffectiveSharedServiceRoles.mockResolvedValue([] as any)

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/ssousers/${ssoUserId}/shared-service-roles`)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: {
          sharedServiceRoles: []
        }
      })
    })

    it('should deduplicate roles from multiple groups', async () => {
      const mockSharedServiceRoles = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'ADMIN',
          description: 'Administrator role',
          allowedIdentityProviders: ['idir'],
          groups: [
            { id: '123e4567-e89b-12d3-a456-426614174002', name: 'IT Administrators' },
            { id: '123e4567-e89b-12d3-a456-426614174003', name: 'System Admins' },
            { id: '123e4567-e89b-12d3-a456-426614174004', name: 'Power Users' }
          ]
        }
      ]

      mockTMRepository.getEffectiveSharedServiceRoles.mockResolvedValue(mockSharedServiceRoles as any)

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/ssousers/${ssoUserId}/shared-service-roles`)

      expect(response.status).toBe(200)
      expect(response.body.data.sharedServiceRoles).toHaveLength(1)
      expect(response.body.data.sharedServiceRoles[0].groups).toHaveLength(3)
      expect(response.body.data.sharedServiceRoles[0].name).toBe('ADMIN')
    })

    it('should return 404 when tenant user is not found', async () => {
      const errorMessage = `Tenant user not found: ${ssoUserId}`
      mockTMRepository.getEffectiveSharedServiceRoles.mockRejectedValue(new NotFoundError(errorMessage))

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/ssousers/${ssoUserId}/shared-service-roles`)

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        errorMessage: 'Not Found',
        httpResponseCode: 404,
        message: errorMessage,
        name: 'Error occurred getting effective shared service roles'
      })
    })

    it('should return 401 when JWT audience is missing', async () => {
      const appWithoutAudience = express()
      appWithoutAudience.use(express.json())
      appWithoutAudience.get('/v1/tenants/:tenantId/ssousers/:ssoUserId/shared-service-roles',
        validate(validator.getEffectiveSharedServiceRoles, {}, {}),
        (req, res, next) => {
          req.decodedJwt = {
            idir_user_guid: 'F45AFBBD68C51D6F956BA3A1DE1878A2'
          }
          req.isSharedServiceAccess = true
          req.idpType = 'idir'
          next()
        },
        (req, res, next) => {
          next()
        },
        (req, res) => tmController.getEffectiveSharedServiceRoles(req, res)
      )
      appWithoutAudience.use((err: any, req: any, res: any, next: any) => {
        if (err.name === 'ValidationError') {
          return res.status(err.statusCode).json(err)
        }
        next(err)
      })

      const response = await request(appWithoutAudience)
        .get(`/v1/tenants/${tenantId}/ssousers/${ssoUserId}/shared-service-roles`)

      expect(response.status).toBe(401)
      expect(response.body).toMatchObject({
        errorMessage: 'Unauthorized',
        httpResponseCode: 401,
        message: 'Missing audience in JWT token',
        name: 'Error occurred getting effective shared service roles'
      })
    })

    it('should return 500 when database error occurs', async () => {
      const errorMessage = 'Database connection failed'
      mockTMRepository.getEffectiveSharedServiceRoles.mockRejectedValue(new Error(errorMessage))

      const response = await request(app)
        .get(`/v1/tenants/${tenantId}/ssousers/${ssoUserId}/shared-service-roles`)

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        errorMessage: 'Internal Server Error',
        httpResponseCode: 500,
        message: errorMessage,
        name: 'Error occurred getting effective shared service roles'
      })
    })

    it('should return 400 when validation fails for invalid tenant ID', async () => {
      const invalidTenantId = 'invalid-uuid'

      const response = await request(app)
        .get(`/v1/tenants/${invalidTenantId}/ssousers/${ssoUserId}/shared-service-roles`)

      expect(response.status).toBe(400)
      expect(response.body.message).toBe("Validation Failed")
    })
  })

}) 