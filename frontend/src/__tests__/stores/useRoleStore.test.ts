import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Role, type RoleApiData, toRoleId } from '@/models/role.model'
import { roleService } from '@/services/role.service'
import { useRoleStore } from '@/stores/useRoleStore'

vi.mock('@/services/role.service', () => ({
  roleService: {
    getRoles: vi.fn(),
  },
}))

describe('Role Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts with default values', () => {
    const store = useRoleStore()

    expect(store.roles).toEqual([])
    expect(store.loading).toBe(false)
  })

  it('fetches roles and updates state correctly', async () => {
    const store = useRoleStore()
    const mockRawData: RoleApiData[] = [
      { description: 'Administrator', id: toRoleId('1'), name: 'Admin' },
    ]
    vi.mocked(roleService.getRoles).mockResolvedValue(mockRawData)

    const fetchPromise = store.fetchRoles()

    expect(store.loading).toBe(true)

    await fetchPromise

    expect(store.loading).toBe(false)
    expect(store.roles).toHaveLength(1)
    expect(store.roles[0]).toBeInstanceOf(Role)
    expect(store.roles[0].name).toBe('Admin')
  })

  it('sets loading to false even if the API fails', async () => {
    const store = useRoleStore()
    vi.mocked(roleService.getRoles).mockRejectedValue(new Error('API Error'))

    await expect(store.fetchRoles()).rejects.toThrow('API Error')

    expect(store.loading).toBe(false)
    expect(store.roles).toEqual([])
  })
})
