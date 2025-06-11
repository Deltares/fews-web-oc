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
      <AnalysisCorrelation
        v-if="selectedFunction === 'correlation'"
        :charts
        :series
        @addChart="emit('addChart', $event)"
        :isActive="isActive"
      />
      <AnalysisTimeResampling
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
import AnalysisCorrelation from '@/components/analysis/functions/AnalysisCorrelation.vue'
import AnalysisTimeResampling from '@/components/analysis/functions/AnalysisTimeResampling.vue'
import { ref, watch } from 'vue'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import type { Chart, CollectionEmits } from '@/lib/analysis'

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

const emit = defineEmits<CollectionEmits>()

const selectedFunction = ref('correlation')

watch(() => props.isActive, resetSelectedFunction)
function resetSelectedFunction() {
  selectedFunction.value = 'correlation'
}
</script>
