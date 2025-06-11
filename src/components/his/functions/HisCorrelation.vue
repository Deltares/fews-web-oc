<template>
  <div class="h-100 pa-2 ga-2">
    <GroupSelect
      v-model="selectedTimeseries"
      :items="allSeries"
      label="Time Series 1"
      :getItemValue="(item) => item.series"
      :getItemTitle="(item) => item.series.legend ?? ''"
      :getItemGroupTitle="(item) => item.chartTitle"
      :groupBy="(item) => item.chartId"
    />

    <GroupSelect
      v-model="selectedSecondTimeseries"
      :items="allSeries"
      label="Time Series 2"
      :getItemValue="(item) => item.series"
      :getItemTitle="(item) => item.series.legend ?? ''"
      :getItemGroupTitle="(item) => item.chartTitle"
      :groupBy="(item) => item.chartId"
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
import HisAddButton from '@/components/his/HisAddButton.vue'
import GroupSelect from '@/components/general/GroupSelect.vue'
import { computed, ref, watch } from 'vue'
import { Chart, CorrelationChart, getValidFilterCharts } from '@/lib/analysis'
import { Series } from '@/lib/timeseries/timeSeries'
import {
  CorrelationFilter,
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

const allSeries = computed(() => getValidFilterCharts(props.charts))

const selectedTimeseries = ref<TimeSeriesDisplaySubplotItem>()
const selectedSecondTimeseries = ref<TimeSeriesDisplaySubplotItem>()

watch(() => props.isActive, clearSelections)
function clearSelections() {
  selectedTimeseries.value = undefined
  selectedSecondTimeseries.value = undefined
}

function addChart() {
  if (!selectedTimeseries.value) return
  if (!selectedSecondTimeseries.value) return

  const request1 = selectedTimeseries.value?.request ?? ''
  const request2 = selectedSecondTimeseries.value?.request ?? ''
  const name1 = selectedTimeseries.value?.legend ?? ''
  const name2 = selectedSecondTimeseries.value?.legend ?? ''

  const filter: CorrelationFilter = {
    timeSeriesIdXaxis: request1,
    timeSeriesIdYaxis: request2,
    regressionEquation: 'simple linear',
  }

  const chart: CorrelationChart = {
    id: crypto.randomUUID(),
    type: 'correlation',
    title: `Correlation between ${name1} and ${name2}`,
    timeSeriesNameXAxis: name1,
    timeSeriesNameYAxis: name2,
    filter,
    subplot: { items: [] },
  }

  emit('addChart', chart)
}
</script>
