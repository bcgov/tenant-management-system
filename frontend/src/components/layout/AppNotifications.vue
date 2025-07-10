<script setup lang="ts">
import { useNotification } from '@/composables'

const { notification } = useNotification()
</script>

<template>
  <transition-group class="notification-wrapper" name="fade" tag="div">
    <div v-if="notification.items.length" class="notification-wrapper">
      <div
        v-for="notificationItem in notification.items"
        :key="notificationItem.id"
        class="notification-container"
      >
        <v-alert
          :title="notificationItem.title"
          :type="notificationItem.type"
          role="alert"
          closable
          @click="notification.remove(notificationItem.id)"
        >
          {{ notificationItem.message }}
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
