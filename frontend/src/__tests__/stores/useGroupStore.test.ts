import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { makeGroup, makeUser, makeGroupUser } from '@/__tests__/__factories__'

import {
  Group,
  type GroupApiData,
  type GroupDetailFields,
  type GroupId,
} from '@/models/group.model'
import {
  GroupUser,
  type GroupUserApiData,
  type GroupUserId,
} from '@/models/groupuser.model'
import { toSsoUserId } from '@/models/ssouser.model'
import { type TenantId } from '@/models/tenant.model'
import { toUserId, type UserApiData } from '@/models/user.model'
import { groupService } from '@/services/group.service'
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

describe('Group Store', () => {
  const tenantId = 't-1' as TenantId
  const groupId = 'g-1' as GroupId

  // Correctly shaped User API Data
  const mockUserApiData: UserApiData = {
    id: toUserId('u-123'),
    roles: [],
    ssoUser: {
      displayName: 'John Doe',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      ssoUserId: toSsoUserId('sso-123'),
      userName: 'jdoe',
    },
  }

  // Correctly shaped GroupUser API Data (Nested 'user' property)
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

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts with default values', () => {
    const store = useGroupStore()

    expect(store.groups).toEqual([])
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
      expect(group.groupUsers[0].user.id).toBe(mockUserApiData.id)
    })

    it('throws when trying to add a user to a group not in the store', async () => {
      const store = useGroupStore()

      await expect(
        store.addGroupUser(tenantId, 'fake-id' as GroupId, makeUser()),
      ).rejects.toThrow('Group with ID fake-id not found')
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
  })

  describe('removeGroupUser', () => {
    it('identifies and removes the correct user from the nested group array', async () => {
      const store = useGroupStore()
      const targetUserId = 'target-id' as GroupUserId
      const group = makeGroup({ id: groupId })
      group.groupUsers = [
        makeGroupUser({ id: 'other-id' as GroupUserId }),
        makeGroupUser({ id: targetUserId }),
      ]
      store.groups = [group]

      await store.removeGroupUser(tenantId, groupId, targetUserId)

      expect(group.groupUsers).toHaveLength(1)
      expect(
        group.groupUsers.find((gu: GroupUser) => gu.id === targetUserId),
      ).toBeUndefined()
    })
  })

  describe('updateGroupDetails', () => {
    it('updates properties of the local group object on success', async () => {
      const store = useGroupStore()
      const group = makeGroup({ id: groupId, name: 'Old', description: 'Old' })
      store.groups = [group]
      const updatedData: GroupApiData = {
        ...mockGroupApiData,
        name: 'New Name',
        description: 'New Desc',
      }
      vi.mocked(groupService.updateGroup).mockResolvedValue(updatedData)
      const details: GroupDetailFields = {
        name: 'New Name',
        description: 'New Desc',
      }

      await store.updateGroupDetails(tenantId, groupId, details)

      expect(group.name).toBe('New Name')
      expect(group.description).toBe('New Desc')
    })
  })
})
