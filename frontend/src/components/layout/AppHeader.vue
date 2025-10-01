<script setup lang="ts">
import type { User } from '@/models'

// --- Component Interface -----------------------------------------------------

defineProps<{
  user: User | null
}>()

/**
 * SonarQube rule S6598 triggers when there is a single emitter, and it suggests
 * using function type syntax rather than call signature syntax. However, the
 * Vue standard is to use call signature syntax. This intentional deviation from
 * the SonarQube rule is to be compatible with Vue's recommendation.
 *
 * @see https://vuejs.org/guide/typescript/composition-api.html#typing-component-emits
 */
const emit = defineEmits<{
  (event: 'logout'): void // NOSONAR: S6598
}>()

// --- Component Methods -------------------------------------------------------

function handleLogout() {
  emit('logout')
}
</script>

<template>
  <v-app-bar class="px-4" elevation="1" app>
    <v-toolbar-title class="flex-grow-1 d-flex align-center">
      <img alt="Logo" class="logo" src="/BCID_H_RGB_pos.svg" />
      <span class="app-title">Connected Service team Application (CSTAR)</span>
    </v-toolbar-title>

    <div v-if="user" class="d-flex align-center user-info">
      <v-icon icon="mdi-account-outline" size="large" />
      <span class="text-no-wrap ms-1 me-4">{{ user.ssoUser.displayName }}</span>
      <v-btn class="logout-btn" @click="handleLogout">
        <v-icon class="me-1" icon="mdi-logout" size="x-large" />
        Logout
      </v-btn>
    </div>
  </v-app-bar>
</template>

<style scoped>
.app-title {
  font-weight: 500;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logo {
  height: 60px;
  margin-right: 8px;
  vertical-align: middle;
}

.user-info {
  flex-shrink: 0;
}
</style>
