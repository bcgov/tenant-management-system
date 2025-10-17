import { i18n } from '@/i18n'

const t = i18n.global.t
/**
 * Available search field types for IDIR user lookups
 *
 * Defines the searchable fields when querying IDIR (Integrated Directory)
 * users, each with a human-readable title and corresponding API value.
 */
export const IDIR_SEARCH_TYPE = Object.freeze({
  EMAIL: { title: 'Email', value: 'email' },
  FIRST_NAME: { title: 'First Name', value: 'firstName' },
  LAST_NAME: { title: 'Last Name', value: 'lastName' },
})

/**
 * Type definition for IDIR search types
 *
 * Represents the possible values for IDIR user search fields: 'email',
 * 'firstName', 'lastName'
 */
export type IdirSearchType =
  (typeof IDIR_SEARCH_TYPE)[keyof typeof IDIR_SEARCH_TYPE]['value']

/**
 * British Columbia government ministries and organizations
 *
 * Complete list of BC government ministries and organizations that a tenant can
 * be associated with. Used for organizational categorization and access
 * control.
 *
 * @remarks
 * This list represents the current BC government structure and may need updates
 * when government reorganizations occur.
 */
export const MINISTRIES = Object.freeze([
  'Agriculture and Food',
  'Attorney General',
  'BC Elections',
  'BC Public Service Agency',
  'Children and Family Development',
  "Citizens' Services",
  'Compliance and Enforcement Collaborative',
  'Corporate Information and Records Management Office',
  'Crown Agencies and Board Resourcing Office',
  'Education and Child Care',
  'Emergency Management and Climate Readiness',
  'Energy and Climate Solutions',
  'Environment and Parks',
  'Finance',
  'Forests',
  'Government Communications and Public Engagement',
  'Health',
  'Housing and Municipal Affairs',
  'Indigenous Relations and Reconciliation',
  'Infrastructure',
  'Intergovernmental Relations Secretariat',
  'Jobs, Economic Development and Innovation',
  'Labour',
  'Mining and Critical Materials',
  'Office of the Chief Information Officer',
  'Office of the Comptroller General',
  'Office of the Premier',
  'Post-Secondary Education and Future Skills',
  'Provincial Treasury',
  'Public Safety and Solicitor General',
  "Public Sector Employers' Council Secretariat",
  'Social Development and Poverty Reduction',
  'Tourism, Arts, Culture and Sport',
  'Transportation and Transit',
  'Treasury Board Staff',
  'Water, Land and Resource Stewardship',
])

/**
 * Available roles in the Tenant Management System (TMS)
 *
 * Defines the hierarchical roles that users can be assigned within the system,
 * each with specific permissions and responsibilities.
 */
export const ROLES = Object.freeze({
  /**
   * Highest level administrative role with full system access
   */
  OPERATIONS_ADMIN: {
    title: 'Operations Admin',
    value: 'TMS.OPERATIONS_ADMIN',
  },

  /**
   * Standard user role with basic service access
   */
  SERVICE_USER: { title: i18n.global.t('roles.user'), value: 'TMS.SERVICE_USER' },

  /**
   * Owner of a specific tenant with management privileges
   */
  TENANT_OWNER: { title: t('roles.owner'), value: 'TMS.TENANT_OWNER' },

  /**
   * Administrative role for managing users within a tenant
   */
  USER_ADMIN: { title: t('roles.admin'), value: 'TMS.USER_ADMIN' },
})

/**
 * Possible states for tenant access requests
 *
 * Represents the workflow states that a tenant request can be in, from initial
 * submission through final resolution.
 */
export const TENANT_REQUEST_STATUS = Object.freeze({
  /**
   * Request has been reviewed and approved
   */
  APPROVED: { title: 'Approved', value: 'APPROVED' },

  /**
   * Newly submitted request awaiting review
   */
  NEW: { title: 'New', value: 'NEW' },

  /**
   * Request has been reviewed and rejected
   */
  REJECTED: { title: 'Rejected', value: 'REJECTED' },
})
