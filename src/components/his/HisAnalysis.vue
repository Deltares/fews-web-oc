<template>
  <div class="d-flex flex-column h-100">
    <v-tabs v-model="selectedFunction" variant="outlined" class="flex-0-0">
      <v-tab
        prepend-icon="mdi-function-variant"
        text="Correlation"
        class="text-none"
        value="correlation"
      />
      <v-tab
        prepend-icon="mdi-sigma"
        text="Time Resampling"
        class="text-none"
        value="time-resampling"
      />
    </v-tabs>
    <div class="flex-1-1 overflow-auto">
      <HisCorrelation
        v-if="selectedFunction === 'correlation'"
        :charts
        :series
        @addChart="emit('addChart', $event)"
        :isActive="isActive"
      />
      <HisTimeResampling
        v-if="selectedFunction === 'time-resampling'"
        :filterId
        :charts
        :series
        :startTime
        :endTime
        :settings
        @addFilter="emit('addFilter', $event)"
        :isLoading="isLoading"
        :isActive="isActive"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import HisCorrelation from '@/components/his/functions/HisCorrelation.vue'
import HisTimeResampling from '@/components/his/functions/HisTimeResampling.vue'
import { ref, watch } from 'vue'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import { Chart } from '@/lib/analysis'
import { filterActionsFilter } from '@deltares/fews-pi-requests'

interface Props {
  filterId?: string
  charts: Chart[]
  series: Record<string, Series>
  startTime?: Date
  endTime?: Date
  settings: ComponentSettings
  isLoading?: boolean
  isActive?: boolean
}

const props = defineProps<Props>()

interface Emits {
  addChart: [chart: Chart]
  addFilter: [filter: filterActionsFilter]
}
const emit = defineEmits<Emits>()

const selectedFunction = ref('correlation')

watch(() => props.isActive, resetSelectedFunction)
function resetSelectedFunction() {
  selectedFunction.value = 'correlation'
}
</script>
