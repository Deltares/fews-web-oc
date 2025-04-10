<template>
  <template v-if="allThresholdCrossings.length">
    <Teleport to="#threshold-summary-top" defer>
      <v-btn
        @click="toggleThresholdPanel"
        :disabled="thresholdCrossings.length === 0"
        :icon="isPanelOpen ? 'mdi-menu-close' : 'mdi-menu-open'"
      />
    </Teleport>
    <div v-if="isPanelOpen" class="threshold-panel d-flex flex-column">
      <div class="threshold-panel-iterator ms-2 h-100">
        <v-virtual-scroll
          :items="thresholdCrossings"
          :item-height="itemHeightPx"
          height="100%"
        >
          <template v-slot:default="{ item: crossing }">
            <ThresholdItem
              :crossing="crossing"
              :location="getLocationById(crossing.locationId)"
              :item-height="itemHeightPx"
              v-model:expanded="
                expandedItems[`${crossing.locationId}-${crossing.parameterId}`]
              "
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
import type { Location } from '@deltares/fews-pi-requests'

interface Props {
  nodeId?: string
  filteredLocations?: Location[]
}

const props = defineProps<Props>()

const expandedItems = ref<Record<string, boolean>>({})

const selectedLevels = ref<LevelThresholdWarningLevels[]>(
  inject('selectedWarningLevels', []),
)
const selectedLevelIds = computed(() =>
  selectedLevels.value.map((level) => level.id),
)

const isPanelOpen = ref(false)

const ITEM_HEIGHT = 50
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
  const crossings =
    selectedLevelIds.value.length === 0
      ? allThresholdCrossings.value
      : allThresholdCrossings.value?.filter((crossing) =>
          selectedLevelIds.value.includes(crossing.warningLevelId ?? ''),
        )
  return crossings.sort((a, b) => b.severity - a.severity)
})

function getLocationById(locationId: string) {
  return props.filteredLocations?.find(
    (location) => location.locationId === locationId,
  )
}

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
  height: v-bind(panelHeightPx);
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

:deep(.v-list-item-title) {
  font-size: 0.875rem;
}

:deep(.v-card-subtitle) {
  font-size: 0.875rem;
}
</style>
