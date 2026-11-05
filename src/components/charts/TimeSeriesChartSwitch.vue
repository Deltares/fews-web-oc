<template>
  <component
    :is="engine === 'v5' ? TimeSeriesChartV5 : TimeSeriesChartV4"
    :key="engine"
    ref="chart"
    v-bind="$attrs"
    :config
    :series
    :highlight-time="highlightTime"
    :vertical-profile="verticalProfile"
    :forecast-legend="forecastLegend"
    :group
    :settings
    :maximized
    v-model:domain="domain"
    @toggle-maximize="emit('toggle-maximize')"
  >
    <template #brush="{ margin }">
      <slot name="brush" :margin />
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, useTemplateRef } from 'vue'
import TimeSeriesChartV4 from './TimeSeriesChart.vue'
import { useUserSettingsStore } from '@/stores/userSettings'
import type {
  TimeSeriesChartExportOptions,
  TimeSeriesChartExpose,
  TimeSeriesChartProps,
} from '@/lib/charts/types/TimeSeriesChartProps'

defineOptions({ inheritAttrs: false })

const props = defineProps<TimeSeriesChartProps>()
const emit = defineEmits<{
  'toggle-maximize': []
}>()
const domain = defineModel<[Date, Date]>('domain')

const TimeSeriesChartV5 = defineAsyncComponent(
  () => import('./v5/TimeSeriesChartV5.vue'),
)
const userSettings = useUserSettingsStore()
const engine = computed(() => userSettings.chartEngine)
const chart = useTemplateRef<TimeSeriesChartExpose>('chart')

function getSvgElement() {
  return chart.value?.getSvgElement() ?? null
}

function exportImage(options: TimeSeriesChartExportOptions) {
  return chart.value?.exportImage(options)
}

defineExpose({ getSvgElement, exportImage })
</script>
