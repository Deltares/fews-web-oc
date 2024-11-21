<template>
  <div class="dashboard-wrapper">
    <v-toolbar>
      <v-select
        v-model="selectedDashboard"
        :items="dashboards"
        return-object
        hide-details
        item-text="title"
        item-value="id"
        label="Dashboard"
        class="px-2"
        menu-icon="mdi-chevron-down"
        variant="solo-filled"
        dense
      />
      <v-spacer />
    </v-toolbar>
    <DashboardDisplay v-if="selectedDashboard" :dashboard="selectedDashboard" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import DashboardDisplay from '@/components/general/DashboardDisplay.vue'

async function getDashboards() {
  const data = await fetch('/dashboards.json')
  return data.json()
}

const selectedDashboard = ref()

const dashboards = ref()
onMounted(async () => {
  dashboards.value = await getDashboards()
  selectedDashboard.value = dashboards.value[0]
})
</script>

<style scoped>
.dashboard-wrapper {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100%;
  width: 100%;
}

.dashboard-body {
  height: 100%;
  width: 100%;
}
</style>
