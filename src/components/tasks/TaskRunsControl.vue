<template>
  <v-btn
    icon="mdi-clipboard-text-clock"
    :active="isPanelOpen"
    @click="toggleTasksPanel"
  />
  <Teleport to="#main-side-panel" defer>
    <TaskRunsPanel v-if="isPanelOpen" :topologyNodeId="topologyNodeId" />
  </Teleport>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import TaskRunsPanel from './TaskRunsPanel.vue'

interface Props {
  topologyNodeId?: string
}

defineProps<Props>()

const isPanelOpen = ref(false)

function toggleTasksPanel(): void {
  isPanelOpen.value = !isPanelOpen.value
}
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
</style>
