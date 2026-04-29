export type TenantRequestId = string & { readonly __brand: 'TenantRequestId' }

/**
 * The shape of the data that comes from the API.
 */
export type TenantRequestApiData = {
  /**
   * The UUID of who created the tenant request.
   */
  createdBy: string

  /**
   * The username of who created the tenant request, may be undefined.
   */
  createdByUserName?: string

  /**
   * ISO8601 date string (YYYY-MM-DD) when the tenant request was created.
   *
   * Note: This is mapped from 'createdDateTime' in the API.
   */
  createdDateTime: string

  /**
   * Description of the tenant request.
   */
  description: string

  /**
   * Unique identifier for the tenant request.
   */
  id: TenantRequestId

  /**
   * Associated ministry or organization name.
   */
  ministryName: string

  /**
   * Display name of the tenant request.
   */
  name: string

  /**
   * The reason that a request with status REJECTED was rejected.
   */
  rejectionReason?: string

  /**
   * Status of the tenant request: APPROVED, NEW, or REJECTED.
   */
  status: string
}

/**
 * Utility type that represents the subset of Tenant Request properties used in
 * the form that edits these fields.
 */
export type TenantRequestDetailFields = Pick<
  TenantRequest,
  'description' | 'ministryName' | 'name'
>

/**
 * Represents a tenant request in the system.
 */
export class TenantRequest {
  /**
   * The identity of who created the tenant request.
   */
  createdBy: string

  /**
   * ISO8601 date string (YYYY-MM-DD) when the tenant request was created.
   *
   * Note: This is mapped from 'createdDateTime' in the API.
   */
  createdDate: string

  /**
   * Description of the tenant request.
   */
  description: string

  /**
   * Unique identifier for the tenant request.
   */
  id: TenantRequestId

  /**
   * Associated ministry or organization name.
   */
  ministryName: string

  /**
   * Display name of the tenant request.
   */
  name: string

  /**
   * The reason that a request with status REJECTED was rejected.
   */
  rejectionReason: string

  /**
   * Status of the tenant request: APPROVED, NEW, or REJECTED.
   */
  status: string

  /**
   * Creates a new Tenant Request instance.
   *
   * @param createdBy - The identity of who created the tenant request
   * @param createdDate - ISO8601 date string (YYYY-MM-DD) when tenant request
   *   was created
   * @param description - Description of the tenant request
   * @param id - Unique identifier for the tenant request
   * @param name - Display name of the tenant request
   * @param ministryName - Associated ministry or organization name
   * @param status - Status of the tenant request
   *
   * Note: rejectionReason is initialized to an empty string by default.
   */
  constructor(
    createdBy: string,
    createdDate: string,
    description: string,
    id: TenantRequestId,
    name: string,
    ministryName: string,
    status: string,
  ) {
    this.createdBy = createdBy
    this.createdDate = createdDate
    this.description = description
    this.id = id
    this.name = name
    this.ministryName = ministryName
    this.rejectionReason = ''
    this.status = status
  }

  /**
   * Creates a Tenant Request instance from API response data.
   *
   * @param apiData - The raw tenant request data from the API
   * @returns A new Tenant Request instance
   */
  static fromApiData(apiData: TenantRequestApiData): TenantRequest {
    const tenantRequest = new TenantRequest(
      apiData.createdByUserName || apiData.createdBy,
      apiData.createdDateTime,
      apiData.description,
      apiData.id,
      apiData.name,
      apiData.ministryName,
      apiData.status,
    )

    tenantRequest.rejectionReason = apiData.rejectionReason || ''

    return tenantRequest
  }
}
