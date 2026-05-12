import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { User, type UserSearchApiData } from '@/models/user.model'
import { userService } from '@/services/user.service'
import { useUserStore } from '@/stores/useUserStore'

vi.mock('@/services/user.service', () => ({
  userService: {
    searchIdirEmail: vi.fn(),
    searchIdirFirstName: vi.fn(),
    searchIdirLastName: vi.fn(),
    searchBCeIDEmail: vi.fn(),
    searchBCeIDDisplayName: vi.fn(),
  },
}))

describe('useUserStore', () => {
  const mockSearchData: UserSearchApiData = {
    attributes: {
      idir_username: ['JDOE'],
      idir_user_guid: ['123-guid'],
    },
    email: 'john.doe@gov.bc.ca',
    firstName: 'John',
    lastName: 'Doe',
    username: 'jdoe',
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('IDIR Searches', () => {
    it('searchIdirEmail manages loading state and maps results', async () => {
      const store = useUserStore()
      vi.mocked(userService.searchIdirEmail).mockResolvedValue([mockSearchData])

      const promise = store.searchIdirEmail('john')
      expect(store.loading).toBe(true)

      const result = await promise
      expect(store.loading).toBe(false)
      expect(result[0]).toBeInstanceOf(User)
      expect(store.searchResults).toEqual(result)
    })

    it('searchIdirFirstName calls correct service', async () => {
      const store = useUserStore()
      vi.mocked(userService.searchIdirFirstName).mockResolvedValue([])

      await store.searchIdirFirstName('John')

      expect(userService.searchIdirFirstName).toHaveBeenCalledWith('John')
    })

    it('searchIdirLastName calls correct service', async () => {
      const store = useUserStore()
      vi.mocked(userService.searchIdirLastName).mockResolvedValue([])

      await store.searchIdirLastName('Doe')

      expect(userService.searchIdirLastName).toHaveBeenCalledWith('Doe')
    })
  })

  describe('BCeID Searches', () => {
    it('searchBCeIDEmail calls correct service and updates state', async () => {
      const store = useUserStore()
      vi.mocked(userService.searchBCeIDEmail).mockResolvedValue([
        mockSearchData,
      ])

      await store.searchBCeIDEmail('bob@example.com')

      expect(userService.searchBCeIDEmail).toHaveBeenCalledWith(
        'bob@example.com',
      )
      expect(store.searchResults).toHaveLength(1)
    })

    it('searchBCeIDDisplayName calls correct service', async () => {
      const store = useUserStore()
      vi.mocked(userService.searchBCeIDDisplayName).mockResolvedValue([])

      await store.searchBCeIDDisplayName('Bob')

      expect(userService.searchBCeIDDisplayName).toHaveBeenCalledWith('Bob')
    })
  })

  describe('Error Handling & Cleanup', () => {
    it('sets loading to false even if IDIR search fails', async () => {
      const store = useUserStore()
      vi.mocked(userService.searchIdirEmail).mockRejectedValue(
        new Error('Fail'),
      )

      await expect(store.searchIdirEmail('test')).rejects.toThrow('Fail')

      expect(store.loading).toBe(false)
    })

    it('sets loading to false even if BCeID search fails', async () => {
      const store = useUserStore()
      vi.mocked(userService.searchBCeIDEmail).mockRejectedValue(
        new Error('Fail'),
      )

      await expect(store.searchBCeIDEmail('test')).rejects.toThrow('Fail')

      expect(store.loading).toBe(false)
    })
  })
})
