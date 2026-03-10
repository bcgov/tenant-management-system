import request from 'supertest'
import { DataSource } from 'typeorm'
import * as dotenv from 'dotenv'
const dbConfig = require('../ormconfig')
dotenv.config()

let PostgreSqlContainer: any, testApp: any, App: any, container: any
let dataSource: DataSource

beforeAll(async () => {
  try {
    const containerModule = require('@testcontainers/postgresql')
    PostgreSqlContainer = containerModule.PostgreSqlContainer
  } catch {
    try {
      const containerModule = require('testcontainers')
      PostgreSqlContainer = containerModule.PostgreSqlContainer
    } catch (err) {
      console.error('Could not import PostgreSqlContainer:', err)
      process.exit(1)
    }
  }
  try {
    console.warn('Starting PostgreSQL container...')
    container = await new PostgreSqlContainer()
      .withUsername('testuser')
      .withPassword('testpassword')
      .withDatabase('testdb')
      .withExposedPorts({
        container: 5432,
        host: 54321,
      })
      .start()

    console.warn('Container started...')

    dataSource = new DataSource(dbConfig)
    await dataSource.initialize()
    console.warn('Database connection initialized successfully')

    console.warn('Running migrations...')
    await dataSource.runMigrations()

    App = require('../app').default
    testApp = new App().app
  } catch (error) {
    console.error('Error in beforeAll:', error)
    throw error
  }
}, 60000)

afterAll(async () => {
  try {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy()
      console.warn('Database connection closed')
    }

    if (container) {
      await container.stop({
        removeVolumes: true,
        force: true,
      })
      console.warn('Container stopped')
    }
  } catch (error) {
    console.error('Error in afterAll:', error)
  } finally {
    console.warn('Test completed, cleaning up...')
  }
})

console.warn('Running tests...')

let tenantId: string, roleId: string, tenantUserId: string
const initialSSOUserId: string = 'fd33f1cef7ca4b19a71104d4ecf7066b'
const additionalSSOUserId: string = 'ad43f1cef7ca4b19a71104d4ecf7066d'

describe('Health Check API', () => {
  it('should return 200 OK and healthy status', async () => {
    const response = await request(testApp).get('/v1/health')
    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ apiStatus: 'Healthy' })
  })
})

describe('Create Tenant', () => {
  it('should return basic tenant 201 Created', async () => {
    const response = await request(testApp)
      .post('/v1/tenants')
      .send({
        name: 'Test Tenant',
        ministryName: 'Test Ministry',
        user: {
          firstName: 'John',
          lastName: 'Smith',
          displayName: 'Smith, John: MIN: EX',
          userName: 'SMITHJ1',
          ssoUserId: initialSSOUserId,
          email: 'john.smith@gov.bc.ca',
        },
      })
    expect(response.status).toBe(201)
    expect(response.body.data.tenant).toMatchObject({ name: 'Test Tenant' })
    expect(response.body.data.tenant.users[0].ssoUser).toMatchObject({
      ssoUserId: 'fd33f1cef7ca4b19a71104d4ecf7066b',
    })
    expect(response.body.data.tenant.users[0].roles).toHaveLength(3)
    expect(response.body.data.tenant.users[0].roles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: expect.objectContaining({ name: 'TMS.SERVICE_USER' }),
        }),
        expect.objectContaining({
          role: expect.objectContaining({ name: 'TMS.TENANT_OWNER' }),
        }),
        expect.objectContaining({
          role: expect.objectContaining({ name: 'TMS.TENANT_USER' }),
        }),
      ]),
    )
    tenantId = response.body.data.tenant.id
    tenantUserId = response.body.data.tenant.users[0].id
  })
})

describe('Add user to a tenant', () => {
  it('should return basic user created and added to tenant - 201', async () => {
    const response = await request(testApp)
      .post(`/v1/tenants/${tenantId}/users`)
      .send({
        user: {
          firstName: 'Rocket',
          lastName: 'Raccoon',
          displayName: 'Raccoon, Rocket: MIN: EX',
          userName: 'RACCOOR',
          ssoUserId: additionalSSOUserId,
          email: 'rocket.raccoon@gov.bc.ca',
        },
      })
    expect(response.status).toBe(201)
    expect(response.body.data.user.ssoUser).toMatchObject({
      ssoUserId: additionalSSOUserId,
    })
  })
})

describe('Add a role to a tenant', () => {
  it('should return role created and added to tenant - 201', async () => {
    const response = await request(testApp)
      .post(`/v1/tenants/${tenantId}/roles`)
      .send({
        role: {
          name: 'LOB.CUSTOM_ROLE',
          description: 'Custom role for LOB',
        },
      })
    expect(response.status).toBe(201)
    expect(response.body.data.role).toMatchObject({ name: 'LOB.CUSTOM_ROLE' })
    roleId = response.body.data.role.id
  })
})

