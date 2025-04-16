import type { InjectionKey } from 'vue'

// TODO: is injection the right way to be doing things?
// TODO: are these constants or should they be types?
// Keys for injecting into Vue components
export const INJECTION_KEYS = Object.freeze({
  error: Symbol('error') as InjectionKey<(message: string, error?: unknown) => void>,
  log: Symbol('log') as InjectionKey<(message: string) => void>,
  warn: Symbol('warn') as InjectionKey<(message: string) => void>,
})

// List of ministries
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
  ADMIN: 'TMS.TENANT_ADMIN',
  USER: 'TMS.TENANT_USER',
})
