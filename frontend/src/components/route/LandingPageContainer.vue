<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

import { config } from '@/services/config.service'
import { useAuthStore } from '@/stores/useAuthStore'

const authStore = useAuthStore()
const router = useRouter()

const idirHint = computed(() => config.idirBroker)
const basicBceidHint = computed(() => config.basicBceidBroker)
const businessBceidHint = computed(() => config.businessBceidBroker)

watchEffect(() => {
  if (authStore.isAuthenticated) {
    if (authStore.userSource === 'IDIR') {
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
