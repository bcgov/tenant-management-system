<script setup lang="ts">
import {
  mdiAccountCircleOutline,
  mdiAccountGroupOutline,
  mdiAccountMultipleOutline,
  mdiCalendarMonthOutline,
  mdiChevronDown,
  mdiChevronUp,
} from '@mdi/js'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import StatBlock from '@/components/ui/StatBlock.vue'
import { type Group } from '@/models/group.model'
import { type Tenant } from '@/models/tenant.model'

// --- Component Interface -----------------------------------------------------

const { groups, tenant } = defineProps<{
  groups: Group[]
  tenant: Tenant
}>()

// --- Store and Composable Setup ----------------------------------------------

const route = useRoute()

// --- Component State ---------------------------------------------------------

const showDetail = ref(false)

// --- Watchers and Effects ----------------------------------------------------

// Hide the detail view when the user clicks a different navigation item.
watch(
  () => route.path,
  () => {
    showDetail.value = false
  },
)

// --- Computed Values ---------------------------------------------------------

const tenantGroupsCount = computed(() => groups.length)
const tenantUsersCount = computed(() => tenant.users.length)
</script>

<template>
  <v-sheet
    class="mt-12 px-10 py-4"
    color="surface-light-gray"
    @click="showDetail = !showDetail"
  >
    <v-row class="align-center">
      <v-col>
        <hgroup class="text-stack">
          <p class="p-large">{{ tenant.name }}</p>
          <p class="p-label">{{ tenant.ministryName }}</p>
        </hgroup>
      </v-col>
      <v-col cols="auto">
        <v-btn
          :aria-expanded="showDetail"
          :aria-label="
            showDetail ? 'Collapse tenant details' : 'Expand tenant details'
          "
          :icon="showDetail ? mdiChevronUp : mdiChevronDown"
          rounded="lg"
          size="small"
          variant="plain"
        />
      </v-col>
    </v-row>
  </v-sheet>

  <v-sheet v-if="showDetail" class="px-10 py-8">
    <pre class="description p-small">{{ tenant.description }}</pre>

    <v-divider class="my-6" />

    <v-row class="align-center">
      <v-col cols="12" md="3">
        <StatBlock
          :icon="mdiCalendarMonthOutline"
          :value="tenant.createdDate"
          label="Date Created"
        />
      </v-col>
      <v-col cols="12" md="9">
        <StatBlock
          :icon="mdiAccountCircleOutline"
          :value="tenant.createdBy"
          label="Created By"
        />
      </v-col>
    </v-row>

    <v-row class="align-center">
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
  overflow-wrap: break-word;
  white-space: pre-wrap;
}

.text-stack p {
  margin: 0;
}
</style>
