<script setup lang="ts">
import {
  mdiAccountOutline,
  mdiCommentQuestionOutline,
  mdiLogout,
} from '@mdi/js'
import { computed } from 'vue'
import { useDisplay } from 'vuetify'

import { type User } from '@/models/user.model'
import { config } from '@/services/config.service'
import { useAuthStore } from '@/stores/useAuthStore'

// --- Store and Composable Setup ----------------------------------------------

const authStore = useAuthStore()

const { smAndUp, mdAndUp } = useDisplay()

// --- Component Interface -----------------------------------------------------

const { user } = defineProps<{
  user: User | null
}>()

// --- Component State ---------------------------------------------------------

const linkContactUs = config.link.contactUs

// --- Computed Values ---------------------------------------------------------

const title = computed(() => {
  if (mdAndUp.value) {
    return 'Connected Services, Team Access, and Roles (CSTAR)'
  }

  if (smAndUp.value) {
    return 'CSTAR'
  }

  return ''
})
</script>

<template>
  <v-app-bar class="px-4" elevation="1">
    <div class="d-flex align-center flex-grow-1">
      <router-link aria-label="C STAR Home" class="me-4 ms-1" to="/">
        <img alt="" height="56" src="/BCID_H_RGB_pos.svg" width="145" />
      </router-link>

      <span v-if="title" class="app-title">{{ title }}</span>
    </div>

    <div v-if="user" class="d-flex align-center user-info">
      <v-btn
        :href="linkContactUs"
        :icon="mdiCommentQuestionOutline"
        aria-label="Help - Contact Us"
        class="header-help-btn me-2"
        rel="noopener noreferrer"
        target="_blank"
        variant="text"
      />

      <v-menu>
        <template #activator="{ props: activatorProps }">
          <v-btn
            v-bind="activatorProps"
            :icon="mdiAccountOutline"
            aria-label="User menu"
            variant="text"
          />
        </template>

        <v-list>
          <v-list-item
            :prepend-icon="mdiAccountOutline"
            :title="user.getName()"
          />
          <v-divider />
          <v-list-item
            :prepend-icon="mdiLogout"
            title="Logout"
            @click="authStore.logout()"
          />
        </v-list>
      </v-menu>
    </div>
  </v-app-bar>
</template>

<style scoped>
a.header-help-btn,
a.header-help-btn:hover,
a.header-help-btn:focus-visible {
  color: rgb(var(--v-theme-on-background));
  text-decoration: none;
}

.app-title {
  font-weight: 500;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-info {
  flex-shrink: 0;
}
</style>
