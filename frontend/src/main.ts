import '@mdi/font/css/materialdesignicons.css'

import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from '@/App.vue'
import BaseSecure from '@/components/BaseSecure.vue'
import vuetify from '@/plugins/vuetify'
import router from '@/router'
import { useAuthStore } from '@/stores/useAuthStore'
import { loadConfig, configLoaded } from './services/config.service'
import { logger } from '@/utils/logger'

// Helper function to wait until a condition is met
function waitUntil(condition: () => boolean, interval = 100): Promise<void> {
  return new Promise<void>((resolve) => {
    const check = () => {
      if (condition()) {
        resolve()
      } else {
        setTimeout(check, interval)
      }
    }
    check()
  })
}

async function initializeApp() {
  logger.info('Starting application initialization...')

  // Create app and pinia first so we can use the store
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(router)
  app.use(vuetify)
  app.component('BaseSecure', BaseSecure)

  const authStore = useAuthStore()

  try {
    // Step 1: Load configuration
    logger.info('Starting configuration loading...')
    loadConfig().catch((error) => {
      logger.error('Initial config loading attempt failed:', error)
    })

    // Wait for config to load with a timeout
    const configTimeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Configuration loading timed out after 15 seconds'))
      }, 15000)
    })

    await Promise.race([
      waitUntil(() => configLoaded.value),
      configTimeoutPromise,
    ])

    logger.info('Configuration loaded successfully')

    // Step 2: Initialize Keycloak
    logger.info('Initializing Keycloak...')
    await authStore.initKeycloak()
    logger.info('Keycloak initialized successfully')

    // Step 3: Mount the app
    logger.info('Mounting the application')
    app.mount('#app')
  } catch (error) {
    logger.error('Application initialization failed:', error)

    // Show appropriate error message based on where it failed
    let errorMessage = 'An unexpected error occurred'
    let errorTitle = 'Application Error'

    if (error instanceof Error) {
      if (error.message.includes('Configuration loading timed out')) {
        errorTitle = 'Configuration Error'
        errorMessage =
          'The application configuration is taking too long to load.'
      } else if (error.message.includes('Keycloak')) {
        errorTitle = 'Authentication Error'
        errorMessage =
          'There was a problem connecting to the authentication service.'
      }
    }

    document.body.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h2>${errorTitle}</h2>
        <p>${errorMessage}</p>
        <p>Please try refreshing the page or contact support if the problem persists.</p>
        <button onclick="window.location.reload()">Refresh</button>
      </div>
    `
  }
}

// Start the app initialization
initializeApp()
