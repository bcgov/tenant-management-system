import { i18n, loadLocaleMessages, setI18nLanguage } from '@/i18n'
import { createRouter, createWebHistory } from 'vue-router'

import BCeidLandingContainer from '@/components/route/BCeidLandingContainer.vue'
import GroupManagementContainer from '@/components/route/GroupManagementContainer.vue'
import LandingPageContainer from '@/components/route/LandingPageContainer.vue'
import SettingsContainer from '@/components/route/SettingsContainer.vue'
import TenantListContainer from '@/components/route/TenantListContainer.vue'
import TenantManagementContainer from '@/components/route/TenantManagementContainer.vue'

const routes = [
  { path: '/', component: LandingPageContainer },
  { path: '/bceid', component: BCeidLandingContainer },
  { path: '/settings', component: SettingsContainer },
  { path: '/tenants', component: TenantListContainer },
  {
    path: '/tenants/:tenantId',
    component: TenantManagementContainer,
    props: true,
  },
  {
    path: '/tenants/:tenantId/groups/:groupId',
    component: GroupManagementContainer,
    props: true,
  },
  { path: '/:catchAll(.*)', redirect: '/' },
]

const router = createRouter({
  // Use HTML5 history mode
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
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
