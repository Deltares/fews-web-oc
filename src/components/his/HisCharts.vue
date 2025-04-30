<template>
  <div class="overflow-auto">
    <TimeSeriesChart
      v-for="subplot in subplots"
      :config="subplot"
      :series="series"
      :zoomHandler="sharedZoomHandler"
      :settings="settings.charts.timeSeriesChart"
    />
  </div>
</template>

<script setup lang="ts">
import TimeSeriesChart from '@/components/charts/TimeSeriesChart.vue'
import { ChartConfig } from '@/lib/charts/types/ChartConfig'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import { ZoomHandler, ZoomMode } from '@deltares/fews-web-oc-charts'

interface Props {
  subplots: ChartConfig[]
  series: Record<string, Series>
  settings: ComponentSettings
}

defineProps<Props>()

const sharedZoomHandler = new ZoomHandler({
  sharedZoomMode: ZoomMode.X,
})
</script>
