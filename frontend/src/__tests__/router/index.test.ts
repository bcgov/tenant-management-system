import { mount, VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type ComponentPublicInstance } from 'vue'

import router from '@/router'

vi.mock('@/components/group/GroupListContainer.vue', () => ({
  default: { template: `<div>GroupListContainer</div>` },
}))
vi.mock('@/components/group/GroupRoleContainer.vue', () => ({
  default: { template: `<div>GroupRoleContainer</div>` },
}))
vi.mock('@/components/group/UserManagementContainer.vue', () => ({
  default: { template: `<div>GroupUserManagementContainer</div>` },
}))
vi.mock('@/components/route/BCeidLandingContainer.vue', () => ({
  default: { template: `<div>BCeidLandingContainer</div>` },
}))
vi.mock('@/components/route/LandingPageContainer.vue', () => ({
  default: { template: `<div>LandingPageContainer</div>` },
}))
vi.mock('@/components/route/SettingsServiceContainer.vue', () => ({
  default: { template: `<div>SettingsServiceContainer</div>` },
}))
vi.mock('@/components/route/SettingsTenantRequestContainer.vue', () => ({
  default: { template: `<div>SettingsTenantRequestContainer</div>` },
}))
vi.mock('@/components/route/TenantContainer.vue', () => ({
  default: { template: `<div>TenantContainer<router-view /></div>` },
}))
vi.mock('@/components/route/TenantGroupContainer.vue', () => ({
  default: { template: `<div>TenantGroupContainer</div>` },
}))
vi.mock('@/components/route/TenantListContainer.vue', () => ({
  default: { template: `<div>TenantListContainer</div>` },
}))
vi.mock('@/components/service/ServiceManagementContainer.vue', () => ({
  default: { template: `<div>ServiceManagementContainer</div>` },
}))
vi.mock('@/components/tenant/UserManagementContainer.vue', () => ({
  default: { template: `<div>UserManagementContainer</div>` },
}))

const TestApp = { template: '<router-view />' }

describe('Vue Router', () => {
  let wrapper: VueWrapper<ComponentPublicInstance>

  beforeEach(async () => {
    wrapper = mount(TestApp, { global: { plugins: [router] } })
    await router.push('/')
    await router.isReady()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('loads landing page', async () => {
    expect(router.currentRoute.value.path).toBe('/')
    expect(wrapper.text()).toContain('LandingPageContainer')
  })

  it('redirects settings to settings/requests', async () => {
    await router.push('/settings')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/settings/requests')
  })

  it('navigates to tenants list', async () => {
    await router.push('/tenants')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/tenants')
    expect(wrapper.text()).toContain('TenantListContainer')
  })

  it('navigates to tenant with params', async () => {
    await router.push('/tenants/123')
    await router.isReady()

    expect(router.currentRoute.value.params.tenantId).toBe('123')
    expect(wrapper.text()).toContain('TenantContainer')
  })

  it('navigates to group with params', async () => {
    await router.push('/tenants/123/groups/456')
    await router.isReady()

    expect(router.currentRoute.value.params.tenantId).toBe('123')
    expect(router.currentRoute.value.params.groupId).toBe('456')
    expect(wrapper.text()).toContain('TenantGroupContainer')
  })

  it('redirects unknown routes to home', async () => {
    await router.push('/this/does/not/exist')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/')
  })
})

describe('Route Configuration', () => {
  it('has correct route definitions', () => {
    const paths = router.getRoutes().map((route) => route.path)

    expect(paths).toContain('/')
    expect(paths).toContain('/settings')
    expect(paths).toContain('/tenants')
    expect(paths).toContain('/tenants/:tenantId')
    expect(paths).toContain('/tenants/:tenantId/groups/:groupId')
  })

  it('has props enabled for parameterized routes', () => {
    const routes = router.getRoutes()
    const tenantRoute = routes.find((r) => r.path === '/tenants/:tenantId')
    const groupRoute = routes.find(
      (r) => r.path === '/tenants/:tenantId/groups/:groupId',
    )

    // Vue Router transforms props: true into { default: true }
    expect(tenantRoute?.props).toEqual({ default: true })
    expect(groupRoute?.props).toEqual({ default: true })
  })
})
