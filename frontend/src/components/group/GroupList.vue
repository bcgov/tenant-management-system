<script setup lang="ts">
import { computed } from 'vue'

import GroupListCard from '@/components/group/GroupListCard.vue'
import { type Group } from '@/models/group.model'
import { type Tenant } from '@/models/tenant.model'

// --- Component Interface -----------------------------------------------------

const { groups, tenant } = defineProps<{
  groups: Group[]
  tenant: Tenant
}>()

// --- Computed Values ---------------------------------------------------------

const sortedGroups = computed(() => {
  return [...groups].sort((a, b) => a.name.localeCompare(b.name))
})
</script>

<template>
  <v-row>
    <v-col
      v-for="group in sortedGroups"
      :key="group.id"
      cols="12"
      lg="4"
      md="6"
    >
      <GroupListCard :group="group" :tenant="tenant" class="w-100" />
    </v-col>
  </v-row>
</template>
