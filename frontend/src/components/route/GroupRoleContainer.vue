<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import SimpleDialog, {
  type DialogButton,
} from '@/components/ui/SimpleDialog.vue'
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
const promptAction = ref<'undo' | 'clear' | null>(null)
const promptToContinue = ref(false)

// --- Computed Values ---------------------------------------------------------

const dialogButtons = computed(() => {
  const buttons: DialogButton[] = [
    {
      action: 'cancel',
      text: 'Cancel',
      type: 'secondary',
    },
    {
      action: 'confirm',
      text: promptAction.value === 'clear' ? 'Clear All' : 'Revert',
      type: 'primary',
    },
  ]

  return buttons
})

const dialogText = computed(() => {
  if (promptAction.value === 'undo') {
    return (
      "You're about to undo your current selections and restore the " +
      'previously assigned roles. Are you sure you want to continue?'
    )
  } else if (promptAction.value === 'clear') {
    return (
      "You're about to delete all of your current role selections. Are " +
      'you sure you want to continue?'
    )
  }

  return ''
})

const dialogTitle = computed(() => {
  if (promptAction.value === 'undo') {
    return 'Revert to Previous Roles?'
  } else if (promptAction.value === 'clear') {
    return 'Delete all Selections?'
  }

  return ''
})

const expanded = computed(() =>
  groupStore.groupServices.map((service) => service.displayName.toLowerCase()),
)

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

const handleDialogButtonClick = (action: string) => {
  if (action === 'confirm') {
    if (promptAction.value === 'undo') {
      undoChanges()
    } else if (promptAction.value === 'clear') {
      clearAll()
    }
  }
  promptToContinue.value = false
  promptAction.value = null
}

const navigateToServices = () => {
  router.push(`/tenants/${tenantId}/services`)
}

const openDialog = (action: 'undo' | 'clear') => {
  promptAction.value = action
  promptToContinue.value = true
}

const saveChanges = async () => {
  const updated = groupServices.value.map((service) => ({
    ...service,
    roles: service.roles.map((role) => ({
      ...role,
      isEnabled: draft.value.get(role.id) ?? role.isEnabled,
    })),
  }))

  try {
    await groupStore.updateGroupServiceRoles(
      tenantId,
      groupId,
      updated as GroupService[],
    )
    notification.success(
      'The roles for this group have been successfully updated.',
      'Roles Saved',
    )
    editing.value = false
    draft.value.clear()
  } catch {
    notification.error(
      'There was an error updating the roles. Please try again.',
      'Error Saving Roles',
    )
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
  <v-container v-if="groupServices.length === 0" class="fill-height">
    <v-row class="center-align justify-center">
      <v-col class="align-center d-flex flex-column" cols="auto">
        <template v-if="isUserAdmin">
          <h1>No Connected Services added yet</h1>
          <p class="p-large">
            Service roles can only be assigned after Connected Services have
            been added to your tenant.
          </p>

          <ol>
            <li>Go to the Connected Services page</li>
            <li>Add the Connected Service(s) your tenant needs</li>
            <li>Return here to assign service roles to this group</li>
          </ol>

          <p>
            <ButtonPrimary
              text="Go to Connected Services"
              @click="navigateToServices"
            />
          </p>
        </template>
        <template v-else>
          <h1>No Service Roles available yet</h1>
          <hgroup class="text-center text-stack">
            <p class="p-large">
              Connected Services must be added to this tenant before service
              roles can be assigned to groups.
            </p>
            <p class="p-large">Contact your Tenant Owner for assistance.</p>
          </hgroup>
        </template>
      </v-col>
    </v-row>
  </v-container>
  <v-container v-else class="ms-6">
    <v-row>
      <v-col cols="12">
        <h4>Adding Connected Services Roles</h4>
        <p>
          Click 'Edit' to start assigning roles. Choose the roles you want to
          add to your Group from each available Connected Services, then click
          'Save' to apply your changes.
        </p>
      </v-col>
    </v-row>

    <v-row class="darkened pa-4">
      <v-col cols="12">
        <ButtonPrimary
          v-if="!editing && isUserAdmin"
          text="Edit"
          @click="startEditing"
        />
      </v-col>

      <!-- Checkbox panels -->
      <v-col
        v-for="(service, serviceIndex) in groupServices"
        :key="`col-service-${service.id}`"
        cols="6"
      >
        <v-expansion-panels v-model="expanded[serviceIndex]" class="mb-4">
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
                class="noBackground"
                @update:model-value="
                  (val: boolean | null) => draft.set(role.id, val ?? false)
                "
              />
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>

      <!-- save/cancel/reset buttons -->
      <v-col v-if="isUserAdmin" class="text-right" cols="12">
        <v-btn
          :disabled="!editing"
          class="mr-2"
          variant="text"
          @click="cancelEditing"
        >
          Cancel
        </v-btn>

        <v-btn
          :class="`tms-button-secondary mr-2${editing ? ' text-error' : ''}`"
          :disabled="!editing"
          :variant="editing ? 'outlined' : 'flat'"
          base-color="secondary"
          border="sm opacity-100"
          @click="openDialog('clear')"
        >
          Clear All
        </v-btn>

        <ButtonSecondary
          :disabled="!editing"
          class="mr-2"
          text="Undo Changes"
          @click="openDialog('undo')"
        >
        </ButtonSecondary>

        <ButtonPrimary :disabled="!editing" text="Save" @click="saveChanges" />
      </v-col>
    </v-row>

    <SimpleDialog
      :buttons="dialogButtons"
      :message="dialogText"
      :model-value="promptToContinue"
      :title="dialogTitle"
      @button-click="handleDialogButtonClick"
      @update:model-value="
        (val: boolean) => {
          promptToContinue = val
        }
      "
    />
  </v-container>
</template>

<style scoped>
.darkened {
  background: rgb(var(--v-theme-surface-light-gray));
}

.text-stack p {
  margin: 0;
}

.tms-button-secondary:disabled {
  background-color: rgb(var(--v-theme-secondary-disabled)) !important;
}
</style>
