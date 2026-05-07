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

const tenantUsersCount = computed(() => props.tenant.users.length)

const tenantGroupsCount = computed(() => props.groups.length)
</script>

<template>
  <v-sheet class="px-10 py-4">
    <v-row>
      <v-col cols="12" md="3">
        <pre class="p-small">{{ tenant.description }}</pre>
      </v-col>
    </v-row>

    <v-row class="align-center" style="column-gap: 8rem">
      <v-col cols="12" md="3">
        <StatBlock
          :icon="mdiCalendarMonthOutline"
          :value="tenant.createdDate"
          label="Date created"
        />
      </v-col>
      <v-col cols="12" md="3">
        <StatBlock
          :icon="mdiAccountCircleOutline"
          :value="tenant.createdBy"
          label="Created by"
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
