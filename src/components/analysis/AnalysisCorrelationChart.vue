<template>
  <AnalysisPlotChart :chart :config :series :settings v-bind="$attrs" />
</template>

<script setup lang="ts">
import AnalysisPlotChart from '@/components/analysis/AnalysisPlotChart.vue'
import type { CorrelationChart } from '@/lib/analysis'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import { useCorrelationChartData } from '@/services/useCorrelationChartData'
import { timeSeriesDisplayToChartConfig } from '@/lib/charts/timeSeriesDisplayToChartConfig'
import { computed } from 'vue'

interface Props {
  chart: CorrelationChart
  settings: ComponentSettings
  startTime: Date
  endTime: Date
}

const props = defineProps<Props>()

const { series, description, rSquared } = useCorrelationChartData(
  () => props.chart,
  () => props.startTime,
  () => props.endTime,
)

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
</script>
