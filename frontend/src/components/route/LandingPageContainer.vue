<script setup lang="ts">
import { computed } from 'vue'
import { config, configLoaded } from '@/services/config.service'
import { useAuthStore } from '@/stores'

const authStore = useAuthStore()

console.log('config', config, config.idirBroker)
console.log('configLoaded', configLoaded.value)

const idirHint = computed(() => configLoaded.value ? config.idirBroker : '')
const basicBceidHint = computed(() => configLoaded.value ? config.basicBceidBroker : '')
const businessBceidHint = computed(() => configLoaded.value ? config.businessBceidBroker : '')

</script>

<template>
  <v-container fluid>
    <div class="text-center my-3">
      <v-btn 
        color="primary"
        variant="flat"
        class="normal-case"
        @click="authStore.login({ idpHint: idirHint })"
      >
        Log in with IDIR
      </v-btn>
    </div>
    <div class="text-center my-3">
      <v-btn 
        color="primary"
        variant="flat"
        class="normal-case"
        @click="authStore.login({ idpHint: basicBceidHint })"
      >
        Login with Basic BCeID
      </v-btn>
    </div>
    <div class="text-center my-3">
      <v-btn 
        color="primary"
        variant="flat"
        class="normal-case"
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