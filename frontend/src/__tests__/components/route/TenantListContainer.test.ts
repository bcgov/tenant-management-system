import { flushPromises, mount } from '@vue/test-utils'
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
import { toTenantId } from '@/models/tenant.model'
import vuetify from '@/plugins/vuetify'
import { DomainError } from '@/errors/domain/DomainError'

let currentAuthStore = createMockAuthStore()

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => currentAuthStore,
}))

beforeEach(() => {
  currentAuthStore = createMockAuthStore()
  mockTenantRequestStore()
  mockTenantStore()
  vi.clearAllMocks()
})

const mockError = vi.fn()
const mockSuccess = vi.fn()

vi.mock('@/composables/useNotification', () => ({
  useNotification: () => ({
    success: mockSuccess,
    error: mockError,
  }),
}))

const buttonPrimaryStub = {
  emits: ['click'],
  name: 'ButtonPrimary',
  template: `
    <button @click="$emit('click')">
      Request a Tenant
    </button>
  `,
}

const tenantListStub = {
  emits: ['select'],
  name: 'TenantList',
  props: ['tenants'],
  template: `
    <div>
      <button @click="$emit('select', 'tenantId1')">
        tenant
      </button>
    </div>
  `,
}

const tenantRequestDialogStub = {
  emits: ['clear-duplicate-error', 'submit', 'update:modelValue'],
  name: 'TenantRequestDialog',
  props: ['isDuplicateName', 'modelValue'],
  template: `
    <div>
      <button @click="$emit('submit', {})">
        submit
      </button>
      <button @click="$emit('update:modelValue', false)">
        close
      </button>
      <button @click="$emit('clear-duplicate-error')">
        clear
      </button>
    </div>
  `,
}

const createTestRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/:pathMatch(.*)*',
        component: { template: '<div />' },
      },
    ],
  })

const mountComponent = () =>
  mount(TenantListContainer, {
    global: {
      plugins: [createTestRouter(), vuetify],
      stubs: {
        ButtonPrimary: buttonPrimaryStub,
        LoadingWrapper: { template: '<div><slot /></div>' },
        LoginContainer: { template: '<div><slot /></div>' },
        TenantList: tenantListStub,
        TenantRequestDialog: tenantRequestDialogStub,
      },
    },
  })

// --- Tests -------------------------------------------------------------------

describe('TenantListContainer.vue', () => {
  describe('onMounted', () => {
    it('fetches tenants on mount', async () => {
      const user = makeUser()
      currentAuthStore = createMockAuthStore({ user })

      mountComponent()
      await flushPromises()

      expect(mockTenantStoreFetchTenants).toHaveBeenCalledWith(
        user.ssoUser.ssoUserId,
      )
    })

    it('shows an error notification if fetching tenants fails', async () => {
      mockTenantStoreFetchError(new Error('message'))
      mountComponent()
      await flushPromises()

      expect(mockError).toHaveBeenCalledWith('Failed to load tenants')
    })
  })

  describe('navigation', () => {
    it('navigates to the tenant users page when a card is selected', async () => {
      mockTenantStore([makeTenant({ id: toTenantId('tenantId1') })])
      const wrapper = mountComponent()
      const router = wrapper.vm.$router
      await flushPromises()

      await wrapper
        .findComponent({ name: 'TenantList' })
        .vm.$emit('select', 'tenantId1')
      await flushPromises()

      expect(router.currentRoute.value.path).toBe('/tenants/tenantId1/users')
    })
  })

  describe('dialog', () => {
    it('opens the dialog when the button is clicked', async () => {
      const wrapper = mountComponent()

      await wrapper.findComponent({ name: 'ButtonPrimary' }).trigger('click')
      await flushPromises()

      expect(
        wrapper
          .findComponent({ name: 'TenantRequestDialog' })
          .props('modelValue'),
      ).toBe(true)
    })

    it('closes the dialog when update:modelValue is emitted', async () => {
      const wrapper = mountComponent()

      await wrapper.findComponent({ name: 'ButtonPrimary' }).trigger('click')
      await flushPromises()

      expect(
        wrapper
          .findComponent({ name: 'TenantRequestDialog' })
          .props('modelValue'),
      ).toBe(true)

      await wrapper
        .findComponent({ name: 'TenantRequestDialog' })
        .vm.$emit('update:modelValue', false)
      await flushPromises()

      expect(
        wrapper
          .findComponent({ name: 'TenantRequestDialog' })
          .props('modelValue'),
      ).toBe(false)
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
      const details = {
        description: 'description',
        ministryName: 'ministryName',
        name: 'name',
      }

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

    it('clears the duplicate name error when requested by the dialog', async () => {
      mockTenantRequestStoreError(new DuplicateEntityError('oops'))
      const wrapper = mountComponent()
      const details = {
        description: 'description',
        ministryName: 'ministryName',
        name: 'name',
      }

      await wrapper
        .findComponent({ name: 'TenantRequestDialog' })
        .vm.$emit('submit', details)
      await flushPromises()

      expect(
        wrapper
          .findComponent({ name: 'TenantRequestDialog' })
          .props('isDuplicateName'),
      ).toBe(true)

      await wrapper
        .findComponent({ name: 'TenantRequestDialog' })
        .vm.$emit('clear-duplicate-error')
      await flushPromises()

      expect(
        wrapper
          .findComponent({ name: 'TenantRequestDialog' })
          .props('isDuplicateName'),
      ).toBe(false)
    })

    it('shows an error notification on DomainError with userMessage', async () => {
      mockTenantRequestStoreError(new DomainError('message', 'userMessage'))
      const wrapper = mountComponent()
      const details = {
        description: 'description',
        ministryName: 'ministryName',
        name: 'name',
      }

      await wrapper
        .findComponent({ name: 'TenantRequestDialog' })
        .vm.$emit('submit', details)
      await flushPromises()

      expect(mockError).toHaveBeenCalledWith('userMessage')
    })

    it('shows an error notification on DomainError without userMessage', async () => {
      mockTenantRequestStoreError(new DomainError('message'))
      const wrapper = mountComponent()
      const details = {
        description: 'description',
        ministryName: 'ministryName',
        name: 'name',
      }

      await wrapper
        .findComponent({ name: 'TenantRequestDialog' })
        .vm.$emit('submit', details)
      await flushPromises()

      expect(mockError).toHaveBeenCalledWith('Failed to create the new tenant')
    })
  })
})
