<template>
  <HisAutocomplete
    v-model="selectedTimeseries"
    :items="allSeries"
    label="First parameter"
    :getItemValue="(item) => item"
    :getItemTitle="(item) => item.name"
  />

  <HisAutocomplete
    v-model="selectedSecondTimeseries"
    :items="allSeries"
    label="Second parameter"
    :getItemValue="(item) => item"
    :getItemTitle="(item) => item.name"
  />

  <TimeSeriesChart
    v-if="selectedSeries && selectedSubplot"
    :config="selectedSubplot"
    :series="selectedSeries"
    :settings="chartSettings"
  />
</template>

<script setup lang="ts">
import HisAutocomplete from '@/components/his/HisAutocomplete.vue'
import TimeSeriesChart from '@/components/charts/TimeSeriesChart.vue'
import { computed, ref, watchEffect } from 'vue'
import { DisplayConfig } from '@/lib/display/DisplayConfig'
import { ComponentSettings } from '@/lib/topology/componentSettings'
import { ChartSeries } from '@/lib/charts/types/ChartSeries'
import { calculateCorrelationTimeSeries } from '@/lib/his'
import { Series } from '@/lib/timeseries/timeSeries'
import {
  TimeSeriesDisplaySubplot,
  TimeSeriesDisplaySubplotItem,
} from '@deltares/fews-pi-requests'
import { timeSeriesDisplayToChartConfig } from '@/lib/charts/timeSeriesDisplayToChartConfig'
import { SeriesData } from '@/lib/timeseries/types/SeriesData'
import { SeriesResourceType } from '@/lib/timeseries/types'
import { merge } from 'lodash-es'

interface Props {
  displayConfig?: DisplayConfig
  settings: ComponentSettings
  series: Record<string, Series>
}

const props = defineProps<Props>()

const chartSettings = computed(() =>
  merge({}, props.settings.charts.timeSeriesChart, {
    legend: {
      placement: 'inside upper left',
    },
  }),
)

const allSeries = computed(
  () => props.displayConfig?.subplots.flatMap((s) => s.series) ?? [],
)

const selectedTimeseries = ref<ChartSeries>()
const selectedSecondTimeseries = ref<ChartSeries>()

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

const firstSeriesData = computed(() => {
  if (!selectedTimeseries.value) return
  if (!selectedSecondTimeseries.value) return

  const id1 = selectedTimeseries.value.id
  return props.series[id1].data
})

const secondSeriesData = computed(() => {
  if (!selectedTimeseries.value) return
  if (!selectedSecondTimeseries.value) return

  const id2 = selectedSecondTimeseries.value.id
  return props.series[id2].data
})

const line = ref<SeriesData[]>()
const points = ref<SeriesData[]>()
const slope = ref<number>()
const intercept = ref<number>()

watchEffect(() => {
  if (!firstSeriesData.value || !secondSeriesData.value) return

  const correlation = calculateCorrelationTimeSeries(
    firstSeriesData.value,
    secondSeriesData.value,
  )

  line.value = correlation.line
  points.value = correlation.points
  slope.value = correlation.slope
  intercept.value = correlation.intercept
})

const selectedSeries = computed(() => {
  if (!line.value) return
  if (!points.value) return

  const newSeriesLine = new Series({
    type: SeriesResourceType.Derived,
  })
  newSeriesLine.lastUpdated = new Date()
  newSeriesLine.data = line.value

  const newSeriesPoints = new Series({
    type: SeriesResourceType.Derived,
  })
  newSeriesPoints.lastUpdated = new Date()
  newSeriesPoints.data = points.value

  return {
    [newIdLine.value]: newSeriesLine,
    [newIdPoints.value]: newSeriesPoints,
  }
})

const selectedSubplot = computed(() => {
  if (!selectedTimeseries.value) return
  if (!selectedSecondTimeseries.value) return

  const config = props.displayConfig?.subplots[0]
  if (!config) return

  const baseItem = {
    visibleInPlot: true,
    visibleInTable: true,
    yAxis: {
      axisPosition: 'left',
      axisLabel: selectedTimeseries.value.name,
    },
  }

  const lineLegend = getSlopeInterceptLegend(slope.value, intercept.value)

  const line: TimeSeriesDisplaySubplotItem = {
    ...baseItem,
    type: 'line',
    legend: lineLegend,
    color: '#080c80',
    lineStyle: 'solid;thick',
    lineWidth: 1.0,
    request: newIdLine.value,
    visibleInLegend: true,
  }

  const points: TimeSeriesDisplaySubplotItem = {
    ...baseItem,
    type: 'line',
    legend: 'Points',
    color: '#ff0000',
    markerStyle: 'solid',
    markerSize: 6,
    request: newIdPoints.value,
    visibleInLegend: false,
  }

  const subplot: TimeSeriesDisplaySubplot = {
    xAxis: {
      axisLabel: selectedSecondTimeseries.value.name,
    },
    items: [line, points],
  }

  return timeSeriesDisplayToChartConfig(subplot)
})

function getSlopeInterceptLegend(
  slope: number | undefined,
  intercept: number | undefined,
  precision: number = 3,
): string {
  if (slope === undefined || intercept === undefined) {
    return 'Correlation line'
  }

  const slopeText = `${slope.toFixed(precision)}x`
  const interceptSign = intercept < 0 ? '- ' : '+ '
  const interceptText = `${Math.abs(intercept).toFixed(precision)}`
  return `f(x) = ${slopeText} ${interceptSign}${interceptText}`
}
</script>
