import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import {
  makeGroup,
  makeGroupService,
  makeGroupServiceRole,
  makeGroupUser,
  makeUser,
} from '@/__tests__/__factories__'

import {
  Group,
  type GroupApiData,
  type GroupDetailFields,
  type GroupId,
} from '@/models/group.model'
import {
  GroupService,
  type GroupServiceApiData,
} from '@/models/groupservice.model'
import {
  GroupUser,
  type GroupUserApiData,
  type GroupUserId,
} from '@/models/groupuser.model'
import { toSsoUserId } from '@/models/ssouser.model'
import { type TenantId } from '@/models/tenant.model'
import { toUserId, type UserApiData } from '@/models/user.model'
import { groupService } from '@/services/group.service'
import { serviceService } from '@/services/service.service'
import { useGroupStore } from '@/stores/useGroupStore'

vi.mock('@/services/group.service', () => ({
  groupService: {
    addUserToGroup: vi.fn(),
    createGroup: vi.fn(),
    getGroup: vi.fn(),
    getTenantGroups: vi.fn(),
    removeUserFromGroup: vi.fn(),
    updateGroup: vi.fn(),
  },
}))

vi.mock('@/services/service.service', () => ({
  serviceService: {
    getTenantGroupServices: vi.fn(),
    updateTenantGroupServiceRoles: vi.fn(),
  },
}))

