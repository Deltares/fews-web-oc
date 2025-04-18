<template>
  <v-btn-toggle v-model="selectedFunction" class="ma-3" variant="outlined">
    <v-btn
      prepend-icon="mdi-function-variant"
      text="Correlation"
      class="text-none"
      value="correlation"
    />
    <v-btn
      prepend-icon="mdi-sigma"
      text="Time Resampling"
      class="text-none"
      value="time-resampling"
    />
  </v-btn-toggle>
  <v-tabs-window v-model="selectedFunction">
    <v-tabs-window-item value="correlation">
      <HisCorrelation :displayConfig :series :settings />
    </v-tabs-window-item>
    <v-tabs-window-item value="time-resampling">
      <HisTimeResampling :displayConfig :series :settings />
    </v-tabs-window-item>
  </v-tabs-window>
</template>

<script setup lang="ts">
import HisCorrelation from '@/components/his/functions/HisCorrelation.vue'
import HisTimeResampling from '@/components/his/functions/HisTimeResampling.vue'
import { ref } from 'vue'
import type { DisplayConfig } from '@/lib/display/DisplayConfig'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { ComponentSettings } from '@/lib/topology/componentSettings'

interface Props {
  displayConfig: DisplayConfig
  series: Record<string, Series>
  settings: ComponentSettings
}

defineProps<Props>()

const selectedFunction = ref('correlation')
</script>
