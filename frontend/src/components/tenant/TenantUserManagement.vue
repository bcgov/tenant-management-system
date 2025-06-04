<script setup lang="ts">
import { ref } from 'vue'

import type { Tenant } from '@/models/tenant.model'

defineProps<{
  tenant?: Tenant
}>()

const loadingSearchResults = ref(false)
const searchOption = ref('firstName')
const searchText = ref('')
const searchResults = ref([])
const selectedUser = ref(null)
const selectedRole = ref('')
</script>

<template>
  <v-container fluid class="px-0">
    <v-row>
      <v-col cols="12">
        <v-data-table
          :items="tenant?.users || []"
          item-value="id"
          :headers="[
            { title: 'Name', key: 'displayName', align: 'start' },
            { title: 'Roles', key: 'roles', align: 'start' },
            { title: 'Email', key: 'email', align: 'start' },
          ]"
          hover
          fixed-header
          :header-props="{
            class: 'text-body-1 font-weight-bold bg-surface-light',
          }"
        >
          <template #no-data>
            <v-alert type="info">You have no users in this tenant.</v-alert>
          </template>
          <template #item.roles="{ item }">
            <v-chip
              v-for="role in item.roles"
              :key="role.id"
              color="primary"
              class="mr-2"
            >
              {{ role.name }}
            </v-chip>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
    <v-divider />
    <!-- User search table -->
  </v-container>
</template>

<style scoped>
:deep(.v-data-table-footer) {
  background-color: rgb(var(--v-theme-surface-light));
}
</style>
