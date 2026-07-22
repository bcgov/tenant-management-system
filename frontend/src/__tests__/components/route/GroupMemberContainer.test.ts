import { fireEvent, render, screen } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import {
  makeGroup,
  makeSsoUser,
  makeTenant,
  makeUser,
} from '@/__tests__/__factories__'

import GroupMemberContainer from '@/components/route/GroupMemberContainer.vue'
import { useNotification } from '@/composables/useNotification'
import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import { toGroupId } from '@/models/group.model'
import { toTenantId } from '@/models/tenant.model'
import { toUserId, User } from '@/models/user.model'
import { useGroupStore } from '@/stores/useGroupStore'
import { useUserStore } from '@/stores/useUserStore'
import { IDIR_SEARCH_TYPE } from '@/utils/constants'

vi.mock('@/composables/useNotification', () => ({
  useNotification: vi.fn(),
}))

function makeGroupMemberManagementStub({
  addUser = makeUser({ id: toUserId('u1') }),
  duplicateUser = makeUser({
    ssoUser: makeSsoUser({ displayName: 'displayName' }),
  }),
} = {}) {
  return {
    emits: ['add', 'delete', 'search', 'clear-search', 'cancel'],
    name: 'GroupMemberManagement',
    props: ['group', 'tenant', 'loadingSearch', 'searchResults'],
    setup() {
      return { addUser, duplicateUser, IDIR_SEARCH_TYPE }
    },
    template: `
      <div>
        <div data-testid="loading-search">{{ String(loadingSearch) }}</div>
        <div data-testid="search-results-count">
          {{ searchResults === null ? 'null' : searchResults.length }}
        </div>
        <button @click="$emit('add', addUser)">stub-add</button>
        <button @click="$emit('add', duplicateUser)">stub-add-duplicate</button>
        <button @click="$emit('delete', 'gu1')">stub-delete</button>
        <button
          @click="$emit('search', IDIR_SEARCH_TYPE.FIRST_NAME.value, 'firstName')"
        >
          stub-search-first-name
        </button>
        <button
          @click="$emit('search', IDIR_SEARCH_TYPE.LAST_NAME.value, 'lastName')"
        >
          stub-search-last-name
        </button>
        <button
          @click="$emit('search', IDIR_SEARCH_TYPE.EMAIL.value,
          'firstName.lastName@gov.bc.ca')"
        >
          stub-search-email
        </button>
        <button @click="$emit('search', 'invalidSearch', 'invalidSearch')">
          stub-invalid-search
        </button>
        <button @click="$emit('clear-search')">stub-clear-search</button>
        <button @click="$emit('cancel')">stub-cancel</button>
      </div>
    `,
  }
}

function renderComponent(
  groupId = toGroupId('g1'),
  tenantId = toTenantId('t1'),
  stubOptions: {
    addUser?: User
    duplicateUser?: User
  } = {},
) {
  return render(GroupMemberContainer, {
    global: {
      stubs: {
        GroupMemberManagement: makeGroupMemberManagementStub(stubOptions),
      },
    },
    props: { groupId, tenantId },
  })
}

