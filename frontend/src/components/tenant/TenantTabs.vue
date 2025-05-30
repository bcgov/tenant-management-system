<script setup lang="ts">
import { ref } from 'vue'
import type { Tenant } from '@/models/tenant.model'
import TenantUserManagement from '@/components/tenant/TenantUserManagement.vue'

defineProps<{
  tenant?: Tenant
}>()

const tab = ref(1)
</script>

<template>
  <v-card>
    <v-tabs v-model="tab">
      <v-tab :value="1">Project Information</v-tab>
      <v-tab :value="2">User Management</v-tab>
      <v-tab :value="3">Available Services</v-tab>
    </v-tabs>

    <v-tabs-window v-model="tab">
      <v-tabs-window-item :value="1">
        <v-container fluid>
          <v-row>
            <v-col cols="12">
              <p>Content for Project Information tab</p>
            </v-col>
          </v-row>
        </v-container>
      </v-tabs-window-item>

      <v-tabs-window-item :value="2">
        <TenantUserManagement :tenant="tenant" />
      </v-tabs-window-item>

      <v-tabs-window-item :value="3">
        <v-container fluid>
          <v-row>
            <v-col cols="12">
              <p>Content for Available Services tab</p>
            </v-col>
          </v-row>
        </v-container>
      </v-tabs-window-item>
    </v-tabs-window>
  </v-card>
</template>
