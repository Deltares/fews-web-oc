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
      <v-card-text class="pa-0 h-100">
        <div class="d-flex align-center justify-space-between ga-2 h-100">
          <div
            class="d-flex flex-column px-2 py-0 overflow-hidden"
          >
            <v-list-item-title>
              {{ crossing.locationId }}
            </v-list-item-title>
            <v-card-subtitle class="pa-0">
              {{ toHumanReadableDate(crossing.maxValueTime) }}
            </v-card-subtitle>
          </div>
          <div class="max-value flex-shrink-0" :style="{background: crossing.color, color: getContrastColor(crossing.color)}">
              {{ crossing.maxValue }}
          </div>
        </div>
        <ThresholdDataTable
          v-if="isCrossingExpanded"
          class="ms-2"
          :crossing="crossing"
        />
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { LevelThresholdCrossings } from '@deltares/fews-pi-requests'
import { computed, ref } from 'vue';
import { toHumanReadableDate } from '@/lib/date'
import { getContrastColor } from "@/lib/charts/styles"
import ThresholdDataTable from '@/components/general/ThresholdDataTable.vue';

interface Props {
  crossing: LevelThresholdCrossings
  itemHeight: string
}

const props = defineProps<Props>()

const itemHeight = computed(() => {return props.itemHeight})

const isCrossingExpanded = ref(false)

function toggleCrossingExpand() {
  // Only expand when no text is selected
  if (window.getSelection()?.toString() === '') {
    isCrossingExpanded.value = !isCrossingExpanded.value
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
  font-size: 0.75em;
}
</style>