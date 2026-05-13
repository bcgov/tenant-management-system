<script setup lang="ts">
// --- Component Interface -----------------------------------------------------

defineProps<{
  icon: string
  label: string
  value: number | string
}>()
</script>

<template>
  <v-row class="align-center flex-nowrap" no-gutters>
    <v-col class="pr-4" cols="auto">
      <v-icon size="x-large">{{ icon }}</v-icon>
    </v-col>
    <v-col cols="auto">
      <hgroup class="text-stack">
        <p class="p-label">{{ label }}</p>
        <p>{{ value }}</p>
      </hgroup>
    </v-col>
  </v-row>
</template>

<style scoped>
.text-stack p {
  margin: 0;
}
</style>
