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
   * Creates a new Tenant Request instance.
   *
   * Note: rejectionReason is initialized to an empty string by default.
   *
   * @param createdBy - The identity of who created the tenant request.
   * @param createdDate - The ISO8601 date string (YYYY-MM-DD) when tenant
   *   request was created.
   * @param description - The description of the tenant request.
   * @param id - The unique identifier for the tenant request.
   * @param name - The display name of the tenant request.
   * @param ministryName - The associated ministry or organization name.
   * @param status - The status of the tenant request.
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
}
