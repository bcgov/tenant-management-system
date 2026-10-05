import express from 'express'
import request from 'supertest'
import { config } from '../services/config.service'
import { checkPocKey } from './poc-key.mw'
import { registerPocRoutes } from './poc.routes'
import { pocController } from './poc.controller'

jest.mock('./poc.controller')
jest.mock('../common/logger')

const POC_KEY = 'a-long-random-poc-key'

const mockController = pocController as jest.Mocked<typeof pocController>

function createKeyCheckApp() {
  const app = express()
  app.get('/', checkPocKey, (_req, res) => res.status(200).send('ok'))
  return app
}

function createPocApp() {
  const app = express()
  registerPocRoutes(app)
  return app
}

describe('POC routes', () => {
  const originalKey = config.pocApiKey

  afterEach(() => {
    config.pocApiKey = originalKey
    jest.clearAllMocks()
  })

  describe('checkPocKey', () => {
    beforeEach(() => {
      config.pocApiKey = POC_KEY
    })

    it('lets the request through when the key matches', async () => {
      const response = await request(createKeyCheckApp())
        .get('/')
        .set('X-CSTAR-POC-KEY', POC_KEY)

      expect(response.status).toBe(200)
    })

    it('refuses the request when the key is wrong', async () => {
      const response = await request(createKeyCheckApp())
        .get('/')
        .set('X-CSTAR-POC-KEY', 'not-the-right-key-at-all')

      expect(response.status).toBe(401)
    })

    it('refuses the request when the key is a different length', async () => {
      const response = await request(createKeyCheckApp())
        .get('/')
        .set('X-CSTAR-POC-KEY', 'short')

      expect(response.status).toBe(401)
    })

    it('refuses the request when there is no key', async () => {
      const response = await request(createKeyCheckApp()).get('/')

      expect(response.status).toBe(401)
    })

    it('refuses every request when no key is configured', async () => {
      config.pocApiKey = undefined

      const response = await request(createKeyCheckApp())
        .get('/')
        .set('X-CSTAR-POC-KEY', '')

      expect(response.status).toBe(401)
    })
  })

  describe('registerPocRoutes', () => {
    it('adds no routes when no key is configured', async () => {
      config.pocApiKey = undefined

      const response = await request(createPocApp())
        .get('/v1/poc/tenants')
        .query({ userId: 'F45AFBBD68C44D6F956BA3A1D91878AD' })
        .set('X-CSTAR-POC-KEY', POC_KEY)

      expect(response.status).toBe(404)
      expect(mockController.getTenants).not.toHaveBeenCalled()
    })

    it('adds no routes when the key is empty', async () => {
      config.pocApiKey = ''

      const response = await request(createPocApp())
        .get('/v1/poc/tenants')
        .query({ userId: 'F45AFBBD68C44D6F956BA3A1D91878AD' })

      expect(response.status).toBe(404)
      expect(mockController.getTenants).not.toHaveBeenCalled()
    })

    it('adds the routes when a key is configured', async () => {
      config.pocApiKey = POC_KEY
      mockController.getTenants.mockImplementation(async (_req, res) => {
        res.status(200).send({ data: { tenants: [] } })
      })

      const response = await request(createPocApp())
        .get('/v1/poc/tenants')
        .query({ userId: 'F45AFBBD68C44D6F956BA3A1D91878AD' })
        .set('X-CSTAR-POC-KEY', POC_KEY)

      expect(response.status).toBe(200)
      expect(mockController.getTenants).toHaveBeenCalled()
    })

    it('checks the key before looking at the query', async () => {
      config.pocApiKey = POC_KEY

      const response = await request(createPocApp()).get('/v1/poc/roles')

      expect(response.status).toBe(401)
      expect(mockController.getRoles).not.toHaveBeenCalled()
    })
  })
})
