<template>
  <v-btn
    icon="mdi-clipboard-text-clock"
    :active="sidePanelStore.isActive('tasks')"
    @click="sidePanelStore.toggleActive('tasks')"
  />
  <Teleport to="#main-side-panel" defer>
    <div
      v-if="sidePanelStore.isActive('tasks')"
      class="d-flex flex-column h-100 w-100"
    >
      <v-tabs v-model="selectedTab" density="compact" class="flex-0-0">
        <v-tab
          value="visualize-tasks"
          prepend-icon="mdi-chart-line"
          class="text-none"
        >
          Visualize Data
        </v-tab>
        <v-tab
          value="tasks"
          prepend-icon="mdi-clipboard-text"
          class="text-none"
        >
          All Tasks
        </v-tab>
      </v-tabs>
      <v-window v-model="selectedTab" class="flex-1-1">
        <v-window-item value="visualize-tasks" class="h-100">
          <TaskRunsPanel :topologyNode="topologyNode" />
        </v-window-item>
        <v-window-item value="tasks" class="h-100">
          <TaskRunsPanel />
        </v-window-item>
      </v-window>
    </div>
  </Teleport>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import TaskRunsPanel from './TaskRunsPanel.vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { useSidePanelStore } from '@/stores/sidePanel'

interface Props {
  topologyNode?: TopologyNode
}

defineProps<Props>()

const sidePanelStore = useSidePanelStore()

const selectedTab = ref('visualize-tasks')
</script>

<style scoped>
.refresh-container {
  height: 28px;
}

.task-runs-panel {
  width: 450px;
  display: grid;
  grid-template-rows: auto 1fr auto auto;
}

:deep(.v-window__container) {
  height: 100%;
}
</style>
