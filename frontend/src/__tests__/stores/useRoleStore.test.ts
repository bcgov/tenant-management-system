import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeRole, makeRoleApiData } from '@/__tests__/__factories__'

import { toRoleId } from '@/models/role.model'
import { roleService } from '@/services/role.service'
import { useRoleStore } from '@/stores/useRoleStore'

vi.mock('@/services/role.service', () => ({
  roleService: {
    getRoles: vi.fn(),
  },
}))

describe('useRoleStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts with default values', () => {
    const store = useRoleStore()

    expect(store.roles).toEqual([])
    expect(store.loading).toBe(false)
  })

  describe('fetchRoles', () => {
    it('manages loading state', async () => {
      const store = useRoleStore()
      vi.mocked(roleService.getRoles).mockResolvedValue([makeRoleApiData()])

      expect(store.loading).toBe(false)

      const promise = store.fetchRoles()

      expect(store.loading).toBe(true)

      await promise

      expect(store.loading).toBe(false)
    })

    it('clears loading state on error', async () => {
      const store = useRoleStore()
      vi.mocked(roleService.getRoles).mockRejectedValueOnce(
        new Error('API Error'),
      )

      expect(store.loading).toBe(false)

      await expect(store.fetchRoles()).rejects.toThrow('API Error')

      expect(store.loading).toBe(false)
    })

    it('overwrites store with results', async () => {
      const store = useRoleStore()
      const role = makeRole({
        description: 'roleDescription',
        id: toRoleId('roleId'),
        name: 'roleName',
      })
      store.roles = [role]
      const roleApiData = makeRoleApiData({
        description: 'roleDescription2',
        id: toRoleId('roleId2'),
        name: 'roleName2',
      })
      vi.mocked(roleService.getRoles).mockResolvedValue([roleApiData])

      expect(store.roles).toHaveLength(1)
      expect(store.roles[0].description).toBe('roleDescription')
      expect(store.roles[0].id).toBe('roleId')
      expect(store.roles[0].name).toBe('roleName')

      await store.fetchRoles()

      expect(store.roles).toHaveLength(1)
      expect(store.roles[0].description).toBe('roleDescription2')
      expect(store.roles[0].id).toBe('roleId2')
      expect(store.roles[0].name).toBe('roleName2')
    })

    it('does not alter the state on api error', async () => {
      const store = useRoleStore()
      const role = makeRole({
        description: 'roleDescription',
        id: toRoleId('roleId'),
        name: 'roleName',
      })
      store.roles = [role]
      vi.mocked(roleService.getRoles).mockRejectedValueOnce(
        new Error('API error'),
      )

      expect(store.roles).toHaveLength(1)
      expect(store.roles[0].description).toBe('roleDescription')
      expect(store.roles[0].id).toBe('roleId')
      expect(store.roles[0].name).toBe('roleName')

      await expect(store.fetchRoles()).rejects.toThrow()

      expect(store.roles).toHaveLength(1)
      expect(store.roles[0].description).toBe('roleDescription')
      expect(store.roles[0].id).toBe('roleId')
      expect(store.roles[0].name).toBe('roleName')
    })
  })
})
