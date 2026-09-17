import { generateKeyPairSync } from 'crypto'

process.env.ALLOWED_ORIGINS = 'http://localhost:4144'
process.env.BCGOV_SSO_API_CLIENT_ID = 'test-client-id'
process.env.BCGOV_SSO_API_CLIENT_SECRET = 'test-client-secret'
process.env.BCGOV_SSO_API_URL = 'http://localhost/sso'
process.env.BCGOV_SSO_API_URL_BCEID = 'http://localhost/sso/bceid'
process.env.BCGOV_TOKEN_URL = 'http://localhost/token'
process.env.ISSUER = 'http://localhost/issuer'
process.env.JWKS_URI = 'http://localhost/jwks'
process.env.LOG_LEVEL = 'error'
process.env.PORT = '4144'
process.env.POSTGRES_DATABASE = 'test'
process.env.POSTGRES_HOST = 'localhost'
process.env.POSTGRES_PASSWORD = 'test'
process.env.POSTGRES_PORT = '5432'
process.env.POSTGRES_USER = 'test'
process.env.TMS_AUDIENCE = 'test-audience'

process.env.ASSERTION_ISSUER = 'cstar-test'
process.env.ASSERTION_KEY_ID = 'cstar-test-key'
process.env.ASSERTION_EXPIRES_IN_SECONDS = '300'
const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
})
process.env.ASSERTION_PRIVATE_KEY = privateKey.export({
  format: 'pem',
  type: 'pkcs8',
}) as string
process.env.ASSERTION_PUBLIC_KEY = publicKey.export({
  format: 'pem',
  type: 'spki',
}) as string

import { loadConfig } from '../services/config.service'
loadConfig()
