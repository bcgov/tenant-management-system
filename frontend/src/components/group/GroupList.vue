<script setup lang="ts">
import { computed } from 'vue'

import GroupListCard from '@/components/group/GroupListCard.vue'
import { type Group } from '@/models/group.model'

// --- Component Interface -----------------------------------------------------

const { groups } = defineProps<{
  groups: Group[]
}>()

const emit = defineEmits<{
  select: [id: Group['id']]
}>()

// --- Computed Values ---------------------------------------------------------

const sortedGroups = computed(() => {
  return [...groups].sort((a, b) => a.name.localeCompare(b.name))
})

// --- Component Methods -------------------------------------------------------

const handleClick = (id: Group['id']) => {
  emit('select', id)
}
</script>

<template>
  <v-row>
    <v-col v-for="group in sortedGroups" :key="group.id" cols="12" md="4">
      <GroupListCard :group="group" @click="handleClick(group.id)" />
    </v-col>
  </v-row>
</template>
