<template>
  <v-btn
    icon
    :active="sidePanelStore.isActive('visualize')"
    @click="sidePanelStore.toggleActive('visualize')"
  >
    <v-icon icon="mdi-chart-box-multiple" />
  </v-btn>
  <Teleport to="#main-side-panel" defer>
    <div
      v-if="sidePanelStore.isActive('visualize')"
      class="d-flex flex-column h-100 w-100"
    >
      <v-toolbar density="compact">
        <span class="ms-4">Non-current Data</span>
        <template #append>
          <v-btn
            @click="sidePanelStore.toggleActive('visualize')"
            size="small"
            variant="text"
            icon="mdi-close"
          />
        </template>
      </v-toolbar>
      <TaskRunsPanel
        :topologyNode="topologyNode"
        isVisualizeMenu
        class="flex-1-1"
      />
    </div>
  </Teleport>
</template>
<script setup lang="ts">
import TaskRunsPanel from './TaskRunsPanel.vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { useSidePanelStore } from '@/stores/sidePanel'

interface Props {
  topologyNode?: TopologyNode
}

defineProps<Props>()

const sidePanelStore = useSidePanelStore()
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
