import {
  TenantRequest,
  type TenantRequestId,
} from '@/models/tenantrequest.model'

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
   * The ISO8601 date string (YYYY-MM-DD) when the tenant request was created.
   *
   * Note: This is mapped from 'createdDateTime' in the API.
   */
  createdDateTime: string

  /**
   * The description of the tenant request.
   */
  description: string

  /**
   * The unique identifier for the tenant request.
   */
  id: TenantRequestId

  /**
   * The associated ministry or organization name.
   */
  ministryName: string

  /**
   * The display name of the tenant request.
   */
  name: string

  /**
   * The reason that a request with status REJECTED was rejected.
   */
  rejectionReason?: string

  /**
   * The status of the tenant request: APPROVED, NEW, or REJECTED.
   */
  status: string
}

export const tenantRequestMapper = {
  /**
   * Creates a TenantRequest instance from API response data.
   *
   * @param apiData - The raw tenant request data from the API.
   * @returns A new TenantRequest instance.
   */
  fromApiData: (apiData: TenantRequestApiData): TenantRequest => {
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
  },
}
