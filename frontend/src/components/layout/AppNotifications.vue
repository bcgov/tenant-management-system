<script setup lang="ts">
import { useNotification } from '@/composables/useNotification'

const { notifications, removeNotification } = useNotification()
</script>

<template>
  <div v-if="notifications.length" class="notification-wrapper">
    <div
      v-for="notification in notifications"
      :key="notification.id"
      class="notification-container"
    >
      <v-alert
        :type="notification.type"
        role="alert"
        aria-live="assertive"
        closable
        @click:close="removeNotification(notification.id)"
      >
        {{ notification.message }}
      </v-alert>
    </div>
  </div>
</template>

<style scoped>
.notification-wrapper {
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  width: 80%;
}

.notification-container {
  margin-bottom: 10px;
}
</style>
