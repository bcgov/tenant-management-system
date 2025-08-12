import { describe, expect, it } from 'vitest'

import {
  IDIR_SEARCH_TYPE,
  type IdirSearchType,
  MINISTRIES,
  ROLES,
  TENANT_REQUEST_STATUS,
} from '@/utils/constants'

describe('Constants', () => {
  describe('IDIR_SEARCH_TYPE', () => {
    it('should be frozen (immutable)', () => {
      expect(Object.isFrozen(IDIR_SEARCH_TYPE)).toBe(true)
    })

    it('should contain expected search types', () => {
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

    it('should have consistent structure for all entries', () => {
      Object.values(IDIR_SEARCH_TYPE).forEach((searchType) => {
        expect(searchType).toHaveProperty('title')
        expect(searchType).toHaveProperty('value')
        expect(typeof searchType.title).toBe('string')
        expect(typeof searchType.value).toBe('string')
      })
    })

    it('should have unique values', () => {
      const values = Object.values(IDIR_SEARCH_TYPE).map((item) => item.value)
      const uniqueValues = new Set(values)
      expect(values.length).toBe(uniqueValues.size)
    })
  })

  describe('IdirSearchType', () => {
    it('should match IDIR_SEARCH_TYPE values', () => {
      const expectedTypes: IdirSearchType[] = ['email', 'firstName', 'lastName']
      const actualValues = Object.values(IDIR_SEARCH_TYPE).map(
        (item) => item.value,
      )

      expectedTypes.forEach((type) => {
        expect(actualValues).toContain(type)
      })
    })
  })

  describe('MINISTRIES', () => {
    it('should be frozen (immutable)', () => {
      expect(Object.isFrozen(MINISTRIES)).toBe(true)
    })

    it('should contain expected number of ministries', () => {
      expect(MINISTRIES).toHaveLength(36)
    })

    it('should contain all strings', () => {
      MINISTRIES.forEach((ministry) => {
        expect(typeof ministry).toBe('string')
        expect(ministry.length).toBeGreaterThan(0)
      })
    })

    it('should have unique ministry names', () => {
      const uniqueMinistries = new Set(MINISTRIES)
      expect(MINISTRIES.length).toBe(uniqueMinistries.size)
    })

    it('should contain key BC government ministries', () => {
      expect(MINISTRIES).toContain('Health')
      expect(MINISTRIES).toContain('Education and Child Care')
      expect(MINISTRIES).toContain('Finance')
      expect(MINISTRIES).toContain('Office of the Premier')
    })
  })

  describe('ROLES', () => {
    it('should be frozen (immutable)', () => {
      expect(Object.isFrozen(ROLES)).toBe(true)
    })

    it('should contain expected roles', () => {
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

    it('should have consistent structure for all roles', () => {
      Object.values(ROLES).forEach((role) => {
        expect(role).toHaveProperty('title')
        expect(role).toHaveProperty('value')
        expect(typeof role.title).toBe('string')
        expect(typeof role.value).toBe('string')
        expect(role.value).toMatch(/^TMS\./)
      })
    })

    it('should have unique values', () => {
      const values = Object.values(ROLES).map((role) => role.value)
      const uniqueValues = new Set(values)
      expect(values.length).toBe(uniqueValues.size)
    })
  })

  describe('TENANT_REQUEST_STATUS', () => {
    it('should be frozen (immutable)', () => {
      expect(Object.isFrozen(TENANT_REQUEST_STATUS)).toBe(true)
    })

    it('should contain expected statuses', () => {
      expect(TENANT_REQUEST_STATUS.APPROVED).toEqual({
        title: 'Approved',
        value: 'APPROVED',
      })
      expect(TENANT_REQUEST_STATUS.NEW).toEqual({
        title: 'New',
        value: 'NEW',
      })
      expect(TENANT_REQUEST_STATUS.REJECTED).toEqual({
        title: 'Rejected',
        value: 'REJECTED',
      })
    })

    it('should have consistent structure for all statuses', () => {
      Object.values(TENANT_REQUEST_STATUS).forEach((status) => {
        expect(status).toHaveProperty('title')
        expect(status).toHaveProperty('value')
        expect(typeof status.title).toBe('string')
        expect(typeof status.value).toBe('string')
      })
    })

    it('should have unique values', () => {
      const values = Object.values(TENANT_REQUEST_STATUS).map(
        (status) => status.value,
      )
      const uniqueValues = new Set(values)
      expect(values.length).toBe(uniqueValues.size)
    })

    it('should cover basic workflow states', () => {
      const values = Object.values(TENANT_REQUEST_STATUS).map(
        (status) => status.value,
      )
      expect(values).toContain('NEW')
      expect(values).toContain('APPROVED')
      expect(values).toContain('REJECTED')
    })
  })
})
