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

const props = defineProps<{
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
  (newPath, oldPath) => {
    if (newPath !== oldPath) {
      showDetail.value = false
    }
  },
)

// --- Computed Values ---------------------------------------------------------

const tenantGroupsCount = computed(() => props.groups.length)
const tenantUsersCount = computed(() => props.tenant.users.length)
</script>

<template>
  <template v-if="!route.params.groupId">
    <v-sheet
      class="px-10 py-4"
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

  <router-view :tenant="tenant" />
</template>

<style scoped>
.description {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.text-stack p {
  margin: 0;
}
</style>
