<template>
  <ThresholdsButton
    :active="sidePanelStore.isActive('thresholds')"
    :warningLevels="warningLevelsStore.warningLevels"
    :crossings="warningLevelsStore.thresholdCrossings"
    @click="sidePanelStore.toggleActive('thresholds')"
  />
  <Teleport to="#main-side-panel" defer>
    <div
      v-if="sidePanelStore.isActive('thresholds')"
      class="d-flex flex-column h-100 w-100"
    >
      <ThresholdsPanel
        v-model:selectedWarningLevelIds="
          warningLevelsStore.selectedWarningLevelIds
        "
        :warningLevels="warningLevelsStore.warningLevels"
        :crossings="warningLevelsStore.thresholdCrossings"
        :selectedThresholdCrossings="
          warningLevelsStore.selectedThresholdCrossings
        "
        :locationIds="props.locationIds"
        @close="sidePanelStore.toggleActive('thresholds')"
        @navigate="emit('navigate', $event)"
      />
    </div>
  </Teleport>
</template>
<script setup lang="ts">
import { watch } from 'vue'
import ThresholdsPanel from '@/components/thresholds/ThresholdsPanel.vue'
import ThresholdsButton from '@/components/thresholds/ThresholdsButton.vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { useWarningLevelsStore } from '@/stores/warningLevels'
import { useSidePanelStore } from '@/stores/sidePanel'
import { NavigateRoute } from '@/lib/router/types'

interface Props {
  topologyNode?: TopologyNode
  locationIds?: string
}

interface Emits {
  navigate: [to: NavigateRoute]
}
const emit = defineEmits<Emits>()

const props = defineProps<Props>()

const sidePanelStore = useSidePanelStore()
const warningLevelsStore = useWarningLevelsStore()
watch(
  () => props.topologyNode?.id,
  (newId) => {
    warningLevelsStore.setTopologyNodeId(newId)
    warningLevelsStore.selectedWarningLevelIds = []
  },
)
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
