import { i18n, loadLocaleMessages, setI18nLanguage } from '@/i18n'
import { createRouter, createWebHistory } from 'vue-router'

import GroupListContainer from '@/components/group/GroupListContainer.vue'
import GroupRoleContainer from '@/components/group/GroupRoleContainer.vue'
import GroupUserManagementContainer from '@/components/group/UserManagementContainer.vue'
import BCeidLandingContainer from '@/components/route/BCeidLandingContainer.vue'
import LandingPageContainer from '@/components/route/LandingPageContainer.vue'
import SettingsServiceContainer from '@/components/route/SettingsServiceContainer.vue'
import SettingsTenantRequestContainer from '@/components/route/SettingsTenantRequestContainer.vue'
import TenantContainer from '@/components/route/TenantContainer.vue'
import TenantListContainer from '@/components/route/TenantListContainer.vue'
import TenantGroupContainer from '@/components/route/TenantGroupContainer.vue'
import ServiceManagementContainer from '@/components/service/ServiceManagementContainer.vue'
import UserManagementContainer from '@/components/tenant/UserManagementContainer.vue'

const routes = [
  { path: '/', component: LandingPageContainer },
  { path: '/bceid', component: BCeidLandingContainer },
  {
    path: '/settings',
    redirect: '/settings/requests',
    children: [
      {
        path: 'requests',
        component: SettingsTenantRequestContainer,
      },
      {
        path: 'services',
        component: SettingsServiceContainer,
      },
    ],
  },
  { path: '/tenants', component: TenantListContainer },
  {
    path: '/tenants/:tenantId',
    component: TenantContainer,
    props: true,
    children: [
      {
        path: 'groups',
        component: GroupListContainer,
      },
      {
        path: 'groups/:groupId',
        component: TenantGroupContainer,
        children: [
          { path: 'members', component: GroupUserManagementContainer },
          { path: 'roles', component: GroupRoleContainer },
        ],
        props: true,
      },
      {
        path: 'services',
        component: ServiceManagementContainer,
      },
      {
        path: 'users',
        component: UserManagementContainer,
      },
    ],
  },
  { path: '/:catchAll(.*)', redirect: '/' },
]

const router = createRouter({
  // Use HTML5 history mode
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  const paramsLocale: string = (to.params.locale as string) ?? 'en'

  // load locale messages
  if (!i18n.global.availableLocales.includes(paramsLocale)) {
    await loadLocaleMessages(i18n, paramsLocale)
  }

  // set i18n language
  setI18nLanguage(i18n, paramsLocale)

  return next()
})

export default router
