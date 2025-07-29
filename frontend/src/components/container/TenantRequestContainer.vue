<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useNotification } from '@/composables'
import { useTenantRequestStore } from '@/stores'

const { notification } = useNotification()
const router = useRouter()
const tenantRequestStore = useTenantRequestStore()

const tenantRequests = computed(() => tenantRequestStore.tenantRequests)

const search = ref('')

// Component Lifecycle

onMounted(async () => {
  try {
    await tenantRequestStore.fetchTenantRequests()
  } catch {
    notification.error('Failed to load tenant request data')
  }
})

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'approved':
      return 'success'
    case 'denied':
      return 'error'
    case 'new':
    default:
      return 'info'
  }
}
</script>

<template>
  <v-container class="px-0" fluid>
    <v-row>
      <v-col cols="12">
        <h4 class="mb-6 mt-12">Tenant Requests</h4>
        <p class="mb-8">
          Click a row in the table to approve, deny, or to see more details.
        </p>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="4">
        <v-text-field
          v-model="search"
          append-inner-icon="mdi-magnify"
          label="Search"
          variant="outlined"
          clearable
          hide-details
          single-line
        ></v-text-field>
      </v-col>
    </v-row>

    <v-row
      ><v-col cols="12">
        <v-data-table
          :cell-props="
            ({ column }) => ({
              class: column.key === 'status' ? 'text-right' : 'text-left',
            })
          "
          :header-props="{
            class: 'text-body-1 font-weight-bold bg-surface-light',
          }"
          :headers="[
            {
              key: 'createdDate',
              title: 'Date of Request (YYYY-MM-DD)',
            },
            {
              key: 'createdBy',
              sortable: false,
              title: 'User Name (IDIR)',
            },
            {
              key: 'ministryName',
              title: 'Ministry / Organization',
            },
            {
              key: 'name',
              sortable: false,
              title: 'Requested Tenant Name',
            },
            {
              align: 'end',
              key: 'status',
              title: 'Status',
            },
          ]"
          :items="tenantRequests"
          :search="search"
          :sort-by="[{ key: 'createdDate' }]"
          item-value="id"
          striped="even"
          fixed-header
          hover
        >
          <template #no-data>
            <v-alert type="info">{{
              search
                ? 'No tenant requests match your search criteria'
                : 'There are no tenant requests'
            }}</v-alert>
          </template>
          <template #[`item.status`]="{ item }">
            <div
              class="d-flex flex-wrap justify-end"
              style="gap: 8px; margin-block: 4px"
            >
              <v-chip
                :color="getStatusColor(item.status)"
                class="d-inline-flex align-center"
              >
                {{ item.status }}
              </v-chip>
            </div>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>
