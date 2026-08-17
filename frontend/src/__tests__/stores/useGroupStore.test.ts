import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import {
  makeGroup,
  makeGroupApiData,
  makeGroupService,
  makeGroupServiceApiData,
  makeGroupServiceRole,
  makeGroupUser,
  makeGroupUserApiData,
  makeServiceApiData,
  makeUser,
} from '@/__tests__/__factories__'

import { Group, toGroupId } from '@/models/group.model'
import { toGroupServiceId } from '@/models/groupservice.model'
import { GroupUser, toGroupUserId } from '@/models/groupuser.model'
import { toServiceId } from '@/models/service.model'
import { toTenantId } from '@/models/tenant.model'
import { groupService } from '@/services/group.service'
import { serviceService } from '@/services/service.service'
import { useGroupStore } from '@/stores/useGroupStore'
import { toGroupServiceRoleId } from '@/models/groupservicerole.model'

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

describe('useGroupStore', () => {
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

  describe('addGroup', () => {
    it('creates a new group in the store', async () => {
      const store = useGroupStore()
      const groupApiData = makeGroupApiData({
        description: 'groupDescription',
        id: toGroupId('groupId'),
        name: 'groupName',
      })
      vi.mocked(groupService.createGroup).mockResolvedValue(groupApiData)

      expect(store.groups).toHaveLength(0)

      await store.addGroup(
        toTenantId('tenantId'),
        'groupName',
        'groupDescription',
      )

      expect(store.groups).toHaveLength(1)
      expect(store.groups[0].description).toBe('groupDescription')
      expect(store.groups[0].id).toBe('groupId')
      expect(store.groups[0].name).toBe('groupName')
    })

    it('does not alter the state on api error', async () => {
      const store = useGroupStore()
      const group = makeGroup({
        description: 'groupDescription',
        id: toGroupId('groupId'),
        name: 'groupName',
      })
      store.groups = [group]
      vi.mocked(groupService.createGroup).mockRejectedValueOnce(
        new Error('API error'),
      )

      expect(store.groups).toHaveLength(1)
      expect(store.groups[0].description).toBe('groupDescription')
      expect(store.groups[0].id).toBe('groupId')
      expect(store.groups[0].name).toBe('groupName')

      await expect(
        store.addGroup(
          toTenantId('tenantId'),
          'groupName2',
          'groupDescription2',
        ),
      ).rejects.toThrow()

      expect(store.groups).toHaveLength(1)
      expect(store.groups[0].description).toBe('groupDescription')
      expect(store.groups[0].id).toBe('groupId')
      expect(store.groups[0].name).toBe('groupName')
    })
  })

  describe('addGroupUser', () => {
    it('appends a user to the group', async () => {
      const store = useGroupStore()
      const group = makeGroup({ groupUsers: [], id: toGroupId('groupId') })
      store.groups = [group]
      const groupUserApiData = makeGroupUserApiData({
        id: toGroupUserId('groupUserId'),
      })
      vi.mocked(groupService.addUserToGroup).mockResolvedValue(groupUserApiData)

      expect(store.groups[0].groupUsers).toHaveLength(0)

      await store.addGroupUser(
        toTenantId('tenantId'),
        toGroupId('groupId'),
        makeUser(),
      )

      expect(store.groups[0].groupUsers).toHaveLength(1)
      expect(store.groups[0].groupUsers[0]).toBeInstanceOf(GroupUser)
      expect(store.groups[0].groupUsers[0].id).toBe('groupUserId')
    })

    it('does not alter the state on api error', async () => {
      const store = useGroupStore()
      const group = makeGroup({ groupUsers: [], id: toGroupId('groupId') })
      store.groups = [group]
      vi.mocked(groupService.addUserToGroup).mockRejectedValueOnce(
        new Error('API error'),
      )

      expect(store.groups[0].groupUsers).toHaveLength(0)

      await expect(
        store.addGroupUser(
          toTenantId('tenantId'),
          toGroupId('groupId'),
          makeUser(),
        ),
      ).rejects.toThrow()

      expect(store.groups[0].groupUsers).toHaveLength(0)
    })

    it('throws when group is not in the store', async () => {
      const store = useGroupStore()

      await expect(
        store.addGroupUser(
          toTenantId('tenantId'),
          toGroupId('groupId'),
          makeUser(),
        ),
      ).rejects.toThrow('Group with ID groupId not found')
    })
  })

  describe('fetchGroup', () => {
    it('manages loading state', async () => {
      const store = useGroupStore()
      vi.mocked(groupService.getGroup).mockResolvedValue(makeGroupApiData())

      expect(store.loading).toBe(false)

      const promise = store.fetchGroup(
        toTenantId('tenantId'),
        toGroupId('groupId'),
      )

      expect(store.loading).toBe(true)

      await promise

      expect(store.loading).toBe(false)
    })

    it('clears loading state on error', async () => {
      const store = useGroupStore()
      vi.mocked(groupService.getGroup).mockRejectedValueOnce(
        new Error('API error'),
      )

      expect(store.loading).toBe(false)

      await expect(
        store.fetchGroup(toTenantId('tenantId'), toGroupId('groupId')),
      ).rejects.toThrow()

      expect(store.loading).toBe(false)
    })

    it('inserts the fetched group', async () => {
      const store = useGroupStore()
      const groupApiData = makeGroupApiData({
        id: toGroupId('groupId'),
      })
      vi.mocked(groupService.getGroup).mockResolvedValue(groupApiData)

      await store.fetchGroup(toTenantId('tenantId'), toGroupId('groupId'))

      expect(store.groups).toHaveLength(1)
      expect(store.groups[0]).toBeInstanceOf(Group)
      expect(store.groups[0].id).toBe('groupId')
    })

    it('updates the fetched group', async () => {
      const store = useGroupStore()
      const group = makeGroup({
        description: 'groupDescription',
        id: toGroupId('groupId'),
        name: 'groupName',
      })
      store.groups = [group]
      const groupApiData = makeGroupApiData({
        description: 'groupDescriptionNew',
        id: toGroupId('groupId'),
        name: 'groupNameNew',
      })
      vi.mocked(groupService.getGroup).mockResolvedValue(groupApiData)

      await store.fetchGroup(toTenantId('tenantId'), toGroupId('groupId'))

      expect(store.groups).toHaveLength(1)
      expect(store.groups[0]).toBeInstanceOf(Group)
      expect(store.groups[0].description).toBe('groupDescriptionNew')
      expect(store.groups[0].id).toBe('groupId')
      expect(store.groups[0].name).toBe('groupNameNew')
    })

    it('does not alter the state on api error', async () => {
      const store = useGroupStore()
      const group = makeGroup({ groupUsers: [], id: toGroupId('groupId') })
      store.groups = [group]
      vi.mocked(groupService.getGroup).mockRejectedValueOnce(
        new Error('API error'),
      )

      expect(store.groups).toHaveLength(1)

      await expect(
        store.fetchGroup(toTenantId('tenantId'), toGroupId('groupId2')),
      ).rejects.toThrow()

      expect(store.groups).toHaveLength(1)
    })
  })

  describe('fetchGroups', () => {
    it('manages loading state', async () => {
      const store = useGroupStore()
      vi.mocked(groupService.getTenantGroups).mockResolvedValue([
        makeGroupApiData(),
      ])

      expect(store.loading).toBe(false)

      const promise = store.fetchGroups(toTenantId('tenantId'))

      expect(store.loading).toBe(true)

      await promise

      expect(store.loading).toBe(false)
    })

    it('clears loading state on error', async () => {
      const store = useGroupStore()
      vi.mocked(groupService.getTenantGroups).mockRejectedValueOnce(
        new Error('API error'),
      )

      expect(store.loading).toBe(false)

      await expect(store.fetchGroups(toTenantId('tenantId'))).rejects.toThrow()

      expect(store.loading).toBe(false)
    })

    it('overwrites store with results', async () => {
      const store = useGroupStore()
      const group = makeGroup({
        description: 'groupDescription',
        id: toGroupId('groupId'),
        name: 'groupName',
      })
      store.groups = [group]
      const groupApiData = makeGroupApiData({
        description: 'groupDescription2',
        id: toGroupId('groupId2'),
        name: 'groupName2',
      })
      vi.mocked(groupService.getTenantGroups).mockResolvedValue([groupApiData])

      expect(store.groups).toHaveLength(1)
      expect(store.groups[0].description).toBe('groupDescription')
      expect(store.groups[0].id).toBe('groupId')
      expect(store.groups[0].name).toBe('groupName')

      await store.fetchGroups(toTenantId('tenantId'))

      expect(store.groups).toHaveLength(1)
      expect(store.groups[0].description).toBe('groupDescription2')
      expect(store.groups[0].id).toBe('groupId2')
      expect(store.groups[0].name).toBe('groupName2')
    })

    it('does not alter the state on api error', async () => {
      const store = useGroupStore()
      const group = makeGroup({
        description: 'groupDescription',
        id: toGroupId('groupId'),
        name: 'groupName',
      })
      store.groups = [group]
      vi.mocked(groupService.getTenantGroups).mockRejectedValueOnce(
        new Error('API error'),
      )

      expect(store.groups).toHaveLength(1)
      expect(store.groups[0].description).toBe('groupDescription')
      expect(store.groups[0].id).toBe('groupId')
      expect(store.groups[0].name).toBe('groupName')

      await expect(store.fetchGroups(toTenantId('tenantId'))).rejects.toThrow()

      expect(store.groups).toHaveLength(1)
      expect(store.groups[0].description).toBe('groupDescription')
      expect(store.groups[0].id).toBe('groupId')
      expect(store.groups[0].name).toBe('groupName')
    })
  })

  describe('fetchGroupServices', () => {
    it('manages loading state', async () => {
      const store = useGroupStore()
      vi.mocked(serviceService.getTenantGroupServices).mockResolvedValue([])

      expect(store.loading).toBe(false)

      const promise = store.fetchGroupServices(
        toTenantId('tenantId'),
        toGroupId('groupId'),
      )

      expect(store.loading).toBe(true)

      await promise

      expect(store.loading).toBe(false)
    })

    it('clears loading state on error', async () => {
      const store = useGroupStore()
      vi.mocked(serviceService.getTenantGroupServices).mockRejectedValueOnce(
        new Error('API error'),
      )

      expect(store.loading).toBe(false)

      await expect(
        store.fetchGroupServices(toTenantId('tenantId'), toGroupId('groupId')),
      ).rejects.toThrow()

      expect(store.loading).toBe(false)
    })

    it('inserts the fetched group service', async () => {
      const store = useGroupStore()
      const groupServiceApiData = makeGroupServiceApiData({
        clientIdentifier: 'groupServiceClientIdentifier',
        description: 'groupServiceDescription',
        displayName: 'groupServiceDisplayName',
        id: toGroupServiceId('groupServiceId'),
      })
      vi.mocked(serviceService.getTenantGroupServices).mockResolvedValue([
        groupServiceApiData,
      ])

      expect(store.groupServices).toHaveLength(0)

      await store.fetchGroupServices(
        toTenantId('tenantId'),
        toGroupId('groupId'),
      )

      expect(store.groupServices).toHaveLength(1)
      expect(store.groupServices[0].clientIdentifier).toBe(
        'groupServiceClientIdentifier',
      )
      expect(store.groupServices[0].description).toBe('groupServiceDescription')
      expect(store.groupServices[0].displayName).toBe('groupServiceDisplayName')
      expect(store.groupServices[0].id).toBe('groupServiceId')
    })

    it('does not alter the state on api error', async () => {
      const store = useGroupStore()
      const groupService = makeGroupService({
        clientIdentifier: 'groupServiceClientIdentifier',
        description: 'groupServiceDescription',
        displayName: 'groupServiceDisplayName',
        id: toGroupServiceId('groupServiceId'),
      })
      store.groupServices = [groupService]
      vi.mocked(serviceService.getTenantGroupServices).mockRejectedValueOnce(
        new Error('API error'),
      )

      expect(store.groupServices).toHaveLength(1)
      expect(store.groupServices[0].clientIdentifier).toBe(
        'groupServiceClientIdentifier',
      )
      expect(store.groupServices[0].description).toBe('groupServiceDescription')
      expect(store.groupServices[0].displayName).toBe('groupServiceDisplayName')
      expect(store.groupServices[0].id).toBe('groupServiceId')

      await expect(
        store.fetchGroupServices(toTenantId('tenantId'), toGroupId('groupId')),
      ).rejects.toThrow()

      expect(store.groupServices).toHaveLength(1)
      expect(store.groupServices[0].clientIdentifier).toBe(
        'groupServiceClientIdentifier',
      )
      expect(store.groupServices[0].description).toBe('groupServiceDescription')
      expect(store.groupServices[0].displayName).toBe('groupServiceDisplayName')
      expect(store.groupServices[0].id).toBe('groupServiceId')
    })
  })

  describe('getGroup', () => {
    it('returns the group', () => {
      const store = useGroupStore()
      const group = makeGroup({
        description: 'groupDescription',
        id: toGroupId('groupId'),
        name: 'groupName',
      })
      store.groups = [group]

      const returnedGroup = store.getGroup(toGroupId('groupId'))

      expect(returnedGroup).toBeDefined()
      expect(returnedGroup?.description).toBe('groupDescription')
      expect(returnedGroup?.id).toBe('groupId')
      expect(returnedGroup?.name).toBe('groupName')
    })

    it('returns undefined if not found', () => {
      const store = useGroupStore()

      const returnedGroup = store.getGroup(toGroupId('groupId'))

      expect(returnedGroup).toBeUndefined()
    })
  })

  describe('removeGroupUser', () => {
    it('removes the user from the group', async () => {
      const store = useGroupStore()
      const targetUserId = toGroupUserId('groupUserId2')
      const group = makeGroup({
        groupUsers: [
          makeGroupUser({ id: toGroupUserId('groupUserId') }),
          makeGroupUser({ id: targetUserId }),
        ],
        id: toGroupId('groupId'),
      })
      store.groups = [group]

      await store.removeGroupUser(
        toTenantId('tenantId'),
        toGroupId('groupId'),
        targetUserId,
      )

      expect(store.groups[0].groupUsers).toHaveLength(1)
      expect(store.groups[0].groupUsers[0].id).toBe('groupUserId')
    })

    it('does not alter the state on api error', async () => {
      const store = useGroupStore()
      const group = makeGroup({
        groupUsers: [makeGroupUser({ id: toGroupUserId('groupUserId') })],
        id: toGroupId('groupId'),
      })
      store.groups = [group]
      vi.mocked(groupService.removeUserFromGroup).mockRejectedValueOnce(
        new Error('API error'),
      )

      expect(store.groups[0].groupUsers).toHaveLength(1)
      expect(store.groups[0].groupUsers[0].id).toBe('groupUserId')

      await expect(
        store.removeGroupUser(
          toTenantId('tenantId'),
          toGroupId('groupId'),
          toGroupUserId('groupUserId'),
        ),
      ).rejects.toThrow()

      expect(store.groups[0].groupUsers).toHaveLength(1)
      expect(store.groups[0].groupUsers[0].id).toBe('groupUserId')
    })

    it('throws when group is not in the store', async () => {
      const store = useGroupStore()

      await expect(
        store.removeGroupUser(
          toTenantId('tenantId'),
          toGroupId('groupId'),
          toGroupUserId('groupUserId'),
        ),
      ).rejects.toThrow('Group with ID groupId not found')
    })

    it('handles removing a user id not present in groupUsers', async () => {
      const store = useGroupStore()
      const group = makeGroup({
        groupUsers: [makeGroupUser({ id: toGroupUserId('groupUserId') })],
        id: toGroupId('groupId'),
      })
      store.groups = [group]

      await store.removeGroupUser(
        toTenantId('tenantId'),
        toGroupId('groupId'),
        toGroupUserId('groupUserId2'),
      )

      expect(store.groups[0].groupUsers).toHaveLength(1)
      expect(store.groups[0].groupUsers[0].id).toBe('groupUserId')
    })
  })

  describe('updateGroupRoles', () => {
    it('calls the service with the updated group services', async () => {
      const store = useGroupStore()
      const services = [
        makeGroupService({
          id: toGroupServiceId('groupServiceId'),
          roles: [
            makeGroupServiceRole({
              id: toGroupServiceRoleId('groupServiceRoleId'),
              isEnabled: true,
            }),
          ],
        }),
      ]
      vi.mocked(serviceService.updateTenantGroupServiceRoles).mockResolvedValue(
        [],
      )

      await store.updateGroupRoles(
        toTenantId('tenantId'),
        toGroupId('groupId'),
        services,
      )

      expect(serviceService.updateTenantGroupServiceRoles).toHaveBeenCalledWith(
        toTenantId('tenantId'),
        toGroupId('groupId'),
        services,
      )
    })

    it('updates the store on success', async () => {
      const store = useGroupStore()
      const groupService = makeGroupService({
        id: toGroupServiceId('groupServiceId'),
      })
      const groupServiceApiData = makeServiceApiData({
        id: toServiceId('serviceId'),
      })
      vi.mocked(serviceService.updateTenantGroupServiceRoles).mockResolvedValue(
        [groupServiceApiData],
      )

      await store.updateGroupRoles(
        toTenantId('tenantId'),
        toGroupId('groupId'),
        [groupService],
      )

      expect(store.groupServices).toHaveLength(1)
      expect(store.groupServices[0].id).toBe('groupServiceId')
    })

    it('does not alter the state on api error', async () => {
      const store = useGroupStore()
      const groupService = makeGroupService({
        id: toGroupServiceId('groupServiceId'),
      })
      store.groupServices = [groupService]
      vi.mocked(
        serviceService.updateTenantGroupServiceRoles,
      ).mockRejectedValueOnce(new Error('API error'))

      await expect(
        store.updateGroupRoles(toTenantId('tenantId'), toGroupId('groupId'), [
          makeGroupService({ id: toGroupServiceId('groupServiceId2') }),
        ]),
      ).rejects.toThrow()

      expect(store.groupServices).toHaveLength(1)
      expect(store.groupServices[0].id).toBe('groupServiceId')
    })
  })
})
