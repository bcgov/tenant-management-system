import { mount, VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type ComponentPublicInstance } from 'vue'
import { createMemoryHistory, type Router } from 'vue-router'

import { createAppRouter } from '@/router'
import { useAuthStore } from '@/stores/useAuthStore'
import { isIdpIdir } from '@/utils/identityProvider'
import {
  currentUserIsBceid,
  currentUserIsIdir,
  currentUserIsOperationsAdmin,
} from '@/utils/permissions'

vi.mock('@/stores/useAuthStore', () => ({ useAuthStore: vi.fn() }))
vi.mock('@/utils/identityProvider', () => ({ isIdpIdir: vi.fn() }))
vi.mock('@/utils/permissions', () => ({
  currentUserIsBceid: vi.fn(),
  currentUserIsIdir: vi.fn(),
  currentUserIsOperationsAdmin: vi.fn(),
}))

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
vi.mock('@/components/route/TenantUserDetailsContainer.vue', () => ({
  default: { template: `<div>TenantUserDetailsContainer</div>` },
}))

const TestApp = { template: '<router-view />' }

interface TestUser {
  admin?: boolean
  authenticated: boolean
  bceid?: boolean
  idir?: boolean
}

const ANONYMOUS: TestUser = { authenticated: false }
const IDIR_ADMIN: TestUser = { admin: true, authenticated: true, idir: true }

const setUser = (user: TestUser) => {
  vi.mocked(useAuthStore).mockReturnValue({
    authenticatedUser: { ssoUser: { idpType: 'test-idp' } },
    isAuthenticated: user.authenticated,
  } as unknown as ReturnType<typeof useAuthStore>)

  vi.mocked(isIdpIdir).mockReturnValue(!!user.idir)
  vi.mocked(currentUserIsBceid).mockReturnValue(!!user.bceid)
  vi.mocked(currentUserIsIdir).mockReturnValue(!!user.idir)
  vi.mocked(currentUserIsOperationsAdmin).mockReturnValue(!!user.admin)
}

const createTestRouter = () => createAppRouter(createMemoryHistory())

describe('Vue Router', () => {
  let wrapper: VueWrapper<ComponentPublicInstance>
  let router: Router

  beforeEach(async () => {
    vi.clearAllMocks()
    setUser(IDIR_ADMIN)

    router = createTestRouter()
    wrapper = mount(TestApp, { global: { plugins: [router] } })
    await router.push('/tenants')
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

  it('loads landing page for anonymous users', async () => {
    setUser(ANONYMOUS)

    await router.push('/')
    await router.isReady()

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

  it.each([
    ['/tenants/tenantId', { tenantId: 'tenantId' }, 'TenantHeaderContainer'],
    [
      '/tenants/tenantId/groups',
      { tenantId: 'tenantId' },
      'GroupListContainer',
    ],
    [
      '/tenants/tenantId/groups/groupId',
      { groupId: 'groupId', tenantId: 'tenantId' },
      'GroupHeaderContainer',
    ],
    [
      '/tenants/tenantId/groups/groupId/members',
      { groupId: 'groupId', tenantId: 'tenantId' },
      'GroupMemberContainer',
    ],
    [
      '/tenants/tenantId/groups/groupId/roles',
      { groupId: 'groupId', tenantId: 'tenantId' },
      'GroupRoleContainer',
    ],
    [
      '/tenants/tenantId/services',
      { tenantId: 'tenantId' },
      'TenantServiceContainer',
    ],
    [
      '/tenants/tenantId/users',
      { tenantId: 'tenantId' },
      'TenantUserContainer',
    ],
    [
      '/tenants/tenantId/users/userId',
      { tenantId: 'tenantId', userId: 'userId' },
      'TenantUserDetailsContainer',
    ],
  ])(
    'navigates to %s with params %o and renders %s',
    async (path, params, component) => {
      await router.push(path)
      await router.isReady()

      expect(router.currentRoute.value.params).toMatchObject(params)
      expect(wrapper.text()).toContain(component)
    },
  )

  it('redirects unknown routes to home', async () => {
    setUser(ANONYMOUS)

    await router.push('/this/does/not/exist')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/')
  })
})

describe('Route Configuration', () => {
  const router = createTestRouter()

  it('has correct route definitions', () => {
    const paths = router.getRoutes().map((route) => route.path)

    expect(paths).toContain('/')
    expect(paths).toContain('/settings')
    expect(paths).toContain('/settings/requests')
    expect(paths).toContain('/settings/services')
    expect(paths).toContain('/tenants')
    expect(paths).toContain('/tenants/:tenantId')
    expect(paths).toContain('/tenants/:tenantId/groups/:groupId')
    expect(paths).toContain('/tenants/:tenantId/users/:userId')
  })

  it('has props enabled for parameterized routes', () => {
    const routeList = router.getRoutes()
    const groupRoute = routeList.find(
      (r) => r.path === '/tenants/:tenantId/groups/:groupId',
    )
    const tenantRoute = routeList.find((r) => r.path === '/tenants/:tenantId')
    const tenantUserRoute = routeList.find(
      (r) => r.path === '/tenants/:tenantId/users/:userId',
    )

    expect(groupRoute?.props).toEqual({ default: true })
    expect(tenantRoute?.props).toEqual({ default: true })
    expect(tenantUserRoute?.props).toEqual({ default: true })
  })
})

describe('Router guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const cases: [string, string, string, TestUser][] = [
    ['anonymous', '/tenants', '/', ANONYMOUS],
    ['anonymous', '/settings', '/', ANONYMOUS],
    ['anonymous', '/bceid', '/bceid', ANONYMOUS],
    ['bceid', '/tenants', '/bceid', { authenticated: true, bceid: true }],
    ['bceid', '/', '/bceid', { authenticated: true, bceid: true }],
    ['idir', '/', '/tenants', { authenticated: true, idir: true }],
    ['idir', '/tenants', '/tenants', { authenticated: true, idir: true }],
    [
      'idir non-admin',
      '/settings',
      '/tenants',
      { authenticated: true, idir: true },
    ],
    ['idir admin', '/settings', '/settings/requests', IDIR_ADMIN],
  ]

  it.each(cases)('%s visiting %s ends at %s', async (_name, from, to, user) => {
    setUser(user)
    const router = createTestRouter()

    await router.push(from)

    expect(router.currentRoute.value.path).toBe(to)
  })
})
