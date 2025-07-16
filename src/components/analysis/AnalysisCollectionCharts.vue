<template>
  <div class="overflow-y-auto">
    <template v-for="chart in collection.charts" :key="chart.id">
      <AnalysisFilterChart
        v-if="chart.type === 'filter'"
        :chart
        :subplot="chart.subplot"
        :series
        :zoomHandler
        :settings
        :startTime
        :endTime
        @remove="removeChart(chart)"
      />
      <AnalysisCorrelationChart
        v-else-if="chart.type === 'correlation'"
        :chart
        :settings
        :startTime
        :endTime
        @remove="removeChart(chart)"
      />
      <AnalysisAsyncChart
        v-else-if="chart.type === 'async'"
        :chart
        @addChart="emit('addChart', $event)"
        @remove="removeChart(chart)"
      />
      <AnalysisProductChart
        v-else-if="chart.type === 'product'"
        :chart
        @remove="removeChart(chart)"
      />
      <AnalysisUnsupportedChart
        v-else
        :chart="chart"
        @remove="removeChart(chart)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import AnalysisProductChart from './AnalysisProductChart.vue'
import AnalysisFilterChart from './AnalysisFilterChart.vue'
import AnalysisCorrelationChart from './AnalysisCorrelationChart.vue'
import AnalysisAsyncChart from './AnalysisAsyncChart.vue'
import AnalysisUnsupportedChart from './AnalysisUnsupportedChart.vue'
import type { Chart, Collection, CollectionEmits } from '@/lib/analysis'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import { ZoomHandler, ZoomMode } from '@deltares/fews-web-oc-charts'

interface Props {
  series: Record<string, Series>
  settings: ComponentSettings
  startTime: Date
  endTime: Date
}

defineProps<Props>()

const collection = defineModel<Collection>('collection', {
  required: true,
})

const emit = defineEmits<CollectionEmits>()

const zoomHandler = new ZoomHandler({
  sharedZoomMode: ZoomMode.X,
})

function removeChart(chart: Chart) {
  collection.value.charts.splice(
    collection.value.charts.findIndex((c) => c === chart),
    1,
  )
}
</script>
