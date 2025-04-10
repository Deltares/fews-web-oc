<template>
  <template
    v-if="
      warningLevelsStore.warningLevels.length &&
      warningLevelsStore.thresholdCrossings.length
    "
  >
    <Teleport to="#threshold-summary-top" defer>
      <v-btn
        @click="toggleThresholdPanel"
        :disabled="warningLevelsStore.selectedThresholdCrossings.length === 0"
        :icon="isPanelOpen ? 'mdi-menu-close' : 'mdi-menu-open'"
      />
    </Teleport>
    <div v-if="isPanelOpen" class="threshold-panel d-flex flex-column">
      <div class="threshold-panel-iterator ms-2 h-100">
        <v-virtual-scroll
          :items="warningLevelsStore.selectedThresholdCrossings"
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
import { ref } from 'vue'
import ThresholdItem from '@/components/general/ThresholdItem.vue'
import type { Location } from '@deltares/fews-pi-requests'
import { useWarningLevelsStore } from '@/stores/warningLevels'

interface Props {
  locations?: Location[]
}

const props = defineProps<Props>()

const expandedItems = ref<Record<string, boolean>>({})

const warningLevelsStore = useWarningLevelsStore()

const isPanelOpen = ref(false)

const ITEM_HEIGHT = 50
const itemHeightPx = `${ITEM_HEIGHT}px`
const ITEMS_PER_PANEL = 6
const panelHeightPx = `${ITEM_HEIGHT * ITEMS_PER_PANEL}px`

function getLocationById(locationId: string) {
  return props.locations?.find((location) => location.locationId === locationId)
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
