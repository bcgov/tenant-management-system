import type { InjectionKey } from 'vue'

// TODO: is injection the right way to be doing things?
// TODO: are these constants or should they be types?
// Keys for injecting into Vue components
export const INJECTION_KEYS = {
  error: Symbol('error') as InjectionKey<(message: string, error?: unknown) => void>,
  log: Symbol('log') as InjectionKey<(message: string) => void>,
  warn: Symbol('warn') as InjectionKey<(message: string) => void>,
}

// List of ministries
export const MINISTRIES = Object.freeze([
  'Agriculture and Food',
  'Attorney General',
  'Crown Agencies and Board Resourcing Office',
  'Compliance & Enforcement Collaborative',
  'Corporate Information and Records Management Office',
  "Citizens' Services",
  'Education and Child Care',
  'Energy and Climate Solutions',
  'Emergency Management and Climate Readiness',
  'Environment and Parks',
  'BC Elections',
  'Finance',
  'Forests',
  'Government Communications and Public Engagement',
  'Housing and Municipal Affairs',
  'Health',
  'Intergovernmental Relations Secretariat',
  'Ministry of Infrastructure',
  'Indigenous Relations & Reconciliation',
  'Jobs, Economic Development and Innovation',
  'Labour',
  'Mining and Critical Materials',
  'Children and Family Development',
  'Office of the Comptroller General',
  'Office of the Chief Information Officer',
  'Office of the Premier',
  'BC Public Service Agency',
  "Public Sector Employers' Council Secretariat",
  'Post-Secondary Education and Future Skills',
  'Public Safety and Solicitor General',
  'Provincial Treasury',
  'Social Development and Poverty Reduction',
  'Tourism, Arts, Culture and Sport',
  'Treasury Board Staff',
  'Transportation and Transit',
  'Water, Land and Resource Stewardship',
])

// List of Tenant Manager roles
export const ROLES = Object.freeze({
  ADMIN: 'TMS.TENANT_ADMIN',
  USER: 'TMS.TENANT_USER',
})
