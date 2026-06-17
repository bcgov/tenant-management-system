<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import AppHeader from '@/components/layout/AppHeader.vue'
import AppNavigation from '@/components/layout/AppNavigation.vue'
import AppNotifications from '@/components/layout/AppNotifications.vue'
import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import { config } from '@/services/config.service'
import { useAuthStore } from '@/stores/useAuthStore'

// --- Store and Composable Setup ----------------------------------------------

const authStore = useAuthStore()
const route = useRoute()

// --- Computed Values ---------------------------------------------------------

const hintBceidBusiness = computed(() => config.oidc.hintBceidBusiness)
const hintIdir = computed(() => config.oidc.hintIdir)

const loggedOut = computed(() => authStore.isSessionExpired)

const user = computed(() => {
  return authStore.isAuthenticated ? authStore.authenticatedUser : null
})
</script>

<template>
  <v-app>
    <AppNotifications />
    <AppHeader :user="user" />
    <AppNavigation />

    <v-main>
      <v-container>
        <div v-if="loggedOut" class="my-3 text-center">
          <h1>{{ $t('general.sessionExpired') }}</h1>

          <p class="p-xlarge">
            {{ $t('general.sessionExpiredDesc') }}<br />
            {{ $t('general.sessionExpiredDesc2') }}
          </p>

          <v-row class="justify-center mt-12">
            <v-col class="d-flex flex-column ga-6" cols="12" md="4" sm="6">
              <ButtonPrimary
                data-testid="buttonIdir"
                text="Log in with IDIR"
                @click="authStore.login({ idpHint: hintIdir })"
              />
              <ButtonPrimary
                data-testid="buttonBceidBusiness"
                text="Log in with Business BCeID"
                @click="authStore.login({ idpHint: hintBceidBusiness })"
              />
            </v-col>
          </v-row>
        </div>

        <!-- Router view for dynamic component rendering -->
        <router-view v-else :key="route.fullPath" />
      </v-container>
    </v-main>
  </v-app>
</template>
