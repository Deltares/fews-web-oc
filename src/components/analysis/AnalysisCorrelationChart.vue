<template>
  <div
    v-if="isLoading"
    class="chart-container d-flex align-center justify-center"
    role="status"
  >
    <v-progress-circular indeterminate />
  </div>
  <template v-else-if="hasScatterPoints">
    <v-alert
      v-if="statusDescription"
      type="warning"
      variant="tonal"
      class="ma-4"
    >
      {{ statusDescription }}
    </v-alert>
    <AnalysisPlotChart
      :chart
      :config
      :series
      :settings
      v-bind="$attrs"
      @download="downloadChart"
      @remove="emit('remove')"
    />
  </template>
  <div
    v-else
    class="chart-container d-flex align-center justify-center"
    role="status"
  >
    <v-alert type="warning" variant="tonal" class="ma-4">
      {{
        error
          ? t('analysis.correlation.loadError')
          : (statusDescription ?? t('analysis.correlation.noData'))
      }}
    </v-alert>
  </div>
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
import { computed, ref, watch } from 'vue'
import { convertJSDateToFewsPiParameter } from '@/lib/date'
import { CORRELATION_LINE_ID } from '@/lib/analysis/correlation'
import { useI18n } from 'vue-i18n'
import { useAlertsStore } from '@/stores/alerts'

interface Props {
  chart: CorrelationChart
  settings: ComponentSettings
  startTime: Date
  endTime: Date
}

const props = defineProps<Props>()
const { t } = useI18n()
const emit = defineEmits<{ remove: [] }>()
const alertsStore = useAlertsStore()

const showDownloadDialog = ref(false)

const filter = computed(() => ({
  ...props.chart.filter,
  startTime: convertJSDateToFewsPiParameter(props.startTime),
  endTime: convertJSDateToFewsPiParameter(props.endTime),
}))

const {
  series,
  description,
  statusDescription,
  rSquared,
  hasScatterPoints,
  hasRegressionFit,
  isLoading,
  error,
} = useCorrelationChartData(filter)

watch(
  [error, statusDescription, isLoading, hasScatterPoints],
  ([loadError, statusMessage, loading, hasPoints]) => {
    if (loading || (!loadError && hasPoints)) return

    alertsStore.addAlert({
      type: loadError ? 'error' : 'warning',
      message: loadError
        ? t('analysis.correlation.loadError')
        : (statusMessage ?? t('analysis.correlation.noData')),
    })
    emit('remove')
  },
)

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