describe('GroupMemberContainer', () => {
  let groupStore: ReturnType<typeof useGroupStore>
  let notificationMock: ReturnType<typeof useNotification>
  let userStore: ReturnType<typeof useUserStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    groupStore = useGroupStore()
    notificationMock = {
      error: vi.fn(),
      info: vi.fn(),
      items: [],
      remove: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
    }
    vi.mocked(useNotification).mockReturnValue(notificationMock)
    userStore = useUserStore()
  })

  describe('handleAddMember', () => {
    it('calls addGroupUser, clears searchResults, and shows success notification', async () => {
      const addUser = makeUser({ id: toUserId('u1') })
      const group = makeGroup({ id: toGroupId('g1') })
      const tenant = makeTenant({ id: toTenantId('t1') })
      groupStore.addGroupUser = vi.fn().mockResolvedValue(undefined)

      renderComponent(group.id, tenant.id)
      await fireEvent.click(screen.getByRole('button', { name: 'stub-add' }))

      expect(groupStore.addGroupUser).toHaveBeenCalledWith(
        tenant.id,
        group.id,
        addUser,
      )
      expect(notificationMock.success).toHaveBeenCalledWith(
        'New member successfully added to this group',
        'Member Added',
      )
      expect(screen.getByTestId('search-results-count')).toHaveTextContent(
        'null',
      )
    })

    it('shows duplicate error notification and clears results on DuplicateEntityError', async () => {
      const duplicateUser = makeUser({
        ssoUser: makeSsoUser({ displayName: 'displayName2' }),
      })
      groupStore.addGroupUser = vi
        .fn()
        .mockRejectedValue(new DuplicateEntityError())

      renderComponent(undefined, undefined, { duplicateUser })
      await fireEvent.click(
        screen.getByRole('button', { name: 'stub-add-duplicate' }),
      )

      expect(notificationMock.error).toHaveBeenCalledWith(
        expect.stringContaining('displayName2'),
      )
      expect(screen.getByTestId('search-results-count')).toHaveTextContent(
        'null',
      )
    })

    it('shows generic error notification on unexpected error', async () => {
      groupStore.addGroupUser = vi
        .fn()
        .mockRejectedValue(new Error('unexpected'))

      renderComponent()
      await fireEvent.click(screen.getByRole('button', { name: 'stub-add' }))

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to add member to group',
      )
    })
  })

  describe('handleClearSearch', () => {
    it('sets searchResults to null', async () => {
      renderComponent()
      await fireEvent.click(
        screen.getByRole('button', { name: 'stub-clear-search' }),
      )

      expect(screen.getByTestId('search-results-count')).toHaveTextContent(
        'null',
      )
    })
  })

  describe('handleDeleteMember', () => {
    it('calls removeGroupUser and shows success notification', async () => {
      const group = makeGroup({ id: toGroupId('g1') })
      const tenant = makeTenant({ id: toTenantId('t1') })
      groupStore.removeGroupUser = vi.fn().mockResolvedValue(undefined)

      renderComponent(group.id, tenant.id)

      await fireEvent.click(screen.getByRole('button', { name: 'stub-delete' }))

      expect(groupStore.removeGroupUser).toHaveBeenCalledWith('t1', 'g1', 'gu1')
      expect(notificationMock.success).toHaveBeenCalledWith(
        'Member successfully removed from this group',
        'Member Removed',
      )
    })

    it('shows error notification when removeGroupMember fails', async () => {
      groupStore.removeGroupUser = vi.fn().mockRejectedValue(new Error('fail'))

      renderComponent()

      await fireEvent.click(screen.getByRole('button', { name: 'stub-delete' }))

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to remove member from group',
      )
    })
  })

  describe('handleUserSearch', () => {
    beforeEach(() => {
      userStore.searchIdirFirstName = vi
        .fn()
        .mockResolvedValue([makeUser({ id: toUserId('idirFirstName') })])
      userStore.searchIdirLastName = vi
        .fn()
        .mockResolvedValue([makeUser({ id: toUserId('idirLastName') })])
      userStore.searchIdirEmail = vi
        .fn()
        .mockResolvedValue([makeUser({ id: toUserId('idirEmail') })])
      userStore.searchBCeIDDisplayName = vi
        .fn()
        .mockResolvedValue([makeUser({ id: toUserId('BCeIDDisplayName') })])
      userStore.searchBCeIDEmail = vi
        .fn()
        .mockResolvedValue([makeUser({ id: toUserId('BCeIDEmail') })])
    })

    it('searches by first name and concatenates BCeID display name results', async () => {
      renderComponent()
      await fireEvent.click(
        screen.getByRole('button', { name: 'stub-search-first-name' }),
      )
      await nextTick()

      expect(userStore.searchIdirFirstName).toHaveBeenCalledWith('firstName')
      expect(userStore.searchBCeIDDisplayName).toHaveBeenCalledWith('firstName')
      expect(screen.getByTestId('search-results-count')).toHaveTextContent('2')
    })

    it('searches by last name and concatenates BCeID display name results', async () => {
      renderComponent()

      await fireEvent.click(
        screen.getByRole('button', { name: 'stub-search-last-name' }),
      )
      await nextTick()

      expect(userStore.searchIdirLastName).toHaveBeenCalledWith('lastName')
      expect(userStore.searchBCeIDDisplayName).toHaveBeenCalledWith('lastName')
      expect(screen.getByTestId('search-results-count')).toHaveTextContent('2')
    })

    it('searches by email and concatenates BCeID email results', async () => {
      renderComponent()
      await fireEvent.click(
        screen.getByRole('button', { name: 'stub-search-email' }),
      )
      await nextTick()

      expect(userStore.searchIdirEmail).toHaveBeenCalledWith(
        'firstName.lastName@gov.bc.ca',
      )
      expect(userStore.searchBCeIDEmail).toHaveBeenCalledWith(
        'firstName.lastName@gov.bc.ca',
      )
      expect(screen.getByTestId('search-results-count')).toHaveTextContent('2')
    })

    it('throws when search type is invalid', async () => {
      renderComponent()
      await fireEvent.click(
        screen.getByRole('button', { name: 'stub-invalid-search' }),
      )
      await nextTick()

      expect(notificationMock.error).toHaveBeenCalledWith('User search failed')
      expect(screen.getByTestId('search-results-count')).toHaveTextContent(
        'null',
      )
    })

    it('shows error and nulls results when search throws', async () => {
      userStore.searchIdirFirstName = vi
        .fn()
        .mockRejectedValue(new Error('network'))

      renderComponent()
      await fireEvent.click(
        screen.getByRole('button', { name: 'stub-search-first-name' }),
      )
      await nextTick()

      expect(notificationMock.error).toHaveBeenCalledWith('User search failed')
      expect(screen.getByTestId('search-results-count')).toHaveTextContent(
        'null',
      )
    })

    it('resets isLoadingSearch to false after search completes', async () => {
      renderComponent()
      await fireEvent.click(
        screen.getByRole('button', { name: 'stub-search-email' }),
      )
      await nextTick()

      expect(screen.getByTestId('loading-search')).toHaveTextContent('false')
    })

    it('resets isLoadingSearch to false even when search throws', async () => {
      userStore.searchIdirEmail = vi.fn().mockRejectedValue(new Error('fail'))

      renderComponent()
      await fireEvent.click(
        screen.getByRole('button', { name: 'stub-search-email' }),
      )
      await nextTick()

      expect(screen.getByTestId('loading-search')).toHaveTextContent('false')
    })
  })

  it('sets searchResults to null on cancel', async () => {
    userStore.searchIdirEmail = vi
      .fn()
      .mockResolvedValue([makeUser({ id: toUserId('a') })])
    userStore.searchBCeIDEmail = vi
      .fn()
      .mockResolvedValue([makeUser({ id: toUserId('b') })])

    renderComponent()
    await fireEvent.click(
      screen.getByRole('button', { name: 'stub-search-email' }),
    )
    await nextTick()

    expect(screen.getByTestId('search-results-count')).toHaveTextContent('2')

    await fireEvent.click(screen.getByRole('button', { name: 'stub-cancel' }))

    expect(screen.getByTestId('search-results-count')).toHaveTextContent('null')
  })
})
