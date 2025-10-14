<template>
  <AnalysisPlotChart
    :chart
    :config
    :series
    :settings
    :zoomHandler
    :panHandler
    v-bind="$attrs"
    @download="downloadChart"
  />
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
import { timeSeriesDisplayToChartConfig } from '@/lib/charts/timeSeriesDisplayToChartConfig'
import type { FilterChart } from '@/lib/analysis'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import type { PanHandler, ZoomHandler } from '@deltares/fews-web-oc-charts'
import { computed, ref } from 'vue'
import { getSubplotWithDomain } from '@/lib/display'
import { useUserSettingsStore } from '@/stores/userSettings'

interface Props {
  chart: FilterChart
  series: Record<string, Series>
  zoomHandler?: ZoomHandler
  panHandler?: PanHandler
  settings: ComponentSettings
  startTime?: Date
  endTime?: Date
}

const props = defineProps<Props>()

const userSettings = useUserSettingsStore()
const showDownloadDialog = ref(false)

const domain = computed(
  () =>
    props.chart.domain ??
    (props.startTime && props.endTime
      ? ([props.startTime, props.endTime] as [Date, Date])
      : undefined),
)

const zoomHandler = computed(() =>
  props.chart.domain ? undefined : props.zoomHandler,
)

const config = computed(() =>
  getSubplotWithDomain(
    timeSeriesDisplayToChartConfig(props.chart.subplot),
    domain.value,
  ),
)

const filter = computed(() => ({
  timeSeriesIds: props.chart.requests.flatMap((r) => r.key ?? []),
  useDisplayUnits: userSettings.useDisplayUnits,
  convertDatum: userSettings.convertDatum,
  startTime: props.startTime,
  endTime: props.endTime,
}))

function downloadChart() {
  showDownloadDialog.value = true
}
</script>
