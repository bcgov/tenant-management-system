<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import LoadingWrapper from '@/components/ui/LoadingWrapper.vue'
import SimpleDialog, {
  type DialogButton,
} from '@/components/ui/SimpleDialog.vue'
import { useNotification } from '@/composables/useNotification'
import { type Group } from '@/models/group.model'
import { type GroupService } from '@/models/groupservice.model'
import { type GroupServiceRoleId } from '@/models/groupservicerole.model'
import { type Tenant } from '@/models/tenant.model'
import { useGroupStore } from '@/stores/useGroupStore'
import { ROLES } from '@/utils/constants'
import { currentUserHasRole } from '@/utils/permissions'

const { t } = useI18n()

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  group: Group
  tenant: Tenant
}>()

// --- Store and Composable Setup ----------------------------------------------

const groupStore = useGroupStore()
const notification = useNotification()

// --- Component State ---------------------------------------------------------

const draft = ref<Map<GroupServiceRoleId, boolean>>(new Map())
const editing = ref(false)
const expanded = ref<string[]>([])
const promptAction = ref<'undo' | 'clear' | null>(null)
const promptToContinue = ref(false)

// --- Computed Values ---------------------------------------------------------

const canMakeChanges = computed(() => {
  return (
    currentUserHasRole(props.tenant, ROLES.TENANT_OWNER.value) ||
    currentUserHasRole(props.tenant, ROLES.USER_ADMIN.value) ||
    currentUserHasRole(props.tenant, ROLES.OPERATIONS_ADMIN.value)
  )
})

const dialogButtons = computed(() => {
  const buttons: DialogButton[] = [
    {
      text: t('general.cancel'),
      action: 'cancel',
      type: 'secondary',
    },
    {
      text:
        promptAction.value === 'clear'
          ? t('general.clearAll')
          : t('general.revert'),
      action: 'confirm',
      type: 'primary',
    },
  ]

  return buttons
})

const dialogText = computed(() => {
  if (promptAction.value === 'undo') {
    return t('groups.undoRoleModalDesc')
  } else if (promptAction.value === 'clear') {
    return t('groups.clearAllRoleModalDesc')
  }

  return ''
})

const dialogTitle = computed(() => {
  if (promptAction.value === 'undo') {
    return t('groups.undoRoleModalTitle')
  } else if (promptAction.value === 'clear') {
    return t('groups.clearAllRoleModalTitle')
  }

  return ''
})

const groupServices = computed(() => groupStore.groupServices)

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
    await groupStore.updateGroupRoles(
      props.tenant.id,
      props.group.id,
      updated as GroupService[],
    )
    notification.success(
      t('groups.sharedServicesSavedDesc'),
      t('groups.sharedServicesSavedTitle'),
    )
    editing.value = false
    draft.value.clear()
  } catch {
    notification.error(
      t('groups.sharedServicesSaveErrorDesc'),
      t('groups.sharedServicesSaveErrorTitle'),
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

// --- Component Lifecycle -----------------------------------------------------

onMounted(async () => {
  try {
    await groupStore.fetchGroupServices(props.tenant.id, props.group.id)

    expanded.value = groupServices.value.map((service) =>
      service.displayName.toLowerCase(),
    )
  } catch {
    notification.error('Failed to load group services')
  }
})
</script>

<template>
  <LoadingWrapper
    :loading="!groupServices"
    loading-message="Loading group services..."
  >
    <v-container class="ms-6">
      <v-row>
        <v-col cols="12">
          <h4>
            {{
              $t('groups.sharedServices', {
                servicesLabel: $t('general.servicesLabel', 2),
              })
            }}
          </h4>
          <p>
            {{
              $t('groups.sharedServicesDesc', {
                servicesLabel: $t('general.servicesLabel', 2),
              })
            }}
          </p>
        </v-col>
      </v-row>
      <v-row v-if="groupServices.length === 0">
        <v-col cols="12">
          <p>{{ $t('groups.noServices') }}</p>
        </v-col>
      </v-row>
      <v-row v-else class="darkened pa-4">
        <!-- Edit button -->
        <v-col cols="12">
          <ButtonPrimary
            v-if="!editing && canMakeChanges"
            :text="$t('general.edit')"
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
                  :disabled="!editing || !canMakeChanges"
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
        <v-col v-if="canMakeChanges" class="text-right" cols="12">
          <v-btn
            :disabled="!editing"
            class="mr-2"
            variant="text"
            @click="cancelEditing"
          >
            {{ $t('general.cancel') }}
          </v-btn>

          <v-btn
            :class="`tms-button-secondary mr-2${editing ? ' text-error' : ''}`"
            :disabled="!editing"
            :variant="editing ? 'outlined' : 'flat'"
            base-color="secondary"
            border="sm opacity-100"
            @click="openDialog('clear')"
          >
            {{ $t('general.clearAll') }}
          </v-btn>

          <ButtonSecondary
            :disabled="!editing"
            :text="$t('general.undoChanges')"
            class="mr-2"
            @click="openDialog('undo')"
          >
          </ButtonSecondary>

          <ButtonPrimary
            :disabled="!editing"
            :text="$t('general.save')"
            @click="saveChanges"
          />
        </v-col>
      </v-row>

      <SimpleDialog
        :buttons="dialogButtons"
        :has-close="true"
        :message="dialogText"
        :model-value="promptToContinue"
        :title="dialogTitle"
        dialog-type="warning"
        @button-click="handleDialogButtonClick"
        @update:model-value="
          (val: boolean) => {
            promptToContinue = val
          }
        "
      />
    </v-container>
  </LoadingWrapper>
</template>

<style scoped>
.darkened {
  background: rgb(var(--v-theme-surface-light-gray));
}

.tms-button-secondary:disabled {
  background-color: rgb(var(--v-theme-secondary-disabled)) !important;
}
</style>
