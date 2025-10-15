<template>
  <SidePanelControl type="thresholds" title="Thresholds">
    <template #button>
      <ThresholdsButton
        :active="sidePanelStore.isActive('thresholds')"
        :warningLevels="warningLevelsStore.warningLevels"
        :crossings="warningLevelsStore.thresholdCrossings"
        @click="sidePanelStore.toggleActive('thresholds')"
      />
    </template>

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
      :selectable="nodeCanShowThresholds"
      @close="sidePanelStore.toggleActive('thresholds')"
      @navigate="emit('navigate', $event)"
    />
  </SidePanelControl>
</template>
<script setup lang="ts">
import SidePanelControl from '@/components/sidepanel/SidePanelControl.vue'
import { ref, watch } from 'vue'
import ThresholdsPanel from '@/components/thresholds/ThresholdsPanel.vue'
import ThresholdsButton from '@/components/thresholds/ThresholdsButton.vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { useWarningLevelsStore } from '@/stores/warningLevels'
import { useSidePanelStore } from '@/stores/sidePanel'
import { NavigateRoute } from '@/lib/router/types'
import { nodeHasMap } from '@/lib/topology/nodes'

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
const nodeCanShowThresholds = ref(false)

watch(
  () => props.topologyNode?.id,
  (newId) => {
    warningLevelsStore.setTopologyNodeId(newId)
    warningLevelsStore.selectedWarningLevelIds = []
  },
)

watch(
  () => props.topologyNode,
  (newNode) => {
    if (newNode && nodeHasMap(newNode)) {
      nodeCanShowThresholds.value = true
    } else {
      nodeCanShowThresholds.value = false
    }
  },
  { immediate: true },
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
</style>
