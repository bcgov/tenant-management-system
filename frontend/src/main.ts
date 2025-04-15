import '@mdi/font/css/materialdesignicons.css';

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from '@/App.vue'
import BaseSecure from '@/components/BaseSecure.vue'
import consolePlugin from '@/plugins/console'
import notificationService from '@/services/notification';
import vuetify from '@/plugins/vuetify'
import router from '@/router'
import { initKeycloak } from '@/services/keycloak'

const app = createApp(App)

app.provide('notificationService', notificationService)

app.use(createPinia())
app.use(router)
app.use(vuetify)
app.use(consolePlugin)
app.component('BaseSecure', BaseSecure)

// Initialize Keycloak and mount the app once authenticated
initKeycloak(() => {
  app.mount('#app')
})
