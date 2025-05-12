<template>
  <div class="h-100 pa-2 ga-2">
    <HisAutocomplete
      v-model="selectedTimeseries"
      :items="allSeries"
      label="First timeseries"
      :getItemValue="(item) => item"
      :getItemTitle="(item) => item.legend ?? ''"
    />

    <HisAutocomplete
      v-model="selectedSecondTimeseries"
      :items="allSeries"
      label="Second timeseries"
      :getItemValue="(item) => item"
      :getItemTitle="(item) => item.legend ?? ''"
    />

    <div class="d-flex pa-3">
      <v-spacer />
      <HisAddButton
        :disabled="!selectedTimeseries || !selectedSecondTimeseries"
        @click="addChart"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import HisAutocomplete from '@/components/his/HisAutocomplete.vue'
import HisAddButton from '@/components/his/HisAddButton.vue'
import { computed, ref, watch } from 'vue'
import { Chart, Dependant, DerivedChart } from '@/lib/his'
import { Series } from '@/lib/timeseries/timeSeries'
import {
  TimeSeriesDisplaySubplot,
  TimeSeriesDisplaySubplotItem,
} from '@deltares/fews-pi-requests'

interface Props {
  charts: Chart[]
  series: Record<string, Series>
  isActive?: boolean
}

const props = defineProps<Props>()

interface Emits {
  addChart: [chart: Chart]
}
const emit = defineEmits<Emits>()

const allSeries = computed(() =>
  props.charts
    .filter((chart) => chart.type === 'filter')
    .flatMap((chart) => chart.subplot.items)
    .filter(
      (series, index, self) =>
        index === self.findIndex((s) => s.request === series.request),
    ),
)

const selectedTimeseries = ref<TimeSeriesDisplaySubplotItem>()
const selectedSecondTimeseries = ref<TimeSeriesDisplaySubplotItem>()

watch(() => props.isActive, clearSelections)
function clearSelections() {
  selectedTimeseries.value = undefined
  selectedSecondTimeseries.value = undefined
}

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

  return subplot
}

function addChart() {
  if (!selectedTimeseries.value) return
  if (!selectedSecondTimeseries.value) return

  const id1 = selectedTimeseries.value?.request ?? ''
  const id2 = selectedSecondTimeseries.value?.request ?? ''
  const name1 = selectedTimeseries.value?.legend ?? ''
  const name2 = selectedSecondTimeseries.value?.legend ?? ''
  const unit1 = selectedTimeseries.value?.yAxis?.axisLabel
  const unit2 = selectedSecondTimeseries.value?.yAxis?.axisLabel
  const nameWithUnit1 = unit1 ? `${name1} - ${unit1}` : name1
  const nameWithUnit2 = unit2 ? `${name2} - ${unit2}` : name2

  const lineId = `${id1}-${id2}-correlation-line`
  const pointsId = `${id1}-${id2}-correlation-points`

  const dependant: Dependant = {
    seriesIds: [id1, id2],
    function: 'correlation',
  }

  const subplot = getSubplot(nameWithUnit1, nameWithUnit2, lineId, pointsId)

  const chart: DerivedChart = {
    id: crypto.randomUUID(),
    type: 'derived',
    title: `Correlation between ${name1} and ${name2}`,
    subplot,
    dependants: [dependant],
  }

  emit('addChart', chart)
}
</script>

<style scoped>
.his-correlation-container {
  display: grid;
  grid-template-rows: auto auto auto;
  height: 100%;
}
</style>
