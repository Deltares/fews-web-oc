<template>
  <div class="overflow-y-auto">
    <template v-for="chart in collection.charts" :key="chart.id">
      <HisCollectionChart
        v-if="chart.type === 'filter'"
        :collection
        :chart
        :subplot="chart.subplot"
        :series
        :zoomHandler
        :settings
        :domain="[startTime, endTime]"
      />
      <HisCorrelationChart
        v-if="chart.type === 'correlation'"
        :collection
        :chart
        :series
        :settings
        :startTime
        :endTime
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import HisCollectionChart from './HisCollectionChart.vue'
import HisCorrelationChart from './HisCorrelationChart.vue'
import type { Collection } from '@/lib/analysis'
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

defineProps<Props>()

const zoomHandler = new ZoomHandler({
  sharedZoomMode: ZoomMode.X,
})
</script>
