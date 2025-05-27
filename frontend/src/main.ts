import '@mdi/font/css/materialdesignicons.css'

import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from '@/App.vue'
import BaseSecure from '@/components/BaseSecure.vue'
import vuetify from '@/plugins/vuetify'
import router from '@/router'
import { initKeycloak } from '@/services/keycloak'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)
app.component('BaseSecure', BaseSecure)

initKeycloak()
  .then(() => {
    app.mount('#app')
  })
  .catch((error) => {
    console.error('App init failed due to Keycloak:', error)
    // TODO: what does this look like to the user? Notification?
  })
