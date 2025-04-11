<template>
  <div class="thresold-panel-card">
    <v-card
      border
      :key="crossing.locationId"
      flat
      density="compact"
      @click="toggleCrossingExpand"
      :ripple="false"
      class="w-100"
    >
      <v-card-text class="pa-0 h-100 w-100">
        <div
          class="parameter-item d-flex align-center justify-space-between w-100"
        >
          <div class="d-flex flex-column ps-2 py-0 overflow-hidden w-100 pe-1">
            <div class="d-flex">
              <v-list-item-title>
                {{ location?.locationName ?? crossing.locationId }}
              </v-list-item-title>
              <v-spacer />
              <v-chip
                v-if="crossing.crossings.length > 1"
                size="small"
                label
                density="compact"
              >
                {{ crossing.crossings.length }}
              </v-chip>
            </div>
            <div class="d-flex">
              <v-card-subtitle class="pa-0">
                {{ toShortHumanReadableDate(mostSevereCrossing.maxValueTime) }}
              </v-card-subtitle>
              <v-spacer />
              <v-card-subtitle class="pa-0">
                {{ mostSevereCrossing.maxValue }} {{ parameterUnit }}
              </v-card-subtitle>
            </div>
          </div>
        </div>
        <ThresholdDataTable
          v-if="expanded"
          v-for="levelCrossing in crossing.crossings"
          :key="levelCrossing.parameterId"
          :crossing="levelCrossing"
        />
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { LevelThresholdCrossings } from '@deltares/fews-pi-requests'
import { computed } from 'vue'
import { toShortHumanReadableDate } from '@/lib/date'
import ThresholdDataTable from '@/components/general/ThresholdDataTable.vue'
import type { Location } from '@deltares/fews-pi-requests'
import { useParametersStore } from '@/stores/parameters'

interface CrossingItem {
  locationId: string
  crossings: Omit<LevelThresholdCrossings, 'locationId'>[]
}

interface Props {
  crossing: CrossingItem
  location?: Location
  itemHeight: string
}

const props = defineProps<Props>()

const expanded = defineModel<boolean>('expanded', {
  required: false,
  default: false,
})

const itemHeight = computed(() => {
  return props.itemHeight
})

function toggleCrossingExpand() {
  // Only expand when no text is selected
  if (window.getSelection()?.toString() === '') {
    expanded.value = !expanded.value
  }
}

const mostSevereCrossing = computed(() => {
  return props.crossing.crossings[0]
})

const crossingColor = computed(() => {
  return mostSevereCrossing.value.color
})

const parameterStore = useParametersStore()
const parameter = computed(() => {
  return parameterStore.byId(mostSevereCrossing.value.parameterId)
})

const parameterUnit = computed(() => {
  return parameter.value?.unit
})
</script>

<style scoped>
.thresold-panel-card {
  padding-bottom: 3px;
}

.parameter-item {
  border-left: 5px solid v-bind(crossingColor);
  height: v-bind(itemHeight);
}
</style>
