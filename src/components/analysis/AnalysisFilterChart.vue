<template>
  <AnalysisPlotChart
    :chart
    :config
    :series
    :settings
    :zoomHandler
    :panHandler
    v-bind="$attrs"
    @update:x-domain="updateDomain"
    @download="downloadChart"
  />
  <TimeSeriesFileDownloadComponent
    v-model="showDownloadDialog"
    :filter
    :startTime="downloadDomain?.[0] ?? startTime"
    :endTime="downloadDomain?.[1] ?? endTime"
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
import { UpdateDomainEmits } from '@/lib/charts/domain'

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

const emit = defineEmits<UpdateDomainEmits>()

const downloadDomain = ref<[Date, Date]>()
function updateDomain(domain: [Date, Date]) {
  downloadDomain.value = domain
  emit('update:x-domain', domain)
}

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
