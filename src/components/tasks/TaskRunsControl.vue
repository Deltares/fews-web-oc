<template>
  <v-btn
    icon
    :active="sidePanelStore.isActive('tasks')"
    @click="sidePanelStore.toggleActive('tasks')"
  >
    <v-icon icon="mdi-clipboard-text-clock" />
  </v-btn>
  <Teleport to="#main-side-panel" defer>
    <div
      v-if="sidePanelStore.isActive('tasks')"
      class="d-flex flex-column h-100 w-100"
    >
      <v-toolbar density="compact">
        <span class="ms-4">Task Run Overview</span>
        <template #append>
          <v-btn
            @click="sidePanelStore.toggleActive('tasks')"
            size="small"
            variant="text"
            icon="mdi-close"
          />
        </template>
      </v-toolbar>
      <TaskRunsPanel class="flex-1-1" />
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

:deep(.v-window__container) {
  height: 100%;
}
</style>
