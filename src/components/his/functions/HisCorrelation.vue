<template>
  <div>
    <HisAutocomplete
      v-model="selectedTimeseries"
      :items="allSeries"
      label="First series"
      :getItemValue="(item) => item"
      :getItemTitle="(item) => item.name"
    />

    <HisAutocomplete
      v-model="selectedSecondTimeseries"
      :items="allSeries"
      label="Second series"
      :getItemValue="(item) => item"
      :getItemTitle="(item) => item.name"
    />

    <TimeSeriesChart
      v-if="selectedSeries && selectedSubplot"
      :config="selectedSubplot"
      :series="selectedSeries"
      :settings="settings.timeSeriesChart"
      :key="`${newIdLine}-${newIdPoints}`"
      hideLegend
    />
  </div>
</template>

<script setup lang="ts">
import HisAutocomplete from '@/components/his/HisAutocomplete.vue'
import TimeSeriesChart from '@/components/charts/TimeSeriesChart.vue'
import { ChartSeries } from '@/lib/charts/types/ChartSeries'
import { calculateCorrelationTimeSeries } from '@/lib/his'
import { useTimeSeries } from '@/services/useTimeSeries'
import { ChartConfig } from '@/lib/charts/types/ChartConfig'
import { AxisType } from '@deltares/fews-web-oc-charts'
import { ChartsSettings } from '@/lib/topology/componentSettings'
import { computed, ref } from 'vue'
import { DisplayConfig } from '@/lib/display/DisplayConfig'
import { configManager } from '@/services/application-config'
import { request } from 'http'

interface Props {
  displayConfig: DisplayConfig
  settings: ChartsSettings
}

const props = defineProps<Props>()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const requests = computed(() => {
  if (selectedTimeseries.value === undefined) return []
  if (selectedSecondTimeseries.value === undefined) return []
  return [
    getRequestForTimeSeries(selectedTimeseries.value),
    getRequestForTimeSeries(selectedSecondTimeseries.value),
  ]
})

function getRequestForTimeSeries(series: ChartSeries) {
  const id = series.dataResources[0]
  return props.displayConfig.requests.find((request) => {
    request.id === id
  })
}

const { series } = useTimeSeries(
  baseUrl,
  requests,
  () => new Date(),
  () => ({}),
)

const allSeries = computed(
  () => props.displayConfig.subplots.flatMap((s) => s.series) ?? [],
)

const selectedTimeseries = ref<ChartSeries>()
const selectedSecondTimeseries = ref<ChartSeries>()

const selectedSeries = computed(() => {
  if (!selectedTimeseries.value) return
  if (!selectedSecondTimeseries.value) return

  const id1 = selectedTimeseries.value.id
  const series1 = series.value[id1]

  const id2 = selectedSecondTimeseries.value?.id
  const series2 = series.value[id2]

  if (!series1?.data || !series2?.data) return

  const { line, points } = calculateCorrelationTimeSeries(
    series1.data,
    series2.data,
  )

  const newSeriesLine = series1.clone()
  newSeriesLine.lastUpdated = new Date()
  newSeriesLine.data = line

  const newSeriesPoints = series1.clone()
  newSeriesPoints.lastUpdated = new Date()
  newSeriesPoints.data = points

  return {
    [newIdLine.value]: newSeriesLine,
    [newIdPoints.value]: newSeriesPoints,
  }
})

const selectedSubplot = computed(() => {
  if (!selectedTimeseries.value) return
  if (!selectedSecondTimeseries.value) return

  const config = props.displayConfig.subplots[0]
  if (!config) return

  const res: ChartConfig = {
    ...config,
    yAxis: [
      {
        ...config.yAxis?.[0],
        domain: undefined,
        label: 'Correlation',
      },
    ],
    xAxis: [
      {
        ...config.xAxis?.[0],
        domain: undefined,
        type: AxisType.value,
      },
    ],
    series: [
      {
        ...config.series[0],
        dataResources: [newIdLine.value],
        id: newIdLine.value,
        visibleInLegend: false,
        type: 'line',
      },
      {
        ...config.series[1],
        dataResources: [newIdPoints.value],
        id: newIdPoints.value,
        visibleInLegend: false,
        type: 'marker',
      },
    ],
  }
  return res
})

const newIdLine = computed(() => {
  if (!selectedTimeseries.value) return 'correlation'
  if (!selectedSecondTimeseries.value) return 'correlation'

  return `${selectedTimeseries.value.id}-${selectedSecondTimeseries.value.id}-correlation-line`
})

const newIdPoints = computed(() => {
  if (!selectedTimeseries.value) return 'correlation'
  if (!selectedSecondTimeseries.value) return 'correlation'

  return `${selectedTimeseries.value.id}-${selectedSecondTimeseries.value.id}-correlation-points`
})
</script>
