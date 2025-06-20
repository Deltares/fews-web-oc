<template>
  <AnalysisChartCard :chart="chart" v-bind="$attrs" @edit="editing = true">
    <TimeSeriesChart
      :config
      :series
      :zoomHandler
      :settings="settings.charts.timeSeriesChart"
    />
    <AnalysisChartEdit v-model="editing" :chart />
  </AnalysisChartCard>
</template>

<script setup lang="ts">
import AnalysisChartCard from '@/components/analysis/AnalysisChartCard.vue'
import AnalysisChartEdit from '@/components/analysis/AnalysisChartEdit.vue'
import TimeSeriesChart from '@/components/charts/TimeSeriesChart.vue'
import type { PlotChart } from '@/lib/analysis'
import { ChartConfig } from '@/lib/charts/types/ChartConfig'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import type { ZoomHandler } from '@deltares/fews-web-oc-charts'
import { ref } from 'vue'

interface Props {
  chart: PlotChart
  series: Record<string, Series>
  zoomHandler?: ZoomHandler
  settings: ComponentSettings
  config: ChartConfig
}

defineProps<Props>()

const editing = ref(false)
</script>
