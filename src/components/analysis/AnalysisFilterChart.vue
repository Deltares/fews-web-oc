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
import { timeSeriesDisplayToChartConfig } from '@/lib/charts/timeSeriesDisplayToChartConfig'
import type { PlotChart } from '@/lib/analysis'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import type { ZoomHandler } from '@deltares/fews-web-oc-charts'
import { computed, ref } from 'vue'
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

const editing = ref(false)
</script>
