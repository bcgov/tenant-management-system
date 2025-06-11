<script setup lang="ts">
import { ref } from 'vue'

import TenantUserManagement from '@/components/tenant/TenantUserManagement.vue'
import type { Role, Tenant } from '@/models'

defineProps<{
  disabled?: boolean
  roles?: Role[]
  tenant?: Tenant
}>()

const tab = ref<number>(0)
</script>

<template>
  <v-card elevation="0">
    <v-tabs v-model="tab" :mandatory="false" :disabled="disabled">
      <v-tab :value="0" class="pa-0 ma-0" style="min-width: 0px" />
      <v-tab :value="1">User Management</v-tab>
      <v-tab :value="2">Available Services</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item :value="0">
        <!--
          Vuetify insists that a tab is always active on page load. This
          invisible tab and content will be shown until the user selects one of
          the real tabs.
          https://stackoverflow.com/questions/58355920/vuetify-deselecting-v-tabs
         -->
      </v-window-item>

      <v-window-item :value="1">
        <TenantUserManagement :roles="roles" :tenant="tenant" />
      </v-window-item>

      <v-window-item :value="2">
        <v-container fluid>
          <v-row>
            <v-col cols="12">
              <p>Content for Available Services tab</p>
            </v-col>
          </v-row>
        </v-container>
      </v-window-item>
    </v-window>
  </v-card>
</template>
