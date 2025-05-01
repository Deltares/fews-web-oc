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

  <div class="d-flex pa-3">
    <v-spacer />
    <v-btn
      variant="tonal"
      :disabled="!selectedTimeseries && !selectedSecondTimeseries"
      prepend-icon="mdi-plus"
      text="Add to collection"
      @click="addChart"
    />
  </div>
</template>

<script setup lang="ts">
import HisAutocomplete from '@/components/his/HisAutocomplete.vue'
import { computed, ref } from 'vue'
import { ChartSeries } from '@/lib/charts/types/ChartSeries'
import { Chart, Dependant, DerivedChart } from '@/lib/his'
import { Series } from '@/lib/timeseries/timeSeries'
import {
  TimeSeriesDisplaySubplot,
  TimeSeriesDisplaySubplotItem,
} from '@deltares/fews-pi-requests'
import { timeSeriesDisplayToChartConfig } from '@/lib/charts/timeSeriesDisplayToChartConfig'

interface Props {
  charts: Chart[]
  series: Record<string, Series>
}

const props = defineProps<Props>()

interface Emits {
  addChart: [chart: Chart]
}
const emit = defineEmits<Emits>()

const allSeries = computed(() =>
  props.charts
    .flatMap((chart) => chart.config.series)
    .filter(
      (series, index, self) =>
        index === self.findIndex((s) => s.id === series.id),
    ),
)

const selectedTimeseries = ref<ChartSeries>()
const selectedSecondTimeseries = ref<ChartSeries>()

function getSubplot(
  leftName: string,
  rightName: string,
  lineId: string,
  pointsId: string,
) {
  const baseItem = {
    visibleInPlot: true,
    visibleInTable: true,
    yAxis: {
      axisPosition: 'left',
      axisLabel: leftName,
    },
  }

  const line: TimeSeriesDisplaySubplotItem = {
    ...baseItem,
    type: 'line',
    legend: 'Correlation line',
    color: '#080c80',
    lineStyle: 'solid;thick',
    lineWidth: 1.0,
    request: lineId,
    visibleInLegend: true,
  }

  const points: TimeSeriesDisplaySubplotItem = {
    ...baseItem,
    type: 'line',
    legend: 'Points',
    color: '#ff0000',
    markerStyle: 'solid',
    markerSize: 6,
    request: pointsId,
    visibleInLegend: false,
  }

  const subplot: TimeSeriesDisplaySubplot = {
    xAxis: {
      axisLabel: rightName,
    },
    items: [line, points],
  }

  return timeSeriesDisplayToChartConfig(subplot)
}

function addChart() {
  if (!selectedTimeseries.value) return
  if (!selectedSecondTimeseries.value) return

  const id1 = selectedTimeseries.value?.id
  const id2 = selectedSecondTimeseries.value?.id
  const name1 = selectedTimeseries.value?.name
  const name2 = selectedSecondTimeseries.value?.name

  const lineId = `${id1}-${id2}-correlation-line`
  const pointsId = `${id1}-${id2}-correlation-points`

  const dependant: Dependant = {
    seriesIds: [id1, id2],
    function: 'correlation',
  }

  const config = getSubplot(name1, name2, lineId, pointsId)

  const chart: DerivedChart = {
    id: crypto.randomUUID(),
    type: 'derived',
    title: `Correlation between ${selectedTimeseries.value?.name} and ${selectedSecondTimeseries.value?.name}`,
    config,
    dependants: [dependant],
  }

  emit('addChart', chart)
}

// function getSlopeInterceptLegend(
//   slope: number | undefined,
//   intercept: number | undefined,
//   precision: number = 3,
// ): string {
//   if (slope === undefined || intercept === undefined) {
//     return 'Correlation line'
//   }
//
//   const slopeText = `${slope.toFixed(precision)}x`
//   const interceptSign = intercept < 0 ? '- ' : '+ '
//   const interceptText = `${Math.abs(intercept).toFixed(precision)}`
//   return `f(x) = ${slopeText} ${interceptSign}${interceptText}`
// }
</script>
