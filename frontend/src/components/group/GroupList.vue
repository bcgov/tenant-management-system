<script setup lang="ts">
import GroupListCard from '@/components/group/GroupListCard.vue'
import { type Group } from '@/models/group.model'

// --- Component Interface -----------------------------------------------------

defineProps<{
  groups: Group[]
  isAdmin: boolean
}>()

const emit = defineEmits<{
  (event: 'select', id: Group['id']): void
}>()

// --- Component Methods -------------------------------------------------------

function handleClick(id: Group['id']) {
  emit('select', id)
}
</script>

<template>
  <v-row>
    <v-col v-for="group in groups" :key="group.id" cols="12" md="4">
      <GroupListCard
        :group="group"
        :is-admin="isAdmin"
        @click="handleClick(group.id)"
      />
    </v-col>
  </v-row>
</template>