describe('Group Store', () => {
  const tenantId = 't-1' as TenantId
  const groupId = 'g-1' as GroupId

  const mockUserApiData: UserApiData = {
    id: toUserId('u-123'),
    roles: [],
    ssoUser: {
      displayName: 'John Doe',
      email: 'john@example.com',
      firstName: 'John',
      idpType: 'azureidir',
      lastName: 'Doe',
      ssoUserId: toSsoUserId('sso-123'),
      userName: 'jdoe',
    },
  }

  const mockGroupUserApi: GroupUserApiData = {
    id: 'gu-1' as GroupUserId,
    user: mockUserApiData,
  }

  const mockGroupApiData: GroupApiData = {
    id: groupId,
    name: 'Test Group',
    description: 'Test Desc',
    createdBy: 'creator-guid',
    createdDateTime: '2023-01-01',
    users: [mockGroupUserApi],
  }

  const mockGroupServiceApiData: GroupServiceApiData = {
    id: 'service-1',
    displayName: 'Test Service',
    clientIdentifier: 'test-client',
    description: 'Test Service Desc',
    sharedServiceRoles: [
      {
        id: 'role-1',
        name: 'Test Role',
        description: 'Test Role Desc',
        allowedIdentityProviders: ['idir'],
        enabled: true,
      },
    ],
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts with default values', () => {
    const store = useGroupStore()

    expect(store.groups).toEqual([])
    expect(store.groupServices).toEqual([])
    expect(store.loading).toBe(false)
  })

  describe('upsertGroup logic', () => {
    it('inserts a new group if it does not exist', async () => {
      const store = useGroupStore()
      vi.mocked(groupService.createGroup).mockResolvedValue(mockGroupApiData)

      await store.addGroup(tenantId, 'New', 'Desc')

      expect(store.groups).toHaveLength(1)
      expect(store.groups[0].id).toBe(groupId)
    })

    it('updates the existing group instance if the ID matches', async () => {
      const store = useGroupStore()
      store.groups = [makeGroup({ id: groupId, name: 'Old Name' })]
      const updatedData: GroupApiData = {
        ...mockGroupApiData,
        name: 'Updated Name',
      }
      vi.mocked(groupService.createGroup).mockResolvedValue(updatedData)

      await store.addGroup(tenantId, 'Updated', 'Desc')

      expect(store.groups).toHaveLength(1)
      expect(store.groups[0].name).toBe('Updated Name')
    })
  })

  describe('addGroupUser', () => {
    it('appends a mapped GroupUser to the local group state', async () => {
      const store = useGroupStore()
      const group = makeGroup({ id: groupId, groupUsers: [] })
      store.groups = [group]
      vi.mocked(groupService.addUserToGroup).mockResolvedValue(mockGroupUserApi)

      await store.addGroupUser(tenantId, groupId, makeUser())

      expect(group.groupUsers).toHaveLength(1)
      expect(group.groupUsers[0]).toBeInstanceOf(GroupUser)
      expect(group.groupUsers[0].id).toBe(mockGroupUserApi.id)
    })

    it('throws when group is not in the store', async () => {
      const store = useGroupStore()

      await expect(
        store.addGroupUser(tenantId, 'fake-id' as GroupId, makeUser()),
      ).rejects.toThrow('Group with ID fake-id not found')
    })
  })

  describe('fetchGroup', () => {
    it('manages loading state and upserts the fetched group', async () => {
      const store = useGroupStore()
      vi.mocked(groupService.getGroup).mockResolvedValue(mockGroupApiData)

      const promise = store.fetchGroup(tenantId, groupId)

      expect(store.loading).toBe(true)

      await promise

      expect(store.loading).toBe(false)
      expect(store.groups).toHaveLength(1)
      expect(store.groups[0]).toBeInstanceOf(Group)
      expect(store.groups[0].id).toBe(groupId)
    })

    it('resets loading state on error', async () => {
      const store = useGroupStore()
      vi.mocked(groupService.getGroup).mockRejectedValue(new Error('API error'))

      await expect(store.fetchGroup(tenantId, groupId)).rejects.toThrow()

      expect(store.loading).toBe(false)
    })
  })

  describe('fetchGroups', () => {
    it('manages loading state and overwrites store with results', async () => {
      const store = useGroupStore()
      vi.mocked(groupService.getTenantGroups).mockResolvedValue([
        mockGroupApiData,
      ])

      const promise = store.fetchGroups(tenantId)

      expect(store.loading).toBe(true)

      await promise

      expect(store.loading).toBe(false)
      expect(store.groups).toHaveLength(1)
      expect(store.groups[0]).toBeInstanceOf(Group)
    })

    it('resets loading state on error', async () => {
      const store = useGroupStore()
      vi.mocked(groupService.getTenantGroups).mockRejectedValue(
        new Error('API error'),
      )

      await expect(store.fetchGroups(tenantId)).rejects.toThrow()

      expect(store.loading).toBe(false)
    })
  })

  describe('fetchGroupServices', () => {
    it('maps api data and populates groupServices in the store', async () => {
      const store = useGroupStore()
      vi.mocked(serviceService.getTenantGroupServices).mockResolvedValue([
        mockGroupServiceApiData,
      ])

      await store.fetchGroupServices(tenantId, groupId)

      expect(store.groupServices).toHaveLength(1)
      expect(store.groupServices[0]).toBeInstanceOf(GroupService)
      expect(store.groupServices[0].id).toBe('service-1')
    })

    it('maps role isEnabled correctly from api data', async () => {
      const store = useGroupStore()
      vi.mocked(serviceService.getTenantGroupServices).mockResolvedValue([
        mockGroupServiceApiData,
      ])

      await store.fetchGroupServices(tenantId, groupId)

      expect(store.groupServices[0].roles[0].isEnabled).toBe(true)
    })

    it('manages loading state', async () => {
      const store = useGroupStore()
      vi.mocked(serviceService.getTenantGroupServices).mockResolvedValue([])

      const promise = store.fetchGroupServices(tenantId, groupId)

      expect(store.loading).toBe(true)

      await promise

      expect(store.loading).toBe(false)
    })

    it('resets loading state on error', async () => {
      const store = useGroupStore()
      vi.mocked(serviceService.getTenantGroupServices).mockRejectedValue(
        new Error('API error'),
      )

      await expect(
        store.fetchGroupServices(tenantId, groupId),
      ).rejects.toThrow()

      expect(store.loading).toBe(false)
    })
  })

  describe('getGroup', () => {
    it('returns the group if found', () => {
      const store = useGroupStore()
      const group = makeGroup({ id: groupId })
      store.groups = [group]

      expect(store.getGroup(groupId)).toStrictEqual(group)
    })

    it('returns undefined if not found', () => {
      const store = useGroupStore()

      expect(store.getGroup('missing' as GroupId)).toBeUndefined()
    })
  })

  describe('removeGroupUser', () => {
    it('removes the correct user from the group', async () => {
      const store = useGroupStore()
      const targetUserId = 'target-id' as GroupUserId
      const group = makeGroup({ id: groupId })
      group.groupUsers = [
        makeGroupUser({ id: 'other-id' }),
        makeGroupUser({ id: targetUserId }),
      ]
      store.groups = [group]

      await store.removeGroupUser(tenantId, groupId, targetUserId)

      expect(group.groupUsers).toHaveLength(1)
      expect(
        group.groupUsers.find((gu: GroupUser) => gu.id === targetUserId),
      ).toBeUndefined()
    })

    it('throws when group is not in the store', async () => {
      const store = useGroupStore()

      await expect(
        store.removeGroupUser(
          tenantId,
          'fake-id' as GroupId,
          'gu-1' as GroupUserId,
        ),
      ).rejects.toThrow('Group with ID fake-id not found')
    })

    it('handles removing a user id not present in groupUsers gracefully', async () => {
      const store = useGroupStore()
      const group = makeGroup({ id: groupId })
      group.groupUsers = [makeGroupUser({ id: 'other-id' })]
      store.groups = [group]

      await store.removeGroupUser(
        tenantId,
        groupId,
        'missing-id' as GroupUserId,
      )

      expect(group.groupUsers).toHaveLength(1)
    })
  })

  describe('updateGroupDetails', () => {
    it('updates name and description on the local group object', async () => {
      const store = useGroupStore()
      const group = makeGroup({ id: groupId, name: 'Old', description: 'Old' })
      store.groups = [group]
      const updatedData: GroupApiData = {
        ...mockGroupApiData,
        name: 'New Name',
        description: 'New Desc',
      }
      vi.mocked(groupService.updateGroup).mockResolvedValue(updatedData)

      await store.updateGroupDetails(tenantId, groupId, {
        name: 'New Name',
        description: 'New Desc',
      })

      expect(group.name).toBe('New Name')
      expect(group.description).toBe('New Desc')
    })

    it('throws when group is not in the store', async () => {
      const store = useGroupStore()

      await expect(
        store.updateGroupDetails(
          tenantId,
          'fake-id' as GroupId,
          {
            name: 'x',
            description: 'x',
          } as GroupDetailFields,
        ),
      ).rejects.toThrow('Group with ID fake-id not found')
    })
  })

  describe('updateGroupRoles', () => {
    it('calls the service with the updated group services', async () => {
      const store = useGroupStore()
      const services = [
        makeGroupService({
          id: 'service-1',
          roles: [makeGroupServiceRole({ id: 'role-1', isEnabled: true })],
        }),
      ]
      vi.mocked(serviceService.updateTenantGroupServiceRoles).mockResolvedValue(
        [],
      )

      await store.updateGroupRoles(tenantId, groupId, services)

      expect(serviceService.updateTenantGroupServiceRoles).toHaveBeenCalledWith(
        tenantId,
        groupId,
        services,
      )
    })

    it('updates groupServices in the store on success', async () => {
      const store = useGroupStore()
      const services = [makeGroupService({ id: 'service-1' })]
      vi.mocked(serviceService.updateTenantGroupServiceRoles).mockResolvedValue(
        [],
      )

      await store.updateGroupRoles(tenantId, groupId, services)

      expect(store.groupServices).toEqual(services)
    })

    it('throws and does not update the store on error', async () => {
      const store = useGroupStore()
      const original = [makeGroupService({ id: 'original' })]
      store.groupServices = original
      vi.mocked(serviceService.updateTenantGroupServiceRoles).mockRejectedValue(
        new Error('API error'),
      )

      await expect(
        store.updateGroupRoles(tenantId, groupId, [
          makeGroupService({ id: 'new' }),
        ]),
      ).rejects.toThrow()

      expect(store.groupServices).toEqual(original)
    })
  })
})
