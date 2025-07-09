// List of search types for IDIR users.
export const IDIR_SEARCH_TYPE = Object.freeze({
  EMAIL: { title: 'Email', value: 'email' },
  FIRST_NAME: { title: 'First Name', value: 'firstName' },
  LAST_NAME: { title: 'Last Name', value: 'lastName' },
})

// Type definition for IDIR search types: email, firstName, lastName.
export type IdirSearchType =
  (typeof IDIR_SEARCH_TYPE)[keyof typeof IDIR_SEARCH_TYPE]['value']

// The ministries and organizations that a tenant can belong to.
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

// List of Tenant Management roles
export const ROLES = Object.freeze({
  SERVICE_USER: { title: 'Service User', value: 'TMS.SERVICE_USER' },
  TENANT_OWNER: { title: 'Tenant Owner', value: 'TMS.TENANT_OWNER' },
  USER_ADMIN: { title: 'User Admin', value: 'TMS.USER_ADMIN' },
})
