<script setup lang="ts">
import {
  mdiAccountCircleOutline,
  mdiAccountMultipleOutline,
  mdiCalendarMonthOutline,
  mdiChevronDown,
  mdiChevronUp,
  mdiKeyOutline,
  mdiPencil,
  mdiVectorPolyline,
} from '@mdi/js'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import GroupEditDialog from '@/components/group/GroupEditDialog.vue'
import StatBlock from '@/components/ui/StatBlock.vue'
import { type Group, type GroupDetailFields } from '@/models/group.model'
import { type Tenant } from '@/models/tenant.model'
import { ROLES } from '@/utils/constants'
import { currentUserHasRole } from '@/utils/permissions'

// --- Component Interface -----------------------------------------------------

const {
  enabledRolesCount,
  enabledServiceCount,
  group,
  isDuplicateName,
  tenant,
} = defineProps<{
  enabledRolesCount: number
  enabledServiceCount: number
  group: Group
  isDuplicateName: boolean
  tenant: Tenant
}>()

const dialogVisible = defineModel<boolean>('dialogVisible', { default: false })

const emit = defineEmits<{
  'clear-duplicate-error': []
  submit: [GroupDetailFields]
}>()

// --- Computed Values ---------------------------------------------------------

const isUserAdmin = computed(() => {
  // A tenant owner, by default, is also a user admin - even if they don't have
  // the USER_ADMIN role.
  return (
    currentUserHasRole(tenant, ROLES.TENANT_OWNER.value) ||
    currentUserHasRole(tenant, ROLES.USER_ADMIN.value)
  )
})

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

const groupMembersCount = computed(() => group.groupUsers.length)

// --- Component Methods -------------------------------------------------------

function dialogOpen() {
  emit('clear-duplicate-error')
  dialogVisible.value = true
}
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
          <p class="p-large">
            {{ group.name }}
            <v-btn
              v-if="isUserAdmin"
              aria-label="Edit group details"
              class="edit-icon"
              density="comfortable"
              size="small"
              title="Edit"
              variant="text"
              icon
              @click.stop="dialogOpen"
            >
              <v-icon :icon="mdiPencil" size="x-small" />
            </v-btn>
          </p>
          <p class="p-label">Tenant: {{ tenant.name }}</p>
        </hgroup>
      </v-col>
      <v-col cols="auto">
        <v-btn
          :aria-expanded="showDetail"
          :aria-label="
            showDetail ? 'Collapse group details' : 'Expand group details'
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
    <pre class="description p-small">{{ group.description }}</pre>

    <v-divider class="my-6" />

    <v-row class="align-center">
      <v-col cols="12" md="3">
        <StatBlock
          :icon="mdiCalendarMonthOutline"
          :value="group.createdDate"
          label="Date Created"
        />
      </v-col>
      <v-col cols="12" md="9">
        <StatBlock
          :icon="mdiAccountCircleOutline"
          :value="group.createdBy"
          label="Created By"
        />
      </v-col>
    </v-row>

    <v-row class="align-center">
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

  <GroupEditDialog
    v-model="dialogVisible"
    :group="group"
    :is-duplicate-name="isDuplicateName"
    @clear-duplicate-error="emit('clear-duplicate-error')"
    @submit="(updatedGroup) => emit('submit', updatedGroup)"
  />
</template>

<style scoped>
.description {
  margin: 0;
  overflow-wrap: break-word;
  white-space: pre-wrap;
}

.edit-icon {
  transform: translateY(-6px);
}

.text-stack p {
  margin: 0;
  overflow-wrap: break-word;
}
</style>
