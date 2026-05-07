import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

import { makeTenant, makeUser } from '@/__tests__/__factories__'
import { createMockAuthStore } from '@/__tests__/__helpers__/useAuthStore.mock'
import {
  mockTenantRequestStore,
  mockTenantRequestStoreCreateTenantRequest,
  mockTenantRequestStoreError,
} from '@/__tests__/__helpers__/useTenantRequestStore.mock'
import {
  mockTenantStore,
  mockTenantStoreFetchError,
  mockTenantStoreFetchTenants,
} from '@/__tests__/__helpers__/useTenantStore.mock'

import TenantListContainer from '@/components/route/TenantListContainer.vue'
import { useNotification } from '@/composables/useNotification'
import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import vuetify from '@/plugins/vuetify'

let currentAuthStore = createMockAuthStore()

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => currentAuthStore,
}))

beforeEach(() => {
  currentAuthStore = createMockAuthStore()
  mockTenantRequestStore()
  mockTenantStore()
})

const mockError = vi.fn()
const mockSuccess = vi.fn()

vi.mock('@/composables/useNotification', () => ({
  useNotification: () => ({
    success: mockSuccess,
    error: mockError,
  }),
}))

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
})

const mountComponent = () =>
  mount(TenantListContainer, {
    global: {
      plugins: [createPinia(), router, vuetify],
      stubs: {
        LoginContainer: { template: '<div><slot /></div>' },
        LoadingWrapper: { template: '<div><slot /></div>' },
        TenantList: true,
        TenantRequestDialog: true,
        ButtonPrimary: true,
      },
    },
  })

// --- Tests -------------------------------------------------------------------

describe('TenantListContainer.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockTenantRequestStore()
    mockTenantStore()
  })

  describe('onMounted', () => {
    it('fetches tenants on mount', async () => {
      const user = makeUser()
      currentAuthStore = createMockAuthStore({ user })

      mountComponent()
      await flushPromises()

      expect(mockTenantStoreFetchTenants).toHaveBeenCalledWith(user.id)
    })

    it('shows an error notification if fetching tenants fails', async () => {
      mockTenantStoreFetchError(new Error('oops'))
      mountComponent()
      await flushPromises()

      expect(mockError).toHaveBeenCalledWith('Failed to fetch tenants')
    })
  })

  describe('navigation', () => {
    it('navigates to the tenant users page when a card is selected', async () => {
      mockTenantStore([makeTenant({ id: 'tenant-1' })])
      await router.isReady()
      const wrapper = mountComponent()
      await flushPromises()

      await wrapper
        .findComponent({ name: 'TenantList' })
        .vm.$emit('select', 'tenant-1')
      await flushPromises()

      expect(router.currentRoute.value.path).toBe('/tenants/tenant-1/users')
    })
  })

  describe('dialog', () => {
    it('opens the dialog when the button is clicked', async () => {
      const wrapper = mountComponent()

      await wrapper.findComponent({ name: 'ButtonPrimary' }).trigger('click')

      expect(
        wrapper
          .findComponent({ name: 'TenantRequestDialog' })
          .props('modelValue'),
      ).toBe(true)
    })

    it('submits a tenant request and closes the dialog', async () => {
      mockTenantRequestStore()
      const user = makeUser()
      currentAuthStore = createMockAuthStore({ user })
      const notification = useNotification()
      const wrapper = mountComponent()
      const details = { name: 'New Tenant', description: '', ministryName: '' }

      await wrapper
        .findComponent({ name: 'TenantRequestDialog' })
        .vm.$emit('submit', details)
      await flushPromises()

      expect(mockTenantRequestStoreCreateTenantRequest).toHaveBeenCalledWith(
        details,
        user,
      )
      expect(notification.success).toHaveBeenCalledWith(
        'Request successfully submitted',
      )
      expect(
        wrapper
          .findComponent({ name: 'TenantRequestDialog' })
          .props('modelValue'),
      ).toBe(false)
    })

    it('sets isDuplicateName when a DuplicateEntityError is thrown', async () => {
      mockTenantRequestStoreError(new DuplicateEntityError('oops'))
      const wrapper = mountComponent()
      const details = { name: 'Duplicate', description: '', ministryName: '' }

      await wrapper
        .findComponent({ name: 'TenantRequestDialog' })
        .vm.$emit('submit', details)
      await flushPromises()

      expect(
        wrapper
          .findComponent({ name: 'TenantRequestDialog' })
          .props('isDuplicateName'),
      ).toBe(true)
    })
  })
})
