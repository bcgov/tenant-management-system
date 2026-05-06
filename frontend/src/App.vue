<script setup lang="ts">
import {
  mdiAccountGroupOutline,
  mdiAccountKeyOutline,
  mdiAccountOutline,
  mdiChevronLeft,
  mdiChevronRight,
  mdiClipboardList,
  mdiCogOutline,
  mdiDomain,
  mdiPuzzle,
  mdiShieldAccountOutline,
  mdiVectorRectangle,
} from '@mdi/js'
import { computed, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useRoute } from 'vue-router'

import AppHeader from '@/components/layout/AppHeader.vue'
import AppNotifications from '@/components/layout/AppNotifications.vue'
import LandingPageContainer from '@/components/route/LandingPageContainer.vue'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  currentUserIsIdir,
  currentUserIsOperationsAdmin,
} from '@/utils/permissions'

// --- Store and Composable Setup ----------------------------------------------

const authStore = useAuthStore()
const route = useRoute()
const { mobile } = useDisplay()

// --- Component State ---------------------------------------------------------

const rail = computed(() => railManual.value ?? mobile.value)

const railManual = ref<boolean | null>(null)

// --- Computed Values ---------------------------------------------------------

const groupId = computed(() => route.params.groupId)

const isAdministrator = computed(() => currentUserIsOperationsAdmin())

const isGroupRoute = computed(() => !!groupId.value)

const isSettingsRoute = computed(() => route.path.startsWith('/settings'))

const isTenantRoute = computed(() => !!tenantId.value)

const loggedOut = computed(() => authStore.isSessionExpired)

const showDrawer = computed(() => currentUserIsIdir())

const tenantId = computed(() => route.params.tenantId)

const user = computed(() => {
  return authStore.isAuthenticated ? authStore.authenticatedUser : null
})

watch(mobile, () => {
  railManual.value = null
})
</script>

<template>
  <v-app>
    <AppNotifications />
    <AppHeader :user="user" />

    <v-navigation-drawer v-if="showDrawer" :rail="rail" permanent>
      <v-list nav>
        <v-list-item
          v-if="isAdministrator"
          :prepend-icon="mdiCogOutline"
          class="mt-2"
          title="Settings"
          to="/settings"
        />
        <template v-if="isSettingsRoute">
          <v-divider class="my-2" />
          <v-list-item
            :prepend-icon="mdiClipboardList"
            title="Tenant Requests"
            to="/settings/requests"
          />
          <v-list-item
            :prepend-icon="mdiPuzzle"
            title="Services"
            to="/settings/services"
          />
        </template>

        <v-divider v-if="isAdministrator" class="my-2" />

        <v-list-item
          :prepend-icon="mdiDomain"
          title="All Tenants"
          to="/tenants"
        />

        <template v-if="isTenantRoute">
          <v-divider />
          <v-list-item
            :class="{ 'pl-6': !rail }"
            :prepend-icon="mdiAccountOutline"
            :to="`/tenants/${tenantId}/users`"
            title="Tenant Users"
          />
          <v-list-item
            :class="{ 'pl-6': !rail }"
            :prepend-icon="mdiAccountGroupOutline"
            :to="`/tenants/${tenantId}/groups`"
            title="Groups"
          />
          <template v-if="isGroupRoute">
            <v-list-item
              :class="{ 'pl-10': !rail }"
              :prepend-icon="mdiAccountKeyOutline"
              :to="`/tenants/${tenantId}/groups/${groupId}/members`"
              title="Members"
            />
            <v-list-item
              :class="{ 'pl-10': !rail }"
              :prepend-icon="mdiShieldAccountOutline"
              :to="`/tenants/${tenantId}/groups/${groupId}/roles`"
              title="Service Roles"
            />
          </template>
          <v-list-item
            :class="{ 'pl-6': !rail }"
            :prepend-icon="mdiVectorRectangle"
            :to="`/tenants/${tenantId}/services`"
            title="Connected Services"
          />
        </template>
      </v-list>
      <template #append>
        <v-list-item
          :prepend-icon="rail ? mdiChevronRight : mdiChevronLeft"
          @click="railManual = !rail"
        />
      </template>
    </v-navigation-drawer>

    <v-main>
      <v-container class="fluid mt-10 px-12">
        <div v-if="loggedOut" class="my-3 text-center">
          <h2>{{ $t('general.sessionExpired') }}</h2>
          <p>{{ $t('general.sessionExpiredDesc') }}</p>
          <LandingPageContainer />
        </div>

        <!-- Router view for dynamic component rendering -->
        <router-view v-else />
      </v-container>
    </v-main>
  </v-app>
</template>
