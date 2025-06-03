import '@mdi/font/css/materialdesignicons.css'

import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from '@/App.vue'
import BaseSecure from '@/components/BaseSecure.vue'
import vuetify from '@/plugins/vuetify'
import router from '@/router'
import { useAuthStore } from '@/stores/useAuthStore'
import { loadConfig } from './services/config.service'

async function initializeApp() {
  await loadConfig();

  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia)
  app.use(router)
  app.use(vuetify)
  app.component('BaseSecure', BaseSecure)

  const authStore = useAuthStore()

  authStore
    .initKeycloak()
    .then(() => {
      app.mount('#app')
    })
    .catch((error) => {
      console.error('App init failed due to Keycloak: ', error)
      // TODO: what does this look like to the user? Notification?
    })
}

initializeApp().catch((error) => {
  console.error('App initialization failed: ', error);
});