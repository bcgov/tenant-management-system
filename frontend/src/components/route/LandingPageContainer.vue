<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

import { config } from '@/services/config.service'
import { useAuthStore } from '@/stores/useAuthStore'

// --- Store and Composable Setup ----------------------------------------------

const authStore = useAuthStore()
const router = useRouter()

// --- Computed Values ---------------------------------------------------------

const basicBceidHint = computed(() => config.basicBceidBroker)
const businessBceidHint = computed(() => config.businessBceidBroker)
const idirHint = computed(() => config.idirBroker)

// --- Watchers and Effects ----------------------------------------------------

watchEffect(() => {
  if (authStore.isAuthenticated) {
    if (authStore.authenticatedUser.ssoUser.idpType === 'IDIR') {
      router.push('/tenants')

      return
    }

    router.push('/bceid')
  }
})
</script>

<template>
  <v-container fluid>
    <div class="text-center my-3">
      <v-btn
        class="normal-case"
        color="primary"
        variant="flat"
        @click="authStore.login({ idpHint: idirHint })"
      >
        Log in with IDIR
      </v-btn>
    </div>
    <div class="text-center my-3">
      <v-btn
        class="normal-case"
        color="primary"
        variant="flat"
        @click="authStore.login({ idpHint: basicBceidHint })"
      >
        Login with Basic BCeID
      </v-btn>
    </div>
    <div class="text-center my-3">
      <v-btn
        class="normal-case"
        color="primary"
        variant="flat"
        @click="authStore.login({ idpHint: businessBceidHint })"
      >
        Login with Business BCeID
      </v-btn>
    </div>
  </v-container>
</template>

<style scoped>
.normal-case {
  text-transform: none;
}
</style>
