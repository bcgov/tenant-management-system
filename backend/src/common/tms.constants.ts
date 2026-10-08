export type IdpType = 'idir' | 'bceidbusiness'

export class TMSConstants {
  public static SERVICE_USER = 'TMS.SERVICE_USER'
  public static TENANT_OWNER = 'TMS.TENANT_OWNER'
  public static USER_ADMIN = 'TMS.USER_ADMIN'
  public static IDIR_PROVIDER: IdpType = 'idir'
  public static AZURE_IDIR_PROVIDER = 'azureidir'
  public static BUSINESS_BCEID_PROVIDER: IdpType = 'bceidbusiness'
  public static BCEID_BOTH_PROVIDER = 'bceidboth'
  public static IDP_TYPES: IdpType[] = [
    TMSConstants.IDIR_PROVIDER,
    TMSConstants.BUSINESS_BCEID_PROVIDER,
  ]
  public static TENANT_REQUEST_INVALID_STATUS = 'TENANT_REQUEST_INVALID_STATUS'
  public static TENANT_NAME_ALREADY_EXISTS = 'TENANT_NAME_ALREADY_EXISTS'
  public static HEADLESS_SERVICE_NOT_ALLOWED =
    'This connected service is not allowed to call CSTAR directly. Ask a CSTAR operations admin to enable it.'
  public static HEADLESS_WEB_APP_ONLY =
    'This operation cannot be performed from a connected service. Log in to the CSTAR web app to do this.'
  public static HEADLESS_IDIR_ONLY =
    'Only IDIR users can manage a tenant from a connected service.'
  public static HEADLESS_TENANT_MEMBER_REQUIRED =
    'You must be a member of this tenant to do this.'
}
