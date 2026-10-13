import { mount, VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type ComponentPublicInstance } from 'vue'

import router from '@/router'

vi.mock('@/components/route/GroupHeaderContainer.vue', () => ({
  default: { template: `<div>GroupHeaderContainer<router-view /></div>` },
}))
vi.mock('@/components/route/GroupListContainer.vue', () => ({
  default: { template: `<div>GroupListContainer</div>` },
}))
vi.mock('@/components/route/GroupMemberContainer.vue', () => ({
  default: { template: `<div>GroupMemberContainer</div>` },
}))
vi.mock('@/components/route/GroupRoleContainer.vue', () => ({
  default: { template: `<div>GroupRoleContainer</div>` },
}))
vi.mock('@/components/route/LandingPageBceidContainer.vue', () => ({
  default: { template: `<div>LandingPageBceidContainer</div>` },
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
vi.mock('@/components/route/TenantHeaderContainer.vue', () => ({
  default: { template: `<div>TenantHeaderContainer<router-view /></div>` },
}))
vi.mock('@/components/route/TenantListContainer.vue', () => ({
  default: { template: `<div>TenantListContainer</div>` },
}))
vi.mock('@/components/route/TenantServiceContainer.vue', () => ({
  default: { template: `<div>TenantServiceContainer</div>` },
}))
vi.mock('@/components/route/TenantUserContainer.vue', () => ({
  default: { template: `<div>TenantUserContainer</div>` },
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

  it('loads bceid landing page', async () => {
    await router.push('/bceid')
    await router.isReady()

    expect(wrapper.text()).toContain('LandingPageBceidContainer')
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

  it.each(['/settings/requests', '/settings/services', '/tenants'])(
    'navigates to unparameterized route %s',
    async (route) => {
      await router.push(route)
      await router.isReady()

      expect(router.currentRoute.value.path).toBe(route)
    },
  )

  it('navigates to tenant with params', async () => {
    await router.push('/tenants/123')
    await router.isReady()

    expect(router.currentRoute.value.params.tenantId).toBe('123')
    expect(wrapper.text()).toContain('TenantHeaderContainer')
  })

  it('navigates to tenant groups', async () => {
    await router.push('/tenants/123/groups')
    await router.isReady()

    expect(router.currentRoute.value.params.tenantId).toBe('123')
    expect(wrapper.text()).toContain('GroupListContainer')
  })

  it('navigates to group', async () => {
    await router.push('/tenants/123/groups/456')
    await router.isReady()

    expect(router.currentRoute.value.params.groupId).toBe('456')
    expect(router.currentRoute.value.params.tenantId).toBe('123')
    expect(wrapper.text()).toContain('GroupHeaderContainer')
  })

  it('navigates to group members', async () => {
    await router.push('/tenants/123/groups/456/members')
    await router.isReady()

    expect(router.currentRoute.value.params.groupId).toBe('456')
    expect(router.currentRoute.value.params.tenantId).toBe('123')
    expect(wrapper.text()).toContain('GroupMemberContainer')
  })

  it('navigates to group roles', async () => {
    await router.push('/tenants/123/groups/456/roles')
    await router.isReady()

    expect(router.currentRoute.value.params.groupId).toBe('456')
    expect(router.currentRoute.value.params.tenantId).toBe('123')
    expect(wrapper.text()).toContain('GroupRoleContainer')
  })

  it('navigates to tenant services', async () => {
    await router.push('/tenants/123/services')
    await router.isReady()

    expect(router.currentRoute.value.params.tenantId).toBe('123')
    expect(wrapper.text()).toContain('TenantServiceContainer')
  })

  it('navigates to tenant users', async () => {
    await router.push('/tenants/123/users')
    await router.isReady()

    expect(router.currentRoute.value.params.tenantId).toBe('123')
    expect(wrapper.text()).toContain('TenantUserContainer')
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
    expect(paths).toContain('/settings/requests')
    expect(paths).toContain('/settings/services')
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
