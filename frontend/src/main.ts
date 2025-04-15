import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import vuetify from '@/plugins/vuetify'
import App from '@/App.vue'
import router from '@/router'
import consolePlugin from '@/plugins/console'
import { initKeycloak } from '@/services/keycloak'

import BaseSecure from '@/components/BaseSecure.vue'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)
app.use(consolePlugin)
app.component('BaseSecure', BaseSecure)

// Initialize Keycloak and mount the app once authenticated
initKeycloak(() => {
  app.mount('#app')
})
