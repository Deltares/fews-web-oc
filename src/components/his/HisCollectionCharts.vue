<template>
  <div class="overflow-y-auto">
    <HisCollectionChart
      v-for="chart in collection.charts"
      :key="chart.id"
      :collection
      :chart
      :series
      :zoomHandler="chart.type === 'filter' ? zoomHandler : undefined"
      :settings
      :startTime
      :endTime
    />
  </div>
</template>

<script setup lang="ts">
import HisCollectionChart from './HisCollectionChart.vue'
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