describe('Get Tenant', () => {
  it('should return a basic tenant - 200', async () => {
    const response = await request(testApp).get(`/v1/tenants/${tenantId}`)
    expect(response.status).toBe(200)
    expect(response.body.data.tenant).toMatchObject({ id: tenantId })
  })
})

describe('Get Users for a tenant', () => {
  it('should return array of users for the tenant with 200', async () => {
    const response = await request(testApp).get(`/v1/tenants/${tenantId}/users`)
    expect(response.status).toBe(200)
    expect(response.body.data.users).toBeDefined()
    expect(response.body.data.users).toHaveLength(2)
    expect(response.body.data.users).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ssoUser: expect.objectContaining({ ssoUserId: initialSSOUserId }),
        }),
        expect.objectContaining({
          ssoUser: expect.objectContaining({ ssoUserId: additionalSSOUserId }),
        }),
      ]),
    )
  })
})

describe('Get Tenants for SSO User', () => {
  it('should return array of tenants for a sso user id with 200', async () => {
    const response = await request(testApp).get(
      `/v1/users/${initialSSOUserId}/tenants`,
    )
    expect(response.status).toBe(200)
    expect(response.body.data.tenants[0]).toMatchObject({ id: tenantId })
  })
})

describe('Assign a user to a role in a tenant', () => {
  it('should return the user with the associated role with 201', async () => {
    const response = await request(testApp).put(
      `/v1/tenants/${tenantId}/users/${tenantUserId}/roles/${roleId}`,
    )
    expect(response.status).toBe(201)
    expect(response.body.data.user).toMatchObject({ id: tenantUserId })
    expect(response.body.data.user.ssoUser).toMatchObject({
      ssoUserId: initialSSOUserId,
    })
    expect(response.body.data.role).toMatchObject({ id: roleId })
  })
})

describe('Get roles for a user in a tenant', () => {
  it('should return an an array of roles for the user with 200', async () => {
    const response = await request(testApp).get(
      `/v1/tenants/${tenantId}/users/${tenantUserId}/roles`,
    )
    expect(response.status).toBe(200)
    expect(response.body.data.roles).toBeDefined()
    expect(response.body.data.roles).toHaveLength(3)
    expect(response.body.data.roles).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: roleId })]),
    )
  })
})

describe('Get Roles for a SSO User in a tenant', () => {
  it('should return array of roles for the SSO User in the tenant with 200', async () => {
    const response = await request(testApp).get(
      `/v1/tenants/${tenantId}/ssousers/${initialSSOUserId}/roles`,
    )
    expect(response.status).toBe(200)
    expect(response.body.data.roles).toBeDefined()
    expect(response.body.data.roles).toHaveLength(3)
    expect(response.body.data.roles).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: roleId })]),
    )
  })
})

describe('Unssign a user from a role in a tenant', () => {
  it('should return an empty response with 204 indicating delete successful', async () => {
    const response = await request(testApp).delete(
      `/v1/tenants/${tenantId}/users/${tenantUserId}/roles/${roleId}`,
    )
    expect(response.status).toBe(204)
  })
})

describe('Get Roles for a tenant', () => {
  it('should return array of roles for the tenant with 200', async () => {
    const response = await request(testApp).get(`/v1/tenants/${tenantId}/roles`)
    expect(response.status).toBe(200)
    expect(response.body.data.roles).toBeDefined()
    expect(response.body.data.roles).toHaveLength(3)
    expect(response.body.data.roles).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: roleId })]),
    )
  })
})

describe('Get expanded Tenant details', () => {
  it('should return expanded tenant with all the details with 200', async () => {
    const response = await request(testApp).get(
      `/v1/tenants/${tenantId}?expand=roles,tenantUserRoles`,
    )
    expect(response.status).toBe(200)
    expect(response.body.data.tenant).toMatchObject({ id: tenantId })
    expect(response.body.data.tenant.users).toBeDefined()
    expect(response.body.data.tenant.users).toHaveLength(2)
    expect(response.body.data.tenant.roles).toBeDefined()
    expect(response.body.data.tenant.roles).toHaveLength(3)

    expect(response.body.data.tenant.roles).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: roleId })]),
    )
    expect(response.body.data.tenant.users).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: tenantUserId })]),
    )
    expect(response.body.data.tenant.users).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ssoUser: expect.objectContaining({ ssoUserId: initialSSOUserId }),
        }),
      ]),
    )

    expect(response.body.data.tenant.users).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ssoUser: expect.objectContaining({ ssoUserId: additionalSSOUserId }),
        }),
      ]),
    )
  })
})
