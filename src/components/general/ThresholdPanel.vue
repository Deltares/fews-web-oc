<template>
  <template v-if="allThresholdCrossings.length">
    <Teleport to="#threshold-summary-top" defer>
      <v-btn class="ms-0 ps-0" @click="toggleThresholdPanel" :disabled="thresholdCrossings.length === 0">
        <v-icon v-if="!isPanelOpen">mdi-menu-open</v-icon>
        <v-icon v-else>mdi-menu-close</v-icon>
      </v-btn>
    </Teleport>
    <div v-if="isPanelOpen" class="threshold-panel d-flex flex-column">
      <div
        class="threshold-panel-iterator ms-2 h-100"
      >
        <v-virtual-scroll
          :items="thresholdCrossings"
          :item-height="itemHeightPx"
          height="100%"
        >
          <template v-slot:default="{ item: crossing }">
            <ThresholdItem
              :crossing="crossing"
              :item-height="itemHeightPx"
              v-model:expanded="expandedItems[`${crossing.locationId}-${crossing.parameterId}`]"
            />
          </template>
        </v-virtual-scroll>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { useTopologyThresholds } from '@/services/useTopologyThresholds'
import { configManager } from '@/services/application-config'
import { computed, inject, ref } from 'vue'
import { LevelThresholdWarningLevels } from '@deltares/fews-pi-requests'
import ThresholdItem from '@/components/general/ThresholdItem.vue'

interface Props {
  nodeId?: string
}

const props = defineProps<Props>()

const expandedItems = ref<Record<string, boolean>>({})
  
const selectedLevels = ref<LevelThresholdWarningLevels[]>(inject('selectedWarningLevels', []))
const selectedLevelIds = computed(() => selectedLevels.value.map((level) => level.id))

const isPanelOpen = ref(false)

const ITEM_HEIGHT = 40
const itemHeightPx = `${ITEM_HEIGHT}px`
const ITEMS_PER_PANEL = 6
const panelHeightPx = `${ITEM_HEIGHT * ITEMS_PER_PANEL}px`
  

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { thresholds: thresholdsArray } = useTopologyThresholds(
  baseUrl,
  () => props.nodeId,
)

const allThresholdCrossings = computed(() => {
  if (thresholdsArray.value === undefined || thresholdsArray.value.length === 0)
  return []
  return thresholdsArray.value[0].levelThresholdCrossings ?? []
})

const thresholdCrossings = computed(() => {
  let crossings = []
  if (selectedLevelIds.value.length === 0) {
    crossings = allThresholdCrossings.value.sort((a, b) => b.severity - a.severity)
  }
  else {
    crossings = allThresholdCrossings.value?.filter((crossing) => selectedLevelIds.value.includes(crossing.warningLevelId ?? ''))
  }
  return crossings.sort((a, b) => b.severity - a.severity)
})

function toggleThresholdPanel(): void {
  isPanelOpen.value = !isPanelOpen.value
}
</script>

<style scoped>
.threshold-panel {
  width: 230px;
  position: absolute;
  top: 5px;
  right: 5px;
  z-index: 1000;
  height: v-bind(panelHeightPx)
}

.text-wrap {
  white-space: normal;
}

.text-wrap-no {
  white-space: nowrap;
}

.v-card--disabled > :not(.v-card__loader) {
  opacity: 1 !important;
}

.threshold-panel-iterator > * {
  height: 100%;
}

.thresold-panel-card {
  padding-bottom: 2px;
}

:deep(.v-list-item-title) {
  font-size: 0.8em;
}

:deep(.v-card-subtitle) {
  font-size: 0.75em;
}
</style>
