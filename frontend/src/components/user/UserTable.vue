<script setup lang="ts">
import {
  mdiClose,
  mdiDeleteOutline,
  mdiDotsVertical,
  mdiPencil,
  mdiPlusBox,
} from '@mdi/js'
import { computed, type ComputedRef, ref } from 'vue'
import { useI18n } from 'vue-i18n'
// TODO: sus
import { type ItemSlotBase } from 'vuetify/lib/components/VDataTable/types.mjs'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import { type GroupUser } from '@/models/groupuser.model'
import { type Role } from '@/models/role.model'
import { type Tenant } from '@/models/tenant.model'
import { type User, type UserId } from '@/models/user.model'
import { ROLES } from '@/utils/constants'
import { identityProviderToDisplay } from '@/utils/identityProvider'
import { currentUserHasRole } from '@/utils/permissions'

type TableHeaderItem = {
  align?: 'start' | 'center' | 'end'
  key: string
  sortable?: boolean
  title: string
}

type RowPropsType = ItemSlotBase<User>

const { t } = useI18n()

const headerClass = 'bg-surface-light font-weight-bold text-body-small'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  editUserRoles?: (user: User) => void
  filter?: string
  handleRemoveRole?: (user: User, role: Role) => void
  selectUser?: (e: Event | null, r: RowPropsType) => boolean
  showActions?: boolean
  showEditRoles?: boolean
  showOffboardDialog?: (user: User) => void
  showRoles?: boolean
  tenant: Tenant
  users: Array<User> | Array<GroupUser>
  where: string
}>()

const emit = defineEmits<{
  (event: 'add-clicked', user: User): void
  (event: 'add-first-clicked'): void
}>()

// --- Component State ---------------------------------------------------------

const selectedUser = ref<User[] | null>(null)

// --- Computed Values ---------------------------------------------------------

const actionItems = computed(() => {
  const rv = []
  if (props.showEditRoles && props.editUserRoles) {
    rv.push({
      title: t('users.editRolesAction'),
      icon: mdiPencil,
      action: props.editUserRoles,
      disabledCondition: () => {
        return false
      },
    })
  }

  if (isUserAdmin.value && props.showOffboardDialog) {
    rv.push({
      title: t('users.offboardUserAction'),
      action: props.showOffboardDialog,
      icon: mdiDeleteOutline,
      disabledCondition: (item: User) => {
        return !(
          moreThanOneTenantOwner.value ||
          !item.roles.some((r: Role) => r.name === ROLES.TENANT_OWNER.value)
        )
      },
    })
  }

  return rv
})

const computedUsers = computed((): User[] => {
  const u = props.users
  if (!Array.isArray(u)) {
    return []
  }

  if (u.length === 0) {
    return []
  }

  const first = u[0]
  // If items look like GroupUser (have a `user` property), map to the inner
  // User
  if ((first as GroupUser).user !== undefined) {
    return (u as GroupUser[]).map((g) => {
      const user = g.user
      //to get GroupUserId to UserId we have to go through unknown
      user.id = g.id as unknown as UserId

      return user
    })
  }

  return u as User[]
})

const headers: ComputedRef<TableHeaderItem[]> = computed(() => {
  const rv: TableHeaderItem[] = [
    {
      align: 'start',
      key: 'ssoUser.firstName',
      sortable: true,
      title: t('users.firstName'),
    },
    {
      align: 'start',
      key: 'ssoUser.lastName',
      sortable: true,
      title: t('users.lastName'),
    },
    {
      align: 'start',
      key: 'ssoUser.email',
      sortable: true,
      title: t('users.email'),
    },
    {
      align: 'start',
      key: 'ssoUser.idpType',
      sortable: false,
      title: t('users.idpType'),
    },
  ]

  if (props.showRoles) {
    rv.push({
      align: 'start',
      key: 'roles',
      sortable: false,
      title: t('users.tenantRoles'),
    })
  }

  if (props.showActions) {
    rv.push({
      align: 'center',
      key: 'actions',
      sortable: false,
      title: t('users.actions'),
    })
  }

  return rv
})

const isUserAdmin = computed(() => {
  // A tenant owner, by default, is also a user admin - even if they don't have
  // the USER_ADMIN role.
  return (
    currentUserHasRole(props.tenant, ROLES.TENANT_OWNER.value) ||
    currentUserHasRole(props.tenant, ROLES.USER_ADMIN.value)
  )
})

const moreThanOneTenantOwner = computed(() => {
  const owners = props.tenant.getOwners()

  return owners.length > 1
})

