<script setup lang="ts">
import { useNotification } from '@/composables'

const { notifications, removeNotification } = useNotification()
</script>

<template>
  <transition-group class="notification-wrapper" name="fade" tag="div">
    <div v-if="notifications.length" class="notification-wrapper">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-container"
      >
        <v-alert
          :type="notification.type"
          role="alert"
          closable
          @click="removeNotification(notification.id)"
        >
          {{ notification.message }}
        </v-alert>
      </div>
    </div>
  </transition-group>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.notification-container {
  margin-bottom: 10px;
}

.notification-wrapper {
  left: 50%;
  position: fixed;
  top: 10px;
  transform: translateX(-50%);
  width: 80%;
  z-index: 9999;
}
</style>
