export type IdpType = 'idir' | 'bceidbasic' | 'bceidbusiness'

export class TMSConstants {
  public static SERVICE_USER = 'TMS.SERVICE_USER'
  public static TENANT_OWNER = 'TMS.TENANT_OWNER'
  public static USER_ADMIN = 'TMS.USER_ADMIN'
  public static IDIR_PROVIDER: IdpType = 'idir'
  public static AZURE_IDIR_PROVIDER = 'azureidir'
  public static BASIC_BCEID_PROVIDER: IdpType = 'bceidbasic'
  public static BUSINESS_BCEID_PROVIDER: IdpType = 'bceidbusiness'
  public static BCEID_BOTH_PROVIDER = 'bceidboth'
  public static IDP_TYPES: IdpType[] = [
    TMSConstants.IDIR_PROVIDER,
    TMSConstants.BUSINESS_BCEID_PROVIDER,
  ]
  public static TENANT_REQUEST_INVALID_STATUS = 'TENANT_REQUEST_INVALID_STATUS'
  public static TENANT_NAME_ALREADY_EXISTS = 'TENANT_NAME_ALREADY_EXISTS'
}
