<template>
  <AnalysisPlotChart
    :chart
    :config
    :series
    :settings
    v-bind="$attrs"
    @download="downloadChart"
    @remove="emit('remove')"
  >
    <template #overlay v-if="errorState">
      <v-alert :type="errorState.type" variant="flat" class="ma-8 border">
        {{ errorState.message }}
      </v-alert>
    </template>
  </AnalysisPlotChart>

  <TimeSeriesFileDownloadComponent
    v-model="showDownloadDialog"
    :filter
    :startTime
    :endTime
  />
</template>

<script setup lang="ts">
import AnalysisPlotChart from '@/components/analysis/AnalysisPlotChart.vue'
import TimeSeriesFileDownloadComponent from '@/components/download/TimeSeriesFileDownloadComponent.vue'
import type { CorrelationChart } from '@/lib/analysis'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import { useCorrelationChartData } from '@/services/useCorrelationChartData'
import { timeSeriesDisplayToChartConfig } from '@/lib/charts/timeSeriesDisplayToChartConfig'
import { computed, ref } from 'vue'
import { convertJSDateToFewsPiParameter } from '@/lib/date'
import { CORRELATION_LINE_ID } from '@/lib/analysis/correlation'

interface Props {
  chart: CorrelationChart
  settings: ComponentSettings
  startTime: Date
  endTime: Date
}

const props = defineProps<Props>()
const emit = defineEmits<{ remove: [] }>()

const showDownloadDialog = ref(false)

const filter = computed(() => ({
  ...props.chart.filter,
  startTime: convertJSDateToFewsPiParameter(props.startTime),
  endTime: convertJSDateToFewsPiParameter(props.endTime),
}))

const { series, description, rSquared, hasRegressionFit, errorState } =
  useCorrelationChartData(filter)

const chartConfig = computed(() =>
  timeSeriesDisplayToChartConfig(props.chart.subplot),
)

const config = computed(() => {
  const series = chartConfig.value.series
    .filter((s) => hasRegressionFit.value || s.id !== CORRELATION_LINE_ID)
    .map((s) => ({
      ...s,
      name: s.name
        .replace('{description}', description.value ?? 'unknown')
        .replace('{rSquared}', rSquared.value?.toFixed(3) ?? 'unknown'),
    }))

  return {
    ...chartConfig.value,
    series: [
      ...series.filter((s) => s.id !== CORRELATION_LINE_ID),
      ...series.filter((s) => s.id === CORRELATION_LINE_ID),
    ],
  }
})

function downloadChart() {
  showDownloadDialog.value = true
}
</script>
