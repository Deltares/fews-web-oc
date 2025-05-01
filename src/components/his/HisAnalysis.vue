<template>
  <v-tabs v-model="selectedFunction" variant="outlined">
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
  <v-tabs-window v-model="selectedFunction" class="pt-1">
    <v-tabs-window-item value="correlation">
      <HisCorrelation :charts :series @addChart="emit('addChart', $event)" />
    </v-tabs-window-item>
    <v-tabs-window-item value="time-resampling">
      <HisTimeResampling
        :filterId
        :charts
        :series
        :startTime
        :endTime
        :settings
        @addFilter="emit('addFilter', $event)"
      />
    </v-tabs-window-item>
  </v-tabs-window>
</template>

<script setup lang="ts">
import HisCorrelation from '@/components/his/functions/HisCorrelation.vue'
import HisTimeResampling from '@/components/his/functions/HisTimeResampling.vue'
import { ref } from 'vue'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import { Chart } from '@/lib/his'
import { filterActionsFilter } from '@deltares/fews-pi-requests'

interface Props {
  filterId?: string
  charts: Chart[]
  series: Record<string, Series>
  startTime?: Date
  endTime?: Date
  settings: ComponentSettings
}

defineProps<Props>()

interface Emits {
  addChart: [chart: Chart]
  addFilter: [filter: filterActionsFilter]
}
const emit = defineEmits<Emits>()

const selectedFunction = ref('correlation')
</script>
