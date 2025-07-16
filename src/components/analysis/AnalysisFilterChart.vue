<template>
  <AnalysisPlotChart
    :chart
    :config
    :series
    :settings
    :zoomHandler
    v-bind="$attrs"
    @download="downloadChart"
  />
  <TimeSeriesFileDownloadComponent :filter :startTime :endTime />
</template>

<script setup lang="ts">
import AnalysisPlotChart from '@/components/analysis/AnalysisPlotChart.vue'
import TimeSeriesFileDownloadComponent from '@/components/download/TimeSeriesFileDownloadComponent.vue'
import { timeSeriesDisplayToChartConfig } from '@/lib/charts/timeSeriesDisplayToChartConfig'
import type { FilterChart } from '@/lib/analysis'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import type { ZoomHandler } from '@deltares/fews-web-oc-charts'
import { computed } from 'vue'
import { getSubplotWithDomain } from '@/lib/display'
import { useUserSettingsStore } from '@/stores/userSettings'
import { useDownloadDialogStore } from '@/stores/downloadDialog'

interface Props {
  chart: FilterChart
  series: Record<string, Series>
  zoomHandler?: ZoomHandler
  settings: ComponentSettings
  startTime?: Date
  endTime?: Date
}

const props = defineProps<Props>()

const userSettings = useUserSettingsStore()
const downloadDialogStore = useDownloadDialogStore()

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
  downloadDialogStore.showDialog = true
}
</script>
