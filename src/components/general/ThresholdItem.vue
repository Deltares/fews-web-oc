<template>
  <div class="thresold-panel-card">
    <v-card
      border
      :key="`${crossing.locationId}-${crossing.parameterId}`"
      flat
      density="compact"
      @click="toggleCrossingExpand"
      :ripple="false"
      class="w-100"
    >
      <v-card-text class="pa-0 h-100">
        <div class="d-flex align-center justify-space-between ga-2 h-100">
          <div class="d-flex flex-column px-2 py-0 overflow-hidden">
            <v-list-item-title>
              {{ location?.locationName ?? crossing.locationId }}
            </v-list-item-title>
            <v-card-subtitle class="pa-0">
              {{ toHumanReadableDate(crossing.maxValueTime) }}
            </v-card-subtitle>
          </div>
          <div
            class="max-value flex-shrink-0"
            :style="{
              background: crossing.color,
              color: getContrastColor(crossing.color),
            }"
          >
            {{ crossing.maxValue }}
          </div>
        </div>
        <ThresholdDataTable v-if="expanded" class="ms-2" :crossing="crossing" />
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { LevelThresholdCrossings } from '@deltares/fews-pi-requests'
import { computed } from 'vue'
import { toHumanReadableDate } from '@/lib/date'
import { getContrastColor } from '@/lib/charts/styles'
import ThresholdDataTable from '@/components/general/ThresholdDataTable.vue'
import type { Location } from '@deltares/fews-pi-requests'

interface Props {
  crossing: LevelThresholdCrossings
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
</script>

<style scoped>
.max-value {
  height: v-bind(itemHeight);
  width: 50px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.875em;
}
</style>
