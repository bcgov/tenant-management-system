// router.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import type { ComponentPublicInstance } from 'vue'
import router from '@/router' // adjust path as needed

// Mock the components since we're testing routes, not component functionality
vi.mock('@/components/route/GroupManagementContainer.vue', () => ({
  default: { template: '<div>GroupManagementContainer</div>' },
}))
vi.mock('@/components/route/SettingsContainer.vue', () => ({
  default: { template: '<div>SettingsContainer</div>' },
}))
vi.mock('@/components/route/TenantListContainer.vue', () => ({
  default: { template: '<div>TenantListContainer</div>' },
}))
vi.mock('@/components/route/TenantManagementContainer.vue', () => ({
  default: { template: '<div>TenantManagementContainer</div>' },
}))

// Create a test app component
const TestApp = {
  template: '<router-view />',
}

describe('Vue Router', () => {
  let wrapper: VueWrapper<ComponentPublicInstance> | null = null

  beforeEach(() => {
    // Reset router state before each test
    router.push('/')
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
      wrapper = null
    }
  })

  it('redirects from root path to /tenants', async () => {
    wrapper = mount(TestApp, {
      global: {
        plugins: [router],
      },
    })

    await router.push('/')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/tenants')
  })

  it('navigates to settings route', async () => {
    wrapper = mount(TestApp, {
      global: {
        plugins: [router],
      },
    })

    await router.push('/settings')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/settings')
    expect(wrapper.text()).toContain('SettingsContainer')
  })

  it('navigates to tenants list route', async () => {
    wrapper = mount(TestApp, {
      global: {
        plugins: [router],
      },
    })

    await router.push('/tenants')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/tenants')
    expect(wrapper.text()).toContain('TenantListContainer')
  })

  it('navigates to tenant management route with params', async () => {
    wrapper = mount(TestApp, {
      global: {
        plugins: [router],
      },
    })

    const tenantId = '123'
    await router.push(`/tenants/${tenantId}`)
    await router.isReady()

    expect(router.currentRoute.value.path).toBe(`/tenants/${tenantId}`)
    expect(router.currentRoute.value.params.tenantId).toBe(tenantId)
    expect(wrapper.text()).toContain('TenantManagementContainer')
  })

  it('navigates to group management route with params', async () => {
    wrapper = mount(TestApp, {
      global: {
        plugins: [router],
      },
    })

    const tenantId = '123'
    const groupId = '456'
    await router.push(`/tenants/${tenantId}/groups/${groupId}`)
    await router.isReady()

    expect(router.currentRoute.value.path).toBe(
      `/tenants/${tenantId}/groups/${groupId}`,
    )
    expect(router.currentRoute.value.params.tenantId).toBe(tenantId)
    expect(router.currentRoute.value.params.groupId).toBe(groupId)
    expect(wrapper.text()).toContain('GroupManagementContainer')
  })

  it('passes props correctly to components', async () => {
    // Test that props: true works correctly
    const TestComponent = {
      props: ['tenantId', 'groupId'],
      template: '<div>{{ tenantId }}-{{ groupId }}</div>',
    }

    // Create a test router with our test component
    const testRouter = createRouter({
      history: createWebHistory(),
      routes: [
        {
          path: '/tenants/:tenantId/groups/:groupId',
          component: TestComponent,
          props: true,
        },
      ],
    })

    wrapper = mount(TestApp, {
      global: {
        plugins: [testRouter],
      },
    })

    await testRouter.push('/tenants/123/groups/456')
    await testRouter.isReady()

    expect(wrapper.text()).toContain('123-456')
  })
})

// Alternative approach: Testing route configuration directly
describe('Route Configuration', () => {
  it('has correct route definitions', () => {
    const routes = router.getRoutes()

    // Check that all expected routes exist
    const paths = routes.map((route) => route.path)
    expect(paths).toContain('/')
    expect(paths).toContain('/settings')
    expect(paths).toContain('/tenants')
    expect(paths).toContain('/tenants/:tenantId')
    expect(paths).toContain('/tenants/:tenantId/groups/:groupId')
  })

  it('has redirect configured correctly', () => {
    const rootRoute = router.getRoutes().find((route) => route.path === '/')
    expect(rootRoute?.redirect).toBe('/tenants')
  })

  it('has props enabled for parameterized routes', () => {
    const tenantRoute = router
      .getRoutes()
      .find((route) => route.path === '/tenants/:tenantId')
    const groupRoute = router
      .getRoutes()
      .find((route) => route.path === '/tenants/:tenantId/groups/:groupId')

    // Vue Router transforms props: true into { default: true }
    expect(tenantRoute?.props).toEqual({ default: true })
    expect(groupRoute?.props).toEqual({ default: true })
  })
})

// Integration test approach
describe('Router Integration', () => {
  let wrapper: VueWrapper<ComponentPublicInstance> | null = null

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
      wrapper = null
    }
  })

  it('handles navigation flow correctly', async () => {
    wrapper = mount(TestApp, {
      global: {
        plugins: [router],
      },
    })

    // Start at root, should redirect to tenants
    await router.push('/')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/tenants')

    // Navigate to a specific tenant
    await router.push('/tenants/123')
    await router.isReady()
    expect(router.currentRoute.value.params.tenantId).toBe('123')

    // Navigate to group management
    await router.push('/tenants/123/groups/456')
    await router.isReady()
    expect(router.currentRoute.value.params).toEqual({
      tenantId: '123',
      groupId: '456',
    })

    // Navigate to settings
    await router.push('/settings')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/settings')
  })
})
