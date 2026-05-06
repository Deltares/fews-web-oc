<template>
  <AnalysisPlotChart
    v-model:domain="visibleDomain"
    :chart
    :config
    :series
    :brushSeries
    :fullBrushDomain
    :settings
    :zoomHandler
    :panHandler
    :startTime
    :endTime
    v-bind="$attrs"
    @download="downloadChart"
  />
  <TimeSeriesFileDownloadComponent
    v-model="showDownloadDialog"
    :filter
    :startTime="visibleDomain?.[0] ?? startTime"
    :endTime="visibleDomain?.[1] ?? endTime"
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
  brushSeries: Record<string, Series>
  fullBrushDomain: [Date, Date]
  zoomHandler?: ZoomHandler
  panHandler?: PanHandler
  settings: ComponentSettings
  startTime?: Date
  endTime?: Date
}

const props = defineProps<Props>()

const userSettings = useUserSettingsStore()
const showDownloadDialog = ref(false)

const xDomain = computed(
  () =>
    props.chart.domain ??
    (props.startTime && props.endTime
      ? ([props.startTime, props.endTime] as [Date, Date])
      : undefined),
)

const visibleDomain = defineModel<[Date, Date]>('domain')

const zoomHandler = computed(() =>
  props.chart.domain ? undefined : props.zoomHandler,
)

const config = computed(() =>
  getSubplotWithDomain(
    timeSeriesDisplayToChartConfig(props.chart.subplot),
    xDomain.value,
  ),
)

const filter = computed(() => ({
  timeSeriesIds: props.chart.requests
    .flatMap((r) => r.key ?? [])
    .filter((v, i, a) => a.indexOf(v) === i),
  useDisplayUnits: userSettings.useDisplayUnits,
  convertDatum: userSettings.convertDatum,
  startTime: props.startTime,
  endTime: props.endTime,
}))

function downloadChart() {
  showDownloadDialog.value = true
}
</script>
