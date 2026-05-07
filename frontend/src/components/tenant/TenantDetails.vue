<script setup lang="ts">
import {
  mdiAccountCircleOutline,
  mdiAccountGroupOutline,
  mdiAccountMultipleOutline,
  mdiCalendarMonthOutline,
} from '@mdi/js'
import { computed } from 'vue'

import StatBlock from '@/components/ui/StatBlock.vue'
import { type Group } from '@/models/group.model'
import { type Tenant } from '@/models/tenant.model'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  groups: Group[]
  tenant: Tenant
}>()

// --- Computed Values ---------------------------------------------------------

const tenantGroupsCount = computed(() => props.groups.length)

const tenantUsersCount = computed(() => props.tenant.users.length)
</script>

<template>
  <v-sheet class="px-10 py-8">
    <pre class="description p-small">{{ tenant.description }}</pre>

    <v-divider class="my-6" />

    <v-row class="align-center" style="column-gap: 8rem">
      <v-col cols="12" md="3">
        <StatBlock
          :icon="mdiCalendarMonthOutline"
          :value="tenant.createdDate"
          label="Date Created"
        />
      </v-col>
      <v-col cols="12" md="3">
        <StatBlock
          :icon="mdiAccountCircleOutline"
          :value="tenant.createdBy"
          label="Created By"
        />
      </v-col>
    </v-row>

    <v-row class="align-center" style="column-gap: 8rem">
      <v-col cols="12" md="3">
        <StatBlock
          :icon="mdiAccountMultipleOutline"
          :value="tenantUsersCount"
          label="Users"
        />
      </v-col>
      <v-col cols="12" md="3">
        <StatBlock
          :icon="mdiAccountGroupOutline"
          :value="tenantGroupsCount"
          label="Groups"
        />
      </v-col>
    </v-row>
  </v-sheet>
</template>

<style scoped>
.description {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
