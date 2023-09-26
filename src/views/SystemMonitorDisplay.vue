<template>
  <div style="height: 100%; overflow-y: auto">
    <div>
      <v-tabs v-model="selectedTab">
        <v-tab value="Running tasks">Running tasks</v-tab>
        <v-tab value="Import status">Import status</v-tab>
      </v-tabs>
      <v-window v-model="selectedTab">
        <v-window-item value="Running tasks">
          <running-tasks timeOut="1000"></running-tasks>
        </v-window-item>
        <v-window-item value="Import status">
          <import-status-component timeOut="1000"></import-status-component>
        </v-window-item>
      </v-window>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import RunningTasks from '../components/systemmonitor/RunningTasks.vue'
import ImportStatusComponent from '../components/systemmonitor/ImportStatusComponent.vue'
const selectedTab = ref(0)
</script>

<style scoped></style>
