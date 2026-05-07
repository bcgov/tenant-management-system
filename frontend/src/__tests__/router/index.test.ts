import { mount, VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type ComponentPublicInstance } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import { i18n, loadLocaleMessages, setI18nLanguage } from '@/i18n'
import router from '@/router'

vi.mock('@/i18n', () => ({
  i18n: {
    global: {
      availableLocales: [] as string[],
    },
  },
  loadLocaleMessages: vi.fn().mockResolvedValue(undefined),
  setI18nLanguage: vi.fn(),
}))

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
vi.mock('@/components/route/TenantListContainer.vue', () => ({
  default: { template: `<div>TenantListContainer</div>` },
}))
vi.mock('@/components/route/TenantGroupContainer.vue', () => ({
  default: { template: `<div>TenantGroupContainer</div>` },
}))
vi.mock('@/components/service/ServiceManagementContainer.vue', () => ({
  default: { template: `<div>ServiceManagementContainer</div>` },
}))
vi.mock('@/components/tenant/UserManagementContainer.vue', () => ({
  default: { template: `<div>UserManagementContainer</div>` },
}))

const LANDING_PAGE_TEMPLATE = 'LandingPageContainer'
const TENANT_LIST_TEMPLATE = 'TenantListContainer'
const TENANT_TEMPLATE = 'TenantContainer'
const TENANT_GROUP_TEMPLATE = 'TenantGroupContainer'

const TestApp = {
  template: '<router-view />',
}

const initWrapper = function () {
  return mount(TestApp, {
    global: {
      plugins: [router],
    },
  })
}

describe('Vue Router', () => {
  let wrapper: VueWrapper<ComponentPublicInstance> | null = null

  beforeEach(() => {
    router.push('/')
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
      wrapper = null
    }
  })

  it('loads landing page', async () => {
    wrapper = initWrapper()

    await router.push('/')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/')
    expect(wrapper.text()).toContain(LANDING_PAGE_TEMPLATE)
  })

  it('navigates to settings default route', async () => {
    wrapper = initWrapper()

    await router.push('/settings')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/settings/requests')
  })

  it('navigates to settings/requests route', async () => {
    wrapper = initWrapper()

    await router.push('/settings/requests')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/settings/requests')
  })

  it('navigates to tenants list route', async () => {
    wrapper = initWrapper()

    await router.push('/tenants')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/tenants')
    expect(wrapper.text()).toContain(TENANT_LIST_TEMPLATE)
  })

  it('navigates to tenant management route with params', async () => {
    wrapper = initWrapper()
    const tenantId = '123'

    await router.push(`/tenants/${tenantId}`)
    await router.isReady()

    expect(router.currentRoute.value.path).toBe(`/tenants/${tenantId}`)
    expect(router.currentRoute.value.params.tenantId).toBe(tenantId)
    expect(wrapper.text()).toContain(TENANT_TEMPLATE)
  })

  it('navigates to group management route with params', async () => {
    wrapper = initWrapper()
    const tenantId = '123'
    const groupId = '456'

    await router.push(`/tenants/${tenantId}/groups/${groupId}`)
    await router.isReady()

    expect(router.currentRoute.value.path).toBe(
      `/tenants/${tenantId}/groups/${groupId}`,
    )
    expect(router.currentRoute.value.params.tenantId).toBe(tenantId)
    expect(router.currentRoute.value.params.groupId).toBe(groupId)
    expect(wrapper.text()).toContain(TENANT_GROUP_TEMPLATE)
  })

  it('passes props correctly to components', async () => {
    const TestComponent = {
      props: ['tenantId', 'groupId'],
      template: '<div>{{ tenantId }}-{{ groupId }}</div>',
    }

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

describe('Route Configuration', () => {
  it('has correct route definitions', () => {
    const routes = router.getRoutes()

    const paths = routes.map((route) => route.path)
    expect(paths).toContain('/')
    expect(paths).toContain('/settings')
    expect(paths).toContain('/tenants')
    expect(paths).toContain('/tenants/:tenantId')
    expect(paths).toContain('/tenants/:tenantId/groups/:groupId')
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

    await router.push('/')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/')

    await router.push('/tenants/123')
    await router.isReady()
    expect(router.currentRoute.value.params.tenantId).toBe('123')

    await router.push('/tenants/123/groups/456')
    await router.isReady()
    expect(router.currentRoute.value.params).toEqual({
      tenantId: '123',
      groupId: '456',
    })

    await router.push('/settings')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/settings/requests')
  })
})

describe('Router beforeEach guard for i18n', () => {
  const availableLocales = i18n.global.availableLocales

  beforeEach(async () => {
    availableLocales.length = 0
    vi.mocked(loadLocaleMessages).mockClear()
    vi.mocked(setI18nLanguage).mockClear()
    await router.push('/')
    await router.isReady()
    vi.mocked(loadLocaleMessages).mockClear()
    vi.mocked(setI18nLanguage).mockClear()
  })

  it('calls loadLocaleMessages when the locale is not yet available', async () => {
    await router.push('/settings')
    await router.isReady()

    expect(loadLocaleMessages).toHaveBeenCalledWith(i18n, 'en')
    expect(setI18nLanguage).toHaveBeenCalledWith(i18n, 'en')
  })

  it('skips loadLocaleMessages when the locale is already available', async () => {
    availableLocales.push('en')

    await router.push('/settings')
    await router.isReady()

    expect(loadLocaleMessages).not.toHaveBeenCalled()
    expect(setI18nLanguage).toHaveBeenCalled()
  })

  it('always calls setI18nLanguage regardless of whether locale was loaded', async () => {
    availableLocales.push('en')

    await router.push('/tenants')
    await router.isReady()

    expect(setI18nLanguage).toHaveBeenCalledTimes(1)
  })

  it('awaits loadLocaleMessages before calling setI18nLanguage', async () => {
    const callOrder: string[] = []

    vi.mocked(loadLocaleMessages).mockImplementation(async () => {
      callOrder.push('loadLocaleMessages')
    })
    vi.mocked(setI18nLanguage).mockImplementation(() => {
      callOrder.push('setI18nLanguage')
    })

    await router.push('/settings')
    await router.isReady()

    expect(callOrder).toEqual(['loadLocaleMessages', 'setI18nLanguage'])
  })
})
