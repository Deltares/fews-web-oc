<template>
  <div class="d-flex flex-column h-100 w-100">
    <v-tabs v-model="selectedTab" class="flex-0-0">
      <v-tab value="Running tasks">Running tasks</v-tab>
      <v-tab value="Import status">Import status</v-tab>
    </v-tabs>
    <v-window v-model="selectedTab" class="flex-1-1">
      <v-window-item value="Running tasks" class="h-100">
        <running-tasks timeOut="1000" style="max-height: 100%" />
      </v-window-item>
      <v-window-item value="Import status" class="h-100">
        <import-status-component timeOut="1000" style="max-height: 100%" />
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import RunningTasks from '../components/systemmonitor/RunningTasks.vue'
import ImportStatusComponent from '../components/systemmonitor/ImportStatusComponent.vue'
const selectedTab = ref(0)
</script>

<style scoped>
:deep(.v-window__container) {
  height: 100%;
}
</style>
