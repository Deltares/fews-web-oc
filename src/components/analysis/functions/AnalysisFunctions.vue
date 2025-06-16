<template>
  <div class="d-flex flex-column h-100">
    <v-tabs
      v-model="selectedFunction"
      variant="outlined"
      density="compact"
      mobile
      class="flex-0-0"
      align-tabs="center"
    >
      <v-tab
        v-for="tab in tabs"
        :key="tab.value"
        :value="tab.value"
        :prepend-icon="tab.icon"
        :text="tab.text"
        class="text-none"
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
        :charts
        :series
        :startTime
        :endTime
        :settings
        @addChart="emit('addChart', $event)"
        :isActive="isActive"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import AnalysisCorrelation from '@/components/analysis/functions/AnalysisCorrelation.vue'
import AnalysisTimeResampling from '@/components/analysis/functions/AnalysisTimeResampling.vue'
import { computed, ref, watch } from 'vue'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import type { Chart, CollectionEmits } from '@/lib/analysis'
import type { DataAnalysisDisplayElement } from '@deltares/fews-pi-requests'

interface Props {
  charts: Chart[]
  series: Record<string, Series>
  startTime?: Date
  endTime?: Date
  config: DataAnalysisDisplayElement
  settings: ComponentSettings
  isActive?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<CollectionEmits>()

const tabs = computed(() => {
  const toolboxes = props.config.toolBoxes
  return [
    {
      enabled: toolboxes?.correlation?.enabled ?? false,
      value: 'correlation',
      icon: 'mdi-function-variant',
      text: 'Correlation',
    },
    {
      enabled: toolboxes?.resampling?.enabled ?? false,
      value: 'time-resampling',
      icon: 'mdi-sigma',
      text: 'Time Resampling',
    },
  ].filter((tab) => tab.enabled)
})

const selectedFunction = ref(tabs.value[0]?.value)

watch(tabs, resetSelectedFunction)
watch(() => props.isActive, resetSelectedFunction)
function resetSelectedFunction() {
  selectedFunction.value = tabs.value[0]?.value
}
</script>
