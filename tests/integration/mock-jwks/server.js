import express from 'express'
import { exportJWK, importPKCS8, SignJWT } from 'jose'
import crypto from 'node:crypto'

const app = express()
app.disable('x-powered-by')
app.use(express.json())

// Generate an RSA key pair and export the public key as a JWK for the JWKS
// endpoint.
let privateKey
let publicJwk
async function init() {
  const { privateKey: pk, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
  })

  privateKey = await importPKCS8(
    pk.export({ type: 'pkcs8', format: 'pem' }).toString(),
    'RS256',
  )

  // Export the public key as a JWK and annotate it for the same RS256 signature
  // verification used by Keycloak/SSO.
  publicJwk = {
    ...(await exportJWK(publicKey)),
    alg: 'RS256',
    kid: 'test-key-1',
    use: 'sig',
  }
}

// JWKS endpoint that the API fetches on startup to verify token signatures.
app.get('/certs', (_req, res) => {
  res.json({ keys: [publicJwk] })
})

// Bruno pre-request scripts POST here to get a signed test token. The request
// body is used as the claims (sub, idp, idir_user_guid, etc.)
app.post('/mint', async (req, res) => {
  const claims = req.body ?? {}
  const token = await new SignJWT(claims)
    .setExpirationTime('1h')
    .setIssuedAt()
    .setIssuer(process.env.ISSUER)
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key-1' })
    .sign(privateKey)

  res.json({ token })
})

await init()
app.listen(3001, () => console.log('mock-jwks listening on :3001'))
