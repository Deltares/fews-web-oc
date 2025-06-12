<template>
  <AnalysisChartCard :chart="chart" v-bind="$attrs">
    <TimeSeriesChart
      :config
      :series
      :zoomHandler
      :settings="settings.charts.timeSeriesChart"
      :forecast-legend="chart.forecastLegend"
    />
  </AnalysisChartCard>
</template>

<script setup lang="ts">
import AnalysisChartCard from '@/components/analysis/AnalysisChartCard.vue'
import TimeSeriesChart from '@/components/charts/TimeSeriesChart.vue'
import { timeSeriesDisplayToChartConfig } from '@/lib/charts/timeSeriesDisplayToChartConfig'
import type { PlotChart } from '@/lib/analysis'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import type { ZoomHandler } from '@deltares/fews-web-oc-charts'
import { computed } from 'vue'
import { TimeSeriesDisplaySubplot } from '@deltares/fews-pi-requests'

interface Props {
  chart: PlotChart
  subplot: TimeSeriesDisplaySubplot
  series: Record<string, Series>
  zoomHandler?: ZoomHandler
  settings: ComponentSettings
  domain?: [Date, Date]
}

const props = defineProps<Props>()

const config = computed(() =>
  timeSeriesDisplayToChartConfig(props.subplot, props.domain),
)
</script>