const sortKey = computed(() => {
  return [{ key: 'ssoUser.firstName' }]
})

// --- Component Methods -------------------------------------------------------

const canRemoveRole = (item: User, role: Role): boolean => {
  if (item.roles.length <= 1) {
    return false
  }

  if (!isUserAdmin.value) {
    return false
  }

  if (!props.handleRemoveRole) {
    return false
  }

  if (role.name !== ROLES.TENANT_OWNER.value) {
    return true
  }

  // For tenant owners, only allow role removal if there is more than one tenant
  // owner
  return moreThanOneTenantOwner.value
}

const colorRowItem = (item: ItemSlotBase<User>) => {
  const selectedId: UserId | undefined = selectedUser.value?.[0]?.id

  if (selectedId && item?.item?.id && selectedId === item.item.id) {
    return { class: 'selected-user' }
  }

  return {}
}

const selectRowItem = (e: Event, r: RowPropsType) => {
  if (props.selectUser?.(e, r)) {
    r.toggleSelect(r.internalItem)
  }
}
</script>

<template>
  <v-data-table
    v-model="selectedUser"
    :header-props="{
      class: headerClass,
    }"
    :headers="headers"
    :hide-default-footer="computedUsers.length === 0"
    :items="computedUsers"
    :row-props="colorRowItem"
    :search="filter"
    :sort-by="sortKey"
    item-value="id"
    select-strategy="single"
    striped="even"
    fixed-header
    hover
    return-object
    @click:row="
      (event: Event, row: RowPropsType) => false && selectRowItem(event, row)
    "
  >
    <template #no-data>
      <div class="my-8">
        <h5 class="mb-2">
          {{ $t('users.noUsersYet', { where }) }}
        </h5>

        <p class="mt-0">
          {{ filter ? $t('users.noMatch') : $t('users.noUsersIn', { where }) }}
        </p>

        <ButtonPrimary
          v-if="isUserAdmin"
          :text="$t('users.noUsersAdd', { where })"
          class="mt-4"
          @click="emit('add-first-clicked')"
        />
      </div>
    </template>
    <template #[`item.roles`]="{ item }">
      <div class="d-flex flex-wrap" style="gap: 8px; margin-block: 4px">
        <v-chip
          v-for="role in [...item.roles].sort((a, b) =>
            a.description.localeCompare(b.description),
          )"
          :key="role.id"
          class="d-inline-flex align-center"
          color="primary"
        >
          {{ role.description }}
          <v-icon
            v-if="canRemoveRole(item, role) && handleRemoveRole"
            :icon="mdiClose"
            class="ml-1 cursor-pointer"
            size="small"
            @click.stop="handleRemoveRole(item, role)"
          />
        </v-chip>
      </div>
    </template>

    <template #[`item.ssoUser.idpType`]="{ item }">
      {{ identityProviderToDisplay(item.ssoUser.idpType) }}
    </template>

    <template #[`item.add`]="{ item }">
      <v-btn
        :icon="mdiPlusBox"
        class="ma-0 pa-0"
        color="primary"
        density="compact"
        size="x-large"
        variant="text"
        @click="emit('add-clicked', item)"
      />
    </template>

    <template #[`item.actions`]="{ item }">
      <v-menu>
        <template #activator="{ props: activatorProps }">
          <v-btn
            :icon="mdiDotsVertical"
            variant="text"
            v-bind="activatorProps"
          ></v-btn>
        </template>

        <v-list>
          <v-list-item
            v-for="(actionItem, i) in actionItems"
            :key="i"
            :value="i"
          >
            <!--
              Disable the action when `actionItem.enabledCondition(item)` is
              false. When disabled, show a tooltip explaining why and prevent
              clicks.
            -->
            <template v-if="actionItem.disabledCondition(item)">
              <v-tooltip location="top">
                <template #activator="{ props: tooltipProps }">
                  <v-list-item-title
                    v-bind="tooltipProps"
                    class="cursor-default text-body-medium text-disabled"
                  >
                    <v-icon v-if="actionItem.icon" :icon="actionItem.icon" />
                    {{ actionItem.title }}
                  </v-list-item-title>
                </template>
                <span>{{ $t('users.actionDisabledTooltip') }}</span>
              </v-tooltip>
            </template>
            <template v-else>
              <v-list-item-title
                @click="actionItem.action && actionItem.action(item)"
              >
                <v-icon v-if="actionItem.icon" :icon="actionItem.icon" />
                {{ actionItem.title }}
              </v-list-item-title>
            </template>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
  </v-data-table>
</template>
