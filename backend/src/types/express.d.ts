declare namespace Express {
  interface DecodedJwt {
    idir_user_guid?: string
    bceid_user_guid?: string
    bceid_business_guid?: string
    aud?: string
    audience?: string
    client_roles?: string[]
    sub?: string
    idp?: string
    identity_provider?: string
    idir_username?: string
    given_name?: string
    family_name?: string
    name?: string
    display_name?: string
    preferred_username?: string
    user_principal_name?: string
    email?: string
    [key: string]: unknown
  }

  interface Request {
    decodedJwt?: DecodedJwt
    isSharedServiceAccess?: boolean
    idpType?: 'idir' | 'bceidbusiness'
  }
}
