<template>
  <Teleport to="#secondary-side-panel-end" defer>
    <div
      v-if="warningLevelsStore.warningLevels.length"
      class="threshold-summary-container border-s"
    >
      <div v-show="showButton" class="threshold-summary-top">
        <v-btn
          @click="toggleThresholdPanel"
          :disabled="warningLevelsStore.selectedThresholdCrossings.length === 0"
          :icon="
            warningLevelsStore.showCrossingDetails
              ? 'mdi-menu-close'
              : 'mdi-menu-open'
          "
        />
      </div>
      <v-list
        v-model:selected="warningLevelsStore.selectedWarningLevelIds"
        select-strategy="leaf"
        class="threshold-summary-center"
        lines="two"
      >
        <v-list-item
          v-for="warningLevel in warningLevelsStore.warningLevels"
          :key="warningLevel.id"
          :value="warningLevel.id"
          label
          size="small"
          density="compact"
          class="ma-0 py-3 px-0 w-100 flex-nowrap overflow-hidden"
        >
          <div class="d-flex align-center flex-column flex-nowrap px-1 w-100">
            <v-badge
              :model-value="(warningLevel.count ?? 0) > 0"
              location="top end"
              offset-x="5"
              offset-y="1"
              color="transparent"
            >
              <template #badge>
                <v-chip size="small" density="compact" class="pa-0 px-1">{{
                  warningLevel.count
                }}</v-chip>
              </template>
              <v-img width="30px" :src="warningLevel.icon"></v-img>
            </v-badge>
            <v-list-item-subtitle>
              {{ warningLevel.name }}
            </v-list-item-subtitle>
          </div>
        </v-list-item>
      </v-list>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useWarningLevelsStore } from '@/stores/warningLevels'
import { useTopologyNodesStore } from '@/stores/topologyNodes'
import { useParametersStore } from '@/stores/parameters'
import { nodeHasMap } from '@/lib/topology/nodes'
import { useRoute } from 'vue-router'
interface Props {
  nodeId?: string
}

const props = defineProps<Props>()
const warningLevelsStore = useWarningLevelsStore()
const topologyNodesStore = useTopologyNodesStore()
useParametersStore()

watch(
  () => props.nodeId,
  () => {
    warningLevelsStore.setTopologyNodeId(props.nodeId)
  },
)

function toggleThresholdPanel(): void {
  warningLevelsStore.showCrossingDetails =
    !warningLevelsStore.showCrossingDetails
}

const route = useRoute()

const showButton = computed(() => {
  const topologyNode = topologyNodesStore.getNodeById(props.nodeId ?? '')
  if (!topologyNode) return false
  // FIXME: A node can have display tabs, which mean that the map might not be visible even if the node has a map.
  // We check the route to check if the map display tab is selected.
  const isMapVisible =
    nodeHasMap(topologyNode) &&
    /Spatial.*Display/.test(route.name?.toString() ?? '')
  return isMapVisible
})
</script>

<style scoped>
.threshold-summary-container {
  width: 65px;
  display: grid;
  grid-template-rows: 1fr auto 1fr;
  height: 100%;
}

.threshold-summary-top {
  grid-row: 1;
  height: 36px;
  display: flex;
  justify-content: center;
}

.threshold-summary-center {
  grid-row: 2;
  height: 100%;
  align-self: center;
}

.warning-count {
  text-align: center;
}

.v-list-item-subtitle {
  font-size: 0.8em;
  color: var(--v-theme-on-surface);
  opacity: 1;
  width: 100%;
  text-align: center;
}

:deep(.v-list-item__content) {
  overflow: visible !important;
  width: 65px;
}

:deep(.v-chip__content) {
  width: 100%;
}
</style>
