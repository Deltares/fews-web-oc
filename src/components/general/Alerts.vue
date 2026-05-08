<template>
  <div class="alerts__container" v-if="alertsStore.hasAlerts">
    <v-alert
      v-for="alert in alertsStore.alerts"
      :key="alert.id"
      :type="alert.type"
      density="compact"
    >
      <template #close>
        <v-btn
          variant="text"
          size="small"
          @click="onCloseAlert(alert)"
          :aria-label="'Close alert: ' + alert.message"
        >
          <v-icon size="small">mdi-close</v-icon>
        </v-btn>
      </template>

      {{ alert.message }}
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { type Alert, useAlertsStore } from '@/stores/alerts'

const alertsStore = useAlertsStore()

function onCloseAlert(alert: Alert) {
  alertsStore.removeAlert(alert.id)
}
</script>

<style scoped>
.alerts__container {
  position: absolute;
  width: 500px;
  max-width: 100%;
  bottom: 0;
  left: 0;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
}
</style>
