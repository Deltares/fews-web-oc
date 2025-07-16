<template>
  <AnalysisPlotChart
    :chart
    :config
    :series
    :settings
    v-bind="$attrs"
    @download="downloadChart"
  />
  <TimeSeriesFileDownloadComponent :filter :startTime :endTime />
</template>

<script setup lang="ts">
import AnalysisPlotChart from '@/components/analysis/AnalysisPlotChart.vue'
import TimeSeriesFileDownloadComponent from '@/components/download/TimeSeriesFileDownloadComponent.vue'
import type { CorrelationChart } from '@/lib/analysis'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import { useCorrelationChartData } from '@/services/useCorrelationChartData'
import { timeSeriesDisplayToChartConfig } from '@/lib/charts/timeSeriesDisplayToChartConfig'
import { computed } from 'vue'
import { convertJSDateToFewsPiParameter } from '@/lib/date'
import { useDownloadDialogStore } from '@/stores/downloadDialog'

interface Props {
  chart: CorrelationChart
  settings: ComponentSettings
  startTime: Date
  endTime: Date
}

const props = defineProps<Props>()

const downloadDialogStore = useDownloadDialogStore()

const filter = computed(() => ({
  ...props.chart.filter,
  startTime: convertJSDateToFewsPiParameter(props.startTime),
  endTime: convertJSDateToFewsPiParameter(props.endTime),
}))

const { series, description, rSquared } = useCorrelationChartData(filter)

const chartConfig = computed(() =>
  timeSeriesDisplayToChartConfig(props.chart.subplot),
)

const config = computed(() => {
  return {
    ...chartConfig.value,
    series: chartConfig.value.series.map((s) => ({
      ...s,
      name: s.name
        .replace('{description}', description.value ?? 'unknown')
        .replace('{rSquared}', rSquared.value?.toFixed(3) ?? 'unknown'),
    })),
  }
})

function downloadChart() {
  downloadDialogStore.showDialog = true
}
</script>
