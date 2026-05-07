<script setup lang="ts">
import {
  mdiAccountCircleOutline,
  mdiAccountMultipleOutline,
  mdiCalendarMonthOutline,
  mdiChevronDown,
  mdiChevronUp,
  mdiKeyOutline,
  mdiVectorPolyline,
} from '@mdi/js'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import StatBlock from '@/components/ui/StatBlock.vue'
import { type Group } from '@/models/group.model'
import { type Tenant } from '@/models/tenant.model'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  enabledRolesCount: number
  enabledServiceCount: number
  group: Group
  tenant: Tenant
}>()

// --- Store and Composable Setup ----------------------------------------------

const route = useRoute()

// --- Component State ---------------------------------------------------------

const showDetail = ref(false)

// --- Watchers and Effects ----------------------------------------------------

watch(
  () => route.path,
  (newPath, oldPath) => {
    if (newPath !== oldPath) {
      showDetail.value = false
    }
  },
)

// --- Computed Values ---------------------------------------------------------

const groupMembersCount = computed(() => props.group.groupUsers.length)
</script>

<template>
  <v-sheet
    class="px-10 py-4"
    color="surface-light-gray"
    @click="showDetail = !showDetail"
  >
    <v-row class="align-center">
      <v-col>
        <hgroup class="text-stack">
          <p class="p-large">{{ group.name }}</p>
          <p class="p-label">Tenant: {{ tenant.name }}</p>
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
          :value="enabledRolesCount"
          label="Roles"
        />
      </v-col>
      <v-col cols="12" md="3">
        <StatBlock
          :icon="mdiVectorPolyline"
          :value="enabledServiceCount"
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

.text-stack p {
  margin: 0;
}
</style>
