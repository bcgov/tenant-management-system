<script setup lang="ts">
import {
  mdiAccountGroupOutline,
  mdiAccountLockOutline,
  mdiAccountOutline,
  mdiChevronLeft,
  mdiChevronRight,
  mdiCogOutline,
  mdiHomeCircleOutline,
  mdiHomePlusOutline,
  mdiPuzzleOutline,
  mdiShieldCheckOutline,
  mdiVectorRectangle,
} from '@mdi/js'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'

import {
  currentUserIsIdir,
  currentUserIsOperationsAdmin,
} from '@/utils/permissions'

// --- Store and Composable Setup ----------------------------------------------

const route = useRoute()
const { mobile } = useDisplay()

// --- Component State ---------------------------------------------------------

const railManual = ref<boolean | null>(null)

// --- Computed Values ---------------------------------------------------------

// Only administrators see the settings menu item.
const isAdministrator = computed(() => currentUserIsOperationsAdmin())

const isRouteGroup = computed(() => !!routeGroupId.value)
const isRouteSettings = computed(() => route.path.startsWith('/settings'))
const isRouteTenant = computed(() => !!routeTenantId.value)

const rail = computed(() => railManual.value ?? mobile.value)

const routeGroupId = computed(() => route.params.groupId)
const routeTenantId = computed(() => route.params.tenantId)

// Only show the drawer if the user is an IDIR user. Hide for not logged in or
// BCeID users.
const showDrawer = computed(() => currentUserIsIdir())

// --- Watchers and Effects ----------------------------------------------------

// If the display changes, clear the rail state for manual clicks.
watch(mobile, () => {
  railManual.value = null
})
</script>

<template>
  <v-navigation-drawer v-if="showDrawer" :rail="rail" permanent>
    <v-list nav>
      <v-list-item
        v-if="isAdministrator"
        :prepend-icon="mdiCogOutline"
        class="mt-2"
        title="Settings"
        to="/settings"
      />
      <template v-if="isRouteSettings">
        <v-divider class="my-2" />
        <v-list-item
          :class="{ 'pl-6': !rail }"
          :prepend-icon="mdiHomePlusOutline"
          title="Tenant Requests"
          to="/settings/requests"
        />
        <v-list-item
          :class="{ 'pl-6': !rail }"
          :prepend-icon="mdiPuzzleOutline"
          title="Services"
          to="/settings/services"
        />
      </template>

      <v-divider v-if="isAdministrator" class="my-2" />

      <v-list-item
        :prepend-icon="mdiHomeCircleOutline"
        title="All Tenants"
        to="/tenants"
      />

      <template v-if="isRouteTenant">
        <v-divider />
        <v-list-item
          :class="{ 'pl-6': !rail }"
          :prepend-icon="mdiAccountOutline"
          :to="`/tenants/${routeTenantId}/users`"
          title="Tenant Users"
        />
        <v-list-item
          :class="{ 'pl-6': !rail }"
          :prepend-icon="mdiAccountGroupOutline"
          :to="`/tenants/${routeTenantId}/groups`"
          title="Groups"
        />
        <template v-if="isRouteGroup">
          <v-list-item
            :class="{ 'pl-10': !rail }"
            :prepend-icon="mdiAccountLockOutline"
            :to="`/tenants/${routeTenantId}/groups/${routeGroupId}/members`"
            title="Members"
          />
          <v-list-item
            :class="{ 'pl-10': !rail }"
            :prepend-icon="mdiShieldCheckOutline"
            :to="`/tenants/${routeTenantId}/groups/${routeGroupId}/roles`"
            title="Service Roles"
          />
        </template>
        <v-list-item
          :class="{ 'pl-6': !rail }"
          :prepend-icon="mdiVectorRectangle"
          :to="`/tenants/${routeTenantId}/services`"
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
</template>
