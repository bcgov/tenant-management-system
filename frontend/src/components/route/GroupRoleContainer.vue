<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import ButtonTertiary from '@/components/ui/ButtonTertiary.vue'
import SimpleDialog from '@/components/ui/SimpleDialog.vue'
import { useNotification } from '@/composables/useNotification'
import { type GroupId } from '@/models/group.model'
import { type GroupService } from '@/models/groupservice.model'
import { type GroupServiceRoleId } from '@/models/groupservicerole.model'
import { type TenantId } from '@/models/tenant.model'
import { useGroupStore } from '@/stores/useGroupStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { ROLES } from '@/utils/constants'
import { currentUserHasRole } from '@/utils/permissions'

// --- Component Interface -----------------------------------------------------

const { groupId, tenantId } = defineProps<{
  groupId: GroupId
  tenantId: TenantId
}>()

// --- Store and Composable Setup ----------------------------------------------

const groupStore = useGroupStore()
const notification = useNotification()
const router = useRouter()
const tenantStore = useTenantStore()

// --- Component State ---------------------------------------------------------

const draft = ref<Map<GroupServiceRoleId, boolean>>(new Map())
const editing = ref(false)
const showClearAllDialog = ref(false)
const showRevertDialog = ref(false)

// --- Computed Values ---------------------------------------------------------

const groupServices = computed(() => groupStore.groupServices)

// A tenant owner, by default, is also a user admin - even if they don't have
// the USER_ADMIN role.
const isUserAdmin = computed(() => {
  return (
    currentUserHasRole(tenant.value, ROLES.TENANT_OWNER.value) ||
    currentUserHasRole(tenant.value, ROLES.USER_ADMIN.value)
  )
})

const tenant = computed(() => {
  const tenant = tenantStore.getTenant(tenantId)
  if (!tenant) {
    throw new Error(`Tenant ${tenantId} not found`)
  }

  return tenant
})

// --- Component Methods -------------------------------------------------------

const cancelEditing = () => {
  draft.value.clear()
  editing.value = false
}

const clearAll = () => {
  for (const key of draft.value.keys()) {
    draft.value.set(key, false)
  }
}

const handleClearAllDialogButtonClick = (action: string) => {
  if (action === 'clear') {
    clearAll()
  }

  showClearAllDialog.value = false
}

const handleRevertDialogButtonClick = (action: string) => {
  if (action === 'revert') {
    undoChanges()
  }

  showRevertDialog.value = false
}

const navigateToServices = () => {
  void router.push(`/tenants/${tenantId}/services`)
}

const openClearAllDialog = () => {
  showClearAllDialog.value = true
}

const openRevertDialog = () => {
  showRevertDialog.value = true
}

const saveChanges = async () => {
  const updated = groupServices.value.map((service) => ({
    ...service,
    roles: service.roles.map((role) => ({
      ...role,
      isEnabled: draft.value.get(role.id),
    })),
  }))

  try {
    await groupStore.updateGroupServiceRoles(
      tenantId,
      groupId,
      updated as GroupService[],
    )
    editing.value = false
    draft.value.clear()
  } catch {
    notification.error('Error saving roles')
  }
}

const startEditing = () => {
  draft.value = new Map(
    groupServices.value.flatMap((service) =>
      service.roles.map((role) => [role.id, role.isEnabled]),
    ),
  )
  editing.value = true
}

const undoChanges = () => {
  draft.value = new Map(
    groupServices.value.flatMap((service) =>
      service.roles.map((role) => [role.id, role.isEnabled]),
    ),
  )
}
</script>

<template>
  <v-container v-if="groupServices.length === 0" class="fill-height px-10">
    <v-row class="center-align justify-center">
      <v-col class="align-center d-flex flex-column" cols="auto">
        <template v-if="isUserAdmin">
          <h1>No connected services added yet</h1>
          <p class="p-large">
            Service roles can only be assigned after connected services have
            been added to your tenant.
          </p>

          <ol>
            <li>Go to the connected services page</li>
            <li>Add the connected service(s) your tenant needs</li>
            <li>Return here to assign service roles to this group</li>
          </ol>

          <p>
            <ButtonPrimary
              text="Go to connected services"
              @click="navigateToServices"
            />
          </p>
        </template>
        <template v-else>
          <h1>No service roles available yet</h1>
          <hgroup class="text-center text-stack">
            <p class="p-large">
              Connected services must be added to this tenant before service
              roles can be assigned to groups.
            </p>
            <p class="p-large">Contact your tenant owner for assistance.</p>
          </hgroup>
        </template>
      </v-col>
    </v-row>
  </v-container>
  <v-container v-else class="px-10">
    <v-row>
      <v-col cols="12">
        <h1>Connected service roles</h1>
        <p>
          Click 'Edit' to start assigning roles. Choose the roles you want to
          add to your group from each available connected service, then click
          'Save' to apply your changes.
        </p>
      </v-col>
    </v-row>

    <v-row class="pa-4">
      <v-col cols="12">
        <ButtonPrimary
          v-if="!editing && isUserAdmin"
          text="Edit"
          @click="startEditing"
        />
      </v-col>

      <!-- Checkbox panels -->
      <v-col
        v-for="service in groupServices"
        :key="`col-service-${service.id}`"
        cols="6"
      >
        <v-expansion-panels
          :model-value="service.displayName.toLowerCase()"
          class="mb-4"
        >
          <v-expansion-panel :value="service.displayName.toLowerCase()">
            <v-expansion-panel-title>{{
              service.displayName
            }}</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-checkbox
                v-for="role in service.roles"
                :key="`checkbox-role-${role.id}`"
                :color="editing ? 'primary' : ''"
                :disabled="!editing || !isUserAdmin"
                :label="role.name"
                :model-value="editing ? draft.get(role.id) : role.isEnabled"
                density="compact"
                @update:model-value="
                  (val: boolean | null) => draft.set(role.id, !!val)
                "
              />
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>

      <v-col v-if="isUserAdmin" class="text-right" cols="12">
        <ButtonTertiary
          :disabled="!editing"
          class="mr-2"
          text="Cancel"
          @click="cancelEditing"
        />

        <v-btn
          :class="`mr-2${editing ? ' text-error' : ''}`"
          :disabled="!editing"
          :variant="editing ? 'outlined' : 'flat'"
          base-color="secondary"
          border="sm opacity-100"
          @click="openClearAllDialog"
        >
          Clear all
        </v-btn>

        <ButtonSecondary
          :disabled="!editing"
          class="mr-2"
          text="Undo changes"
          @click="openRevertDialog"
        />

        <ButtonPrimary :disabled="!editing" text="Save" @click="saveChanges" />
      </v-col>
    </v-row>

    <SimpleDialog
      v-model="showClearAllDialog"
      :buttons="[
        { action: 'cancel', text: 'Cancel', type: 'secondary' },
        { action: 'clear', text: 'Clear all', type: 'primary' },
      ]"
      message="You're about to delete all of your current role selections. Are
        you sure you want to continue?"
      title="Delete all selections?"
      @button-click="handleClearAllDialogButtonClick"
    />

    <SimpleDialog
      v-model="showRevertDialog"
      :buttons="[
        { action: 'cancel', text: 'Cancel', type: 'secondary' },
        { action: 'revert', text: 'Revert', type: 'primary' },
      ]"
      message="You're about to undo your current selections and restore the
        previously assigned roles. Are you sure you want to continue?"
      title="Revert to previous roles?"
      @button-click="handleRevertDialogButtonClick"
    />
  </v-container>
</template>
