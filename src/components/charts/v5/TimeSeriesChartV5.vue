<template>
  <div class="chart-engine-placeholder" role="status">
    Version 5 chart rendering is not available yet.
  </div>
</template>

<script setup lang="ts">
import type {
  TimeSeriesChartExportOptions,
  TimeSeriesChartProps,
} from '@/lib/charts/types/TimeSeriesChartProps'

defineProps<TimeSeriesChartProps>()
defineModel<[Date, Date]>('domain')
defineEmits<{
  'toggle-maximize': []
}>()

function getSvgElement() {
  return null
}

function exportImage(_options: TimeSeriesChartExportOptions) {
  return undefined
}

defineExpose({ getSvgElement, exportImage })
</script>

<style scoped>
.chart-engine-placeholder {
  display: grid;
  flex: 1 1 100%;
  min-height: 160px;
  place-items: center;
  border: 1px dashed currentColor;
  opacity: 0.7;
}
</style>
