<script setup lang="ts">
import {
  mdiAccountCircleOutline,
  mdiAccountMultipleOutline,
  mdiCalendarMonthOutline,
  mdiKeyOutline,
  mdiVectorPolyline,
} from '@mdi/js'
import { computed } from 'vue'

import StatBlock from '@/components/ui/StatBlock.vue'
import { type Group } from '@/models/group.model'
import { type Tenant } from '@/models/tenant.model'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  group: Group
  groupEnabledServiceCount: number
  groupEnabledServiceRoleCount: number
  tenant: Tenant
}>()
// --- Computed Values ---------------------------------------------------------

const groupMembersCount = computed(() => props.group.groupUsers.length)
</script>

<template>
  <v-sheet class="px-10 py-8">
    <pre class="description p-small">{{ group.description }}</pre>

    <v-divider class="my-6" />

    <v-row class="align-center" style="column-gap: 8rem">
      <v-col cols="12" md="3">
        <StatBlock
          :icon="mdiCalendarMonthOutline"
          :value="group.createdDate"
          label="Date Created"
        />
      </v-col>
      <v-col cols="12" md="3">
        <StatBlock
          :icon="mdiAccountCircleOutline"
          :value="group.createdBy"
          label="Created By"
        />
      </v-col>
    </v-row>

    <v-row class="align-center" style="column-gap: 8rem">
      <v-col cols="12" md="3">
        <StatBlock
          :icon="mdiAccountMultipleOutline"
          :value="groupMembersCount"
          label="Members"
        />
      </v-col>
      <v-col cols="12" md="3">
        <StatBlock
          :icon="mdiKeyOutline"
          :value="groupEnabledServiceRoleCount"
          label="Roles"
        />
      </v-col>
      <v-col cols="12" md="3">
        <StatBlock
          :icon="mdiVectorPolyline"
          :value="groupEnabledServiceCount"
          label="Enabled Services"
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
