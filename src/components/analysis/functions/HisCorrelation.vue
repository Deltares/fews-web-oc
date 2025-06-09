<template>
  <div class="h-100 pa-2 ga-2">
    <GroupSelect
      v-model="selectedTimeseries"
      :items="allSeries"
      label="X Axis Time Series"
      :getItemValue="(item) => item.series"
      :getItemTitle="(item) => item.series.legend ?? ''"
      :getItemGroupTitle="(item) => item.chartTitle"
      :groupBy="(item) => item.chartId"
    />

    <GroupSelect
      v-model="selectedSecondTimeseries"
      :items="allSeries"
      label="Y Axis Time Series"
      :getItemValue="(item) => item.series"
      :getItemTitle="(item) => item.series.legend ?? ''"
      :getItemGroupTitle="(item) => item.chartTitle"
      :groupBy="(item) => item.chartId"
    />

    <Autocomplete
      v-model="selectedRegressionEquation"
      :items="regressionEquations"
      label="Regression Equation"
      :getItemValue="(item) => item"
      :getItemTitle="(item) => item.label"
    />
    <div class="d-flex ga-2 mt-3">
      <v-number-input
        v-model="lowerThreshold"
        label="Lower Threshold"
        :min="0"
        :max="100"
        hide-details
        density="compact"
        variant="outlined"
        clearable
        control-variant="stacked"
      />

      <v-number-input
        v-model="upperThreshold"
        label="Upper Threshold"
        :min="0"
        :max="100"
        hide-details
        density="compact"
        variant="outlined"
        clearable
        control-variant="stacked"
      />
    </div>

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
import HisAddButton from '@/components/analysis/HisAddButton.vue'
import GroupSelect from '@/components/general/GroupSelect.vue'
import Autocomplete from '@/components/general/Autocomplete.vue'
import { VNumberInput } from 'vuetify/labs/components'
import { computed, ref, watch } from 'vue'
import { Chart, CorrelationChart, getValidFilterCharts } from '@/lib/analysis'
import { Series } from '@/lib/timeseries/timeSeries'
import {
  CorrelationFilter,
  TimeSeriesDisplaySubplotItem,
} from '@deltares/fews-pi-requests'
import {
  RegressionEquation,
  regressionEquations,
} from '@/lib/analysis/correlation'

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
const selectedRegressionEquation = ref<RegressionEquation>(
  regressionEquations[0],
)
const upperThreshold = ref<number | undefined>(undefined)
const lowerThreshold = ref<number | undefined>(undefined)

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

  const { value: regressionEquation } = selectedRegressionEquation.value

  const filter: CorrelationFilter = {
    timeSeriesIdXaxis: request1,
    timeSeriesIdYaxis: request2,
    regressionEquation,
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
