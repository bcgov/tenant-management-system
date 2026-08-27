import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { type UserSearchApiData } from '@/mappers/user.mapper'
import { User } from '@/models/user.model'
import { userSearchService } from '@/services/usersearch.service'
import { useUserSearchStore } from '@/stores/useUserSearchStore'

vi.mock('@/services/usersearch.service', () => ({
  userSearchService: {
    searchBCeIDDisplayName: vi.fn(),
    searchBCeIDEmail: vi.fn(),
    searchIdirEmail: vi.fn(),
    searchIdirFirstName: vi.fn(),
    searchIdirLastName: vi.fn(),
  },
}))

describe('useUserSearchStore', () => {
  const mockSearchData: UserSearchApiData = {
    attributes: {
      idir_username: ['JDOE'],
      idir_user_guid: ['123-guid'],
    },
    email: 'john.doe@gov.bc.ca',
    firstName: 'John',
    lastName: 'Doe',
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('IDIR Searches', () => {
    it('searchIdirEmail manages loading state and maps results', async () => {
      const store = useUserSearchStore()
      vi.mocked(userSearchService.searchIdirEmail).mockResolvedValue([
        mockSearchData,
      ])

      const promise = store.searchIdirEmail('john')

      const result = await promise
      expect(result[0]).toBeInstanceOf(User)
      expect(store.searchResults).toEqual(result)
    })

    it('searchIdirFirstName calls correct service', async () => {
      const store = useUserSearchStore()
      vi.mocked(userSearchService.searchIdirFirstName).mockResolvedValue([])

      await store.searchIdirFirstName('John')

      expect(userSearchService.searchIdirFirstName).toHaveBeenCalledWith('John')
    })

    it('searchIdirLastName calls correct service', async () => {
      const store = useUserSearchStore()
      vi.mocked(userSearchService.searchIdirLastName).mockResolvedValue([])

      await store.searchIdirLastName('Doe')

      expect(userSearchService.searchIdirLastName).toHaveBeenCalledWith('Doe')
    })
  })

  describe('BCeID Searches', () => {
    it('searchBCeIDEmail calls correct service and updates state', async () => {
      const store = useUserSearchStore()
      vi.mocked(userSearchService.searchBCeIDEmail).mockResolvedValue([
        mockSearchData,
      ])

      await store.searchBCeIDEmail('bob@example.com')

      expect(userSearchService.searchBCeIDEmail).toHaveBeenCalledWith(
        'bob@example.com',
      )
      expect(store.searchResults).toHaveLength(1)
    })

    it('searchBCeIDDisplayName calls correct service', async () => {
      const store = useUserSearchStore()
      vi.mocked(userSearchService.searchBCeIDDisplayName).mockResolvedValue([])

      await store.searchBCeIDDisplayName('Bob')

      expect(userSearchService.searchBCeIDDisplayName).toHaveBeenCalledWith(
        'Bob',
      )
    })
  })
})
