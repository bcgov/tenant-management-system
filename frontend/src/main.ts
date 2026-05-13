import '@bcgov/design-tokens/css-prefixed/variables.css'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from '@/App.vue'
import '@/assets/styles/global.css'
import { useNotification } from '@/composables/useNotification'
import { i18n } from '@/i18n'
import vuetify from '@/plugins/vuetify'
import router from '@/router'
import { ConfigError, loadConfig } from '@/services/config.service'
import { useAuthStore } from '@/stores/useAuthStore'
import { logger } from '@/utils/logger'

export async function initializeApp() {
  await loadConfig()

  const app = createApp(App)

  app.use(createPinia())
  app.use(router)
  app.use(vuetify)
  app.use(i18n)

  app.config.errorHandler = (error) => {
    // Log the error for debugging, as it could be something unexpected like a
    // change in what the API is returning.
    logger.error('Application Error', error)

    // Display a notification to the user.
    const notification = useNotification()
    notification.error('An unexpected error occurred')
  }

  const authStore = useAuthStore()
  await authStore.init()

  // User action causes a check of the JWT expiry, and a refresh when needed.
  globalThis.addEventListener('click', () => authStore.ensureFreshToken())
  globalThis.addEventListener('keydown', () => authStore.ensureFreshToken())

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

try {
  await initializeApp()
} catch (error) {
  handleInitError(error)
}
