import '@bcgov/design-tokens/css-prefixed/variables.css'

import '@/assets/styles/global.css'

import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from '@/App.vue'
import vuetify from '@/plugins/vuetify'
import router from '@/router'
import { i18n } from '@/i18n'
import { useAuthStore } from '@/stores/useAuthStore'
import { ConfigError, loadConfig } from './services/config.service'
import { logger } from '@/utils/logger'

export async function initializeApp() {
  logger.info('Starting application initialization...')

  await loadConfig()
  logger.info('Configuration loaded successfully')

  // Create app and pinia first so we can use the store
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(router)
  app.use(vuetify)
  app.use(i18n)

  const authStore = useAuthStore()

  await authStore.initKeycloak()
  logger.info('Keycloak initialized successfully')

  app.mount('#app')
}

export function handleInitError(error: unknown) {
  logger.error('Application initialization failed', error)

  // Show appropriate error message based on where it failed
  let errorMessage = 'An unexpected error occurred'
  let errorTitle = 'Application Error'

  if (error instanceof ConfigError) {
    errorTitle = 'Configuration Error'
    errorMessage = 'The application configuration could not be loaded'
  } else if (error instanceof Error && error.message.includes('Keycloak')) {
    errorTitle = 'Authentication Error'
    errorMessage =
      'There was a problem connecting to the authentication service.'
  }

  document.body.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h2>${errorTitle}</h2>
        <p>${errorMessage}</p>
        <p>
          Please try refreshing the page or contact support if the problem
          persists.
        </p>
        <button onclick="window.location.reload()">Refresh</button>
      </div>
    `
}

// Start the app initialization unless running the unit tests.
if (import.meta.env.MODE !== 'test') {
  try {
    await initializeApp()
  } catch (error) {
    handleInitError(error)
  }
}
