<script setup lang="ts">
import { type Group } from '@/models/group.model'
import { type GroupService } from '@/models/groupservice.model'
import { type GroupServiceRole } from '@/models/groupservicerole.model'
import { type Tenant } from '@/models/tenant.model'
import { type User } from '@/models/user.model'

// --- Component Interface -----------------------------------------------------

const { tenant, user } = defineProps<{
  tenant: Tenant
  user: User
}>()

// --- Component Methods -------------------------------------------------------

const getUserRoles = (user: User) => {
  return user.roles
    .map((role) => role.description)
    .sort((a, b) => a.localeCompare(b))
    .join(', ')
}

const sortedGroups = (groups: Group[]) => {
  return [...groups].sort((a, b) => a.name.localeCompare(b.name))
}

const sortedGroupServices = (groupServices: GroupService[]) => {
  return [...groupServices].sort((a, b) =>
    a.displayName.localeCompare(b.displayName),
  )
}

const sortedGroupServiceRoles = (groupServiceRoles: GroupServiceRole[]) => {
  return [...groupServiceRoles].sort((a, b) =>
    a.description.localeCompare(b.description),
  )
}
</script>

<template>
  <h1>User details: {{ user.getName() }}</h1>

  <hr class="my-12" />

  <v-row>
    <v-col cols="12" lg="4">
      <hgroup class="text-stack">
        <p class="p-label">Display Name</p>
        <p class="p-xlarge">
          {{ user.ssoUser.displayName }}
        </p>
      </hgroup>
    </v-col>
    <v-col cols="12" lg="4">
      <hgroup class="text-stack">
        <p class="p-label">Email</p>
        <p class="p-xlarge">
          {{ user.ssoUser.email }}
        </p>
      </hgroup>
    </v-col>
    <v-col cols="12" lg="4">
      <hgroup class="text-stack">
        <p class="p-label">ID Type</p>
        <p class="p-xlarge">
          {{ user.getIdentityProvider() }}
        </p>
      </hgroup>
    </v-col>
  </v-row>

  <v-row>
    <v-col cols="12" lg="4">
      <hgroup class="text-stack">
        <p class="p-label">Tenant</p>
        <p class="p-xlarge">
          {{ tenant.name }}
        </p>
      </hgroup>
    </v-col>
    <v-col cols="12" lg="8">
      <hgroup class="text-stack">
        <p class="p-label">Tenant Roles</p>
        <p class="p-xlarge">
          {{ getUserRoles(user) }}
        </p>
      </hgroup>
    </v-col>
  </v-row>

  <v-sheet class="mt-12 pa-6" color="background" border>
    <div class="align-center d-flex justify-space-between">
      <h2 class="my-0">Group memberships</h2>
      <v-chip>
        {{ user.groups.length }}
        {{ user.groups.length === 1 ? 'group' : 'groups' }}
      </v-chip>
    </div>

    <p class="mb-6">
      Groups and associated connected service roles for {{ user.getName() }}.
    </p>

    <v-sheet
      v-if="user.groups.length === 0"
      align="middle"
      class="pa-6"
      color="background"
      border
    >
      <h3 class="mb-6 mt-0">No group memberships</h3>
      <p class="my-0">
        {{ user.getName() }} isn't currently a member of any groups in this
        tenant.
      </p>
    </v-sheet>
    <v-sheet
      v-for="group in sortedGroups(user.groups)"
      :key="group.id"
      class="mt-6 pa-6"
      color="background"
      border
    >
      <h3 class="mb-6 mt-0">{{ group.name }}</h3>

      <v-table class="bg-background">
        <thead class="bg-surface-light">
          <tr>
            <th scope="col">Connected Service</th>
            <th scope="col">Associated Roles</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="groupService in sortedGroupServices(
              group.groupServices as any,
            )"
            :key="groupService.id"
          >
            <td>{{ groupService.displayName }}</td>
            <td>
              <div class="d-flex flex-wrap ga-2">
                <v-chip
                  v-for="groupServiceRole in sortedGroupServiceRoles(
                    groupService.roles,
                  )"
                  :key="groupServiceRole.id"
                  color="primary"
                  size="small"
                >
                  {{ groupServiceRole.description }}
                </v-chip>
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-sheet>
  </v-sheet>
</template>

<style scoped>
.text-stack p {
  margin: 0;
  overflow-wrap: break-word;
}
</style>
