import { describe, expect, it } from 'vitest'

import {
  BCEID_SEARCH_TYPE,
  IDIR_SEARCH_TYPE,
  MINISTRIES,
  ROLES,
  TENANT_REQUEST_STATUS,
} from '@/utils/constants'

describe('IDIR_SEARCH_TYPE', () => {
  it('is frozen', () => {
    expect(Object.isFrozen(IDIR_SEARCH_TYPE)).toBe(true)
  })

  it('has the correct values', () => {
    expect(IDIR_SEARCH_TYPE.EMAIL).toEqual({ title: 'Email', value: 'email' })
    expect(IDIR_SEARCH_TYPE.FIRST_NAME).toEqual({
      title: 'First Name',
      value: 'firstName',
    })
    expect(IDIR_SEARCH_TYPE.LAST_NAME).toEqual({
      title: 'Last Name',
      value: 'lastName',
    })
  })

  it('has unique values', () => {
    const values = Object.values(IDIR_SEARCH_TYPE).map((item) => item.value)

    expect(values.length).toBe(new Set(values).size)
  })
})

describe('BCEID_SEARCH_TYPE', () => {
  it('is frozen', () => {
    expect(Object.isFrozen(BCEID_SEARCH_TYPE)).toBe(true)
  })

  it('has the correct values', () => {
    expect(BCEID_SEARCH_TYPE.EMAIL).toEqual({ title: 'Email', value: 'email' })
    expect(BCEID_SEARCH_TYPE.DISPLAY_NAME).toEqual({
      title: 'Name',
      value: 'displayName',
    })
  })

  it('has unique values', () => {
    const values = Object.values(BCEID_SEARCH_TYPE).map((item) => item.value)

    expect(values.length).toBe(new Set(values).size)
  })
})

describe('MINISTRIES', () => {
  it('is frozen', () => {
    expect(Object.isFrozen(MINISTRIES)).toBe(true)
  })

  it('has the correct number of entries', () => {
    expect(MINISTRIES).toHaveLength(36)
  })

  it('has unique entries', () => {
    expect(MINISTRIES.length).toBe(new Set(MINISTRIES).size)
  })

  it('is sorted alphabetically by first and last entry', () => {
    expect(MINISTRIES.at(0)).toBe('Agriculture and Food')
    expect(MINISTRIES.at(-1)).toBe('Water, Land and Resource Stewardship')
  })
})

describe('ROLES', () => {
  it('is frozen', () => {
    expect(Object.isFrozen(ROLES)).toBe(true)
  })

  it('has the correct values', () => {
    expect(ROLES.OPERATIONS_ADMIN).toEqual({
      title: 'Operations Admin',
      value: 'TMS.OPERATIONS_ADMIN',
    })
    expect(ROLES.SERVICE_USER).toEqual({
      title: 'Service User',
      value: 'TMS.SERVICE_USER',
    })
    expect(ROLES.TENANT_OWNER).toEqual({
      title: 'Tenant Owner',
      value: 'TMS.TENANT_OWNER',
    })
    expect(ROLES.USER_ADMIN).toEqual({
      title: 'User Admin',
      value: 'TMS.USER_ADMIN',
    })
  })

  it('has unique values', () => {
    const values = Object.values(ROLES).map((role) => role.value)

    expect(values.length).toBe(new Set(values).size)
  })
})

describe('TENANT_REQUEST_STATUS', () => {
  it('is frozen', () => {
    expect(Object.isFrozen(TENANT_REQUEST_STATUS)).toBe(true)
  })

  it('has the correct values', () => {
    expect(TENANT_REQUEST_STATUS.APPROVED).toEqual({
      title: 'Approved',
      value: 'APPROVED',
    })
    expect(TENANT_REQUEST_STATUS.NEW).toEqual({ title: 'New', value: 'NEW' })
    expect(TENANT_REQUEST_STATUS.REJECTED).toEqual({
      title: 'Rejected',
      value: 'REJECTED',
    })
  })

  it('has unique values', () => {
    const values = Object.values(TENANT_REQUEST_STATUS).map(
      (status) => status.value,
    )

    expect(values.length).toBe(new Set(values).size)
  })
})
