<script lang="ts" setup>
import { watch, ref, computed, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import { useServiceStore, useGroupStore } from '@/stores'
import { useNotification } from '@/composables'
import type { Tenant, Group } from '@/models'
import {
  GroupServiceRoles,
  SharedServicesArray,
} from '@/models/groupserviceroles.model'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import SimpleDialog, {
  type DialogButton,
} from '@/components/ui/SimpleDialog.vue'

// Props
const props = defineProps<{
  tenant: Tenant
  group: Group
}>()

// Stores
const serviceStore = useServiceStore()
const groupStore = useGroupStore()
const { t } = useI18n()

// Refs
const loadingServices: Ref<boolean> = ref(false)
const { services } = storeToRefs(serviceStore)
const { groupRoles } = storeToRefs(groupStore)
const editing: Ref<boolean> = ref<boolean>(false)
const roleValues = ref<{ [key: number]: boolean[] }>({}) // service Index -> role index -> hasRole
const defaultState = ref<{ [key: number]: boolean[] }>({}) // serviceId -> roleIds -> hasRole
const expanded = ref<string[]>([])
const promptToContinue = ref<boolean>(false)
const promptAction = ref<'undo' | 'clear' | null>(null)

// --- Helper functions -------------------------------------------------------

const fetchServices = async () => {
  loadingServices.value = true
  await groupStore.fetchRoles(props.tenant.id, props.group.id)
  serviceStore.fetchServices().then(() => {
    loadingServices.value = false
    for (let i = 0; i < services.value.length; i++) {
      const groupValues = groupRoles.value[services.value[i].id] || {}
      roleValues.value[i] = groupValues.map((g) => g.enabled === true)
      expanded.value[i] = services.value[i].name.toLowerCase()
      defaultState.value[i] = groupValues.map((g) => g.enabled === true)
    }
  })
}

const clearAll = () => {
  for (const serviceIndex in roleValues.value) {
    roleValues.value[serviceIndex] = roleValues.value[serviceIndex].map(
      () => false,
    )
  }
}

const undoChanges = () => {
  for (const serviceIndex in roleValues.value) {
    roleValues.value[serviceIndex] = [...defaultState.value[serviceIndex]]
  }
}

const saveChanges = async () => {
  const data: GroupServiceRoles = {
    sharedServices: [],
  }

  for (let i = 0; i < services.value.length; i++) {
    const groupValues = groupRoles.value[services.value[i].id] || {}
    const append: SharedServicesArray = {
      id: services.value[i].id,
      sharedServiceRoles: [],
    }
    for (let j = 0; j < groupValues.length; j++) {
      append.sharedServiceRoles.push({
        id: groupValues[j].id,
        enabled: roleValues.value[i][j],
      })
    }
    data.sharedServices.push(append)
  }

  try {
    await groupStore.updateRoles(props.tenant.id, props.group.id, data)
    useNotification().success(
      t('groups.sharedServicesSavedDesc'),
      t('groups.sharedServicesSavedTitle'),
    )
  } catch (e) {
    useNotification().error(
      t('sharedServicesSaveErrorDesc', { error: (e as Error).message }),
      t('sharedServicesSaveErrorTitle'),
    )
  }
  editing.value = false
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

// Watchers

watch(
  [props.tenant, props.group],
  () => {
    fetchServices()
    // fetchRolesForServices()
  },
  { immediate: true },
)

// Computed values
const dialogTitle = computed(() => {
  if (promptAction.value === 'undo') {
    return t('groups.undoRoleModalTitle')
  } else if (promptAction.value === 'clear') {
    return t('groups.clearAllRoleModalTitle')
  }
  return ''
})

const dialogText = computed(() => {
  if (promptAction.value === 'undo') {
    return t('groups.undoRoleModalDesc')
  } else if (promptAction.value === 'clear') {
    return t('groups.clearAllRoleModalDesc')
  }
  return ''
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
</script>

<template>
  <v-container fluid>
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
    <v-row>
      <v-col cols="12">
        <h4>{{ $t('groups.sharedServices') }}</h4>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <p>{{ $t('groups.sharedServicesDesc') }}</p>
      </v-col>
    </v-row>
    <v-row v-if="loadingServices">
      <v-col class="text-center" cols="12">
        <v-progress-circular indeterminate />
      </v-col>
    </v-row>
    <v-row v-else-if="services.length === 0">
      <v-col cols="12">
        <p>{{ $t('groups.noServices') }}</p>
      </v-col>
    </v-row>
    <v-row v-else class="darkened pa-4">
      <!-- Edit button -->
      <v-col cols="12">
        <ButtonPrimary
          v-if="!editing"
          :text="$t('general.edit')"
          @click="editing = true"
        />
      </v-col>

      <!-- Checkbox panels -->
      <v-col
        v-for="(service, serviceIndex) in services"
        :key="`col-service-${service.id}`"
        cols="6"
      >
        <v-expansion-panels v-model="expanded[serviceIndex]" class="mb-4">
          <v-expansion-panel :value="service.name.toLowerCase()">
            <v-expansion-panel-title>{{
              service.name
            }}</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-checkbox
                v-for="(role, roleIndex) in service.serviceRoles"
                :key="`checkbox-role-${role.id}`"
                v-model="roleValues[serviceIndex][roleIndex]"
                :color="editing ? 'primary' : ''"
                :disabled="!editing"
                :label="role.name"
                class="noBackground"
              >
              </v-checkbox>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>

      <!-- save/cancel/reset buttons -->
      <v-col class="text-right" cols="12">
        <v-btn
          :disabled="!editing"
          class="mr-2"
          variant="text"
          @click="editing = false"
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
  </v-container>
</template>

<style></style>

<style scoped>
.darkened {
  background: rgb(var(--v-theme-surface-light-gray));
}

.tms-button-secondary:disabled {
  background-color: rgb(var(--v-theme-secondary-disabled)) !important;
}
</style>
