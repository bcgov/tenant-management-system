export type TenantRequestId = string & { readonly __brand: 'TenantRequestId' }
export const toTenantRequestId = (id: string): TenantRequestId =>
  id as TenantRequestId

/**
 * Utility type that represents the subset of Tenant Request properties used in
 * the form that edits these fields.
 */
export type TenantRequestDetailFields = Pick<
  TenantRequest,
  'description' | 'ministryName' | 'name'
>

/**
 * Configuration options required to instantiate a TenantRequest.
 */
export type TenantRequestConfig = {
  createdBy: string
  createdDate: string
  description: string
  id: TenantRequestId
  ministryName: string
  name: string
  rejectionReason?: string
  status: string
}

/**
 * Represents a tenant request in the system.
 */
export class TenantRequest {
  /**
   * The identity of who created the tenant request.
   */
  createdBy: string

  /**
   * The ISO8601 date string (YYYY-MM-DD) when the tenant request was created.
   *
   * Note: This is mapped from 'createdDateTime' in the API.
   */
  createdDate: string

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
  rejectionReason: string

  /**
   * The status of the tenant request: APPROVED, NEW, or REJECTED.
   */
  status: string

  /**
   * Creates a new TenantRequest instance.
   *
   * Note: rejectionReason is initialized to an empty string by default.
   *
   * @param config - The configuration properties for the service.
   * @returns A new TenantRequest instance.
   */
  constructor(config: TenantRequestConfig) {
    this.createdBy = config.createdBy
    this.createdDate = config.createdDate
    this.description = config.description
    this.id = config.id
    this.ministryName = config.ministryName
    this.name = config.name
    this.rejectionReason = config.rejectionReason || ''
    this.status = config.status
  }
}
