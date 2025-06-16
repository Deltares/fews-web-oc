<template>
  <div class="overflow-y-auto">
    <template v-for="chart in collection.charts" :key="chart.id">
      <AnalysisCollectionChart
        v-if="chart.type === 'filter'"
        :chart
        :subplot="chart.subplot"
        :series
        :zoomHandler
        :settings
        :domain="[startTime, endTime]"
        @remove="removeChart(chart)"
      />
      <AnalysisCorrelationChart
        v-if="chart.type === 'correlation'"
        :chart
        :settings
        :startTime
        :endTime
        @remove="removeChart(chart)"
      />
      <AnalysisAsyncChart
        v-if="chart.type === 'async'"
        :chart
        @addChart="emit('addChart', $event)"
        @remove="removeChart(chart)"
      />
      <AnalysisProductChart
        v-if="chart.type === 'product'"
        :chart
        @remove="removeChart(chart)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import AnalysisProductChart from './AnalysisProductChart.vue'
import AnalysisCollectionChart from './AnalysisCollectionChart.vue'
import AnalysisCorrelationChart from './AnalysisCorrelationChart.vue'
import AnalysisAsyncChart from './AnalysisAsyncChart.vue'
import type { Chart, Collection, CollectionEmits } from '@/lib/analysis'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import { ZoomHandler, ZoomMode } from '@deltares/fews-web-oc-charts'

interface Props {
  collection: Collection
  series: Record<string, Series>
  settings: ComponentSettings
  startTime: Date
  endTime: Date
}

const props = defineProps<Props>()

const emit = defineEmits<CollectionEmits>()

const zoomHandler = new ZoomHandler({
  sharedZoomMode: ZoomMode.X,
})

function removeChart(chart: Chart) {
  props.collection.charts.splice(
    props.collection.charts.findIndex((c) => c === chart),
    1,
  )
}
</script>
