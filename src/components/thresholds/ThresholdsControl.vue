<template>
  <ThresholdsButton
    :warningLevels="warningLevelsStore.warningLevels"
    :crossings="warningLevelsStore.thresholdCrossings"
    @click="toggleTasksPanel"
  />
  <Teleport to="#secondary-side-panel-end" defer>
    <div v-if="isPanelOpen" class="d-flex flex-column h-100 w-100">
      <ThresholdsPanel
        v-model:selectedWarningLevelIds="
          warningLevelsStore.selectedWarningLevelIds
        "
        :warningLevels="warningLevelsStore.warningLevels"
        :crossings="warningLevelsStore.thresholdCrossings"
        :selectedThresholdCrossings="
          warningLevelsStore.selectedThresholdCrossings
        "
      />
    </div>
  </Teleport>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import ThresholdsPanel from '@/components/thresholds/ThresholdsPanel.vue'
import ThresholdsButton from '@/components/thresholds/ThresholdsButton.vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { useWarningLevelsStore } from '@/stores/warningLevels'

interface Props {
  topologyNode?: TopologyNode
}

const props = defineProps<Props>()

const warningLevelsStore = useWarningLevelsStore()
watch(
  () => props.topologyNode?.id,
  (newId) => {
    warningLevelsStore.setTopologyNodeId(newId)
    warningLevelsStore.selectedWarningLevelIds = []
  },
)

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

:deep(.v-window__container) {
  height: 100%;
}
</style>
