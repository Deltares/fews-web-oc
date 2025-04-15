<template>
  <template
    v-if="
      warningLevelsStore.warningLevels.length &&
      warningLevelsStore.thresholdCrossings.length
    "
  >
    <div
      v-if="warningLevelsStore.showCrossingDetails"
      class="threshold-panel d-flex flex-column"
    >
      <div class="threshold-panel-iterator h-100">
        <v-virtual-scroll
          :items="thresholdItems"
          :item-height="itemHeightPx"
          height="100%"
          class="px-2 pt-2"
        >
          <template v-slot:default="{ item: crossing }">
            <ThresholdItem
              :crossing="crossing"
              :location="getLocationById(crossing.locationId)"
              :item-height="itemHeightPx"
              v-model:expanded="expandedItems[crossing.locationId]"
            />
          </template>
        </v-virtual-scroll>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ThresholdItem from '@/components/general/ThresholdItem.vue'
import type {
  LevelThresholdCrossings,
  Location,
} from '@deltares/fews-pi-requests'
import { useWarningLevelsStore } from '@/stores/warningLevels'

interface CrossingItem {
  locationId: string
  crossings: Omit<LevelThresholdCrossings, 'locationId'>[]
}

interface Props {
  locations?: Location[]
}

const props = defineProps<Props>()

const expandedItems = ref<Record<string, boolean>>({})

const warningLevelsStore = useWarningLevelsStore()

const ITEM_HEIGHT = 50
const itemHeightPx = `${ITEM_HEIGHT}px`
const ITEMS_PER_PANEL = 6
const panelHeightPx = `${ITEM_HEIGHT * ITEMS_PER_PANEL}px`

function getLocationById(locationId: string) {
  return props.locations?.find((location) => location.locationId === locationId)
}

const selectedLocationIds = computed(() => {
  // All locations that have a crossing with the selected warning level
  // There can be more selected locations than shown on the map,
  // since the map only shows the location based on the highest severity
  return warningLevelsStore.selectedThresholdCrossings.map(
    (crossing) => crossing.locationId,
  )
})

const thresholdItems = computed<CrossingItem[]>(() => {
  // sorting is not needed, since the selectedThresholdCrossings, and therefore the selectedLocationIds, are already sorted based on severity
  const thresholdItems = selectedLocationIds.value.map((locationId) => {
    const crossings = warningLevelsStore.selectedThresholdCrossings.filter(
      (crossing) => crossing.locationId === locationId,
    )
    return {
      locationId,
      crossings,
    }
  })
  return thresholdItems
})
</script>

<style scoped>
.threshold-panel {
  width: 230px;
  position: absolute;
  top: 2px;
  right: 2px;
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
