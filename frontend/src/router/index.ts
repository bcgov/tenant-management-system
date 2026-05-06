import { i18n, loadLocaleMessages, setI18nLanguage } from '@/i18n'
import { createRouter, createWebHistory } from 'vue-router'

import GroupListContainer from '@/components/group/GroupListContainer.vue'
import GroupRoleContainer from '@/components/group/GroupRoleContainer.vue'
import GroupUserManagementContainer from '@/components/group/UserManagementContainer.vue'
import BCeidLandingContainer from '@/components/route/BCeidLandingContainer.vue'
import GroupManagementContainer from '@/components/route/GroupManagementContainer.vue'
import LandingPageContainer from '@/components/route/LandingPageContainer.vue'
import TenantListContainer from '@/components/route/TenantListContainer.vue'
import TenantRequestContainer from '@/components/tenantrequest/TenantRequestContainer.vue'
import TenantManagementContainer from '@/components/route/TenantManagementContainer.vue'
import ServiceManagementContainer from '@/components/service/ServiceManagementContainer.vue'
import SettingsServicesPlaceholder from '@/components/settings/SettingsServicesPlaceholder.vue'
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
        component: TenantRequestContainer,
      },
      {
        path: 'services',
        component: SettingsServicesPlaceholder,
      },
    ],
  },
  { path: '/tenants', component: TenantListContainer },
  {
    path: '/tenants/:tenantId',
    component: TenantManagementContainer,
    props: true,
    children: [
      {
        path: 'groups',
        component: GroupListContainer,
      },
      {
        path: 'groups/:groupId',
        component: GroupManagementContainer,
        children: [
          { path: 'members', component: GroupUserManagementContainer },
          { path: 'roles', component: GroupRoleContainer },
        ],
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
