<template>
  <div class="d-flex flex-column h-100 pa-2 ga-2">
    <GroupSelect
      v-model="selectedTimeseries"
      :items="allSeries"
      label="Time Series"
      :getItemValue="(item) => item"
      :getItemTitle="(item) => item.series.legend ?? ''"
      :getItemColor="(item) => item.series.color ?? 'black'"
      :getItemGroupTitle="(item) => item.chart.title"
      :groupBy="(item) => item.chart.id"
      :multiple="true"
    />

    <div class="d-flex ga-2 w-100">
      <Autocomplete
        v-model="selectedResamplingMethods"
        :items="resamplingMethods"
        label="Resampling Methods"
        :getItemValue="(item) => item"
        :getItemTitle="(item) => item.label"
        :multiple="true"
        class="w-50"
      />

      <Autocomplete
        v-model="selectedResamplingTimeSteps"
        :items="availableTimeStepsStore.resamplingTimeSteps"
        label="Time Steps"
        :getItemValue="(item) => item"
        :getItemTitle="(item) => item.label"
        :multiple="true"
        class="w-50"
      />
    </div>

    <v-spacer />
    <div class="d-flex">
      <v-spacer />
      <AnalysisAddToButton
        :charts
        :filters
        :loadingNewCharts="isLoadingNewCharts"
        :loadingAddToChart="isLoadingAddToChart"
        @addToChart="addFilter"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import Autocomplete from '@/components/general/Autocomplete.vue'
import GroupSelect from '@/components/general/GroupSelect.vue'
import AnalysisAddToButton from '@/components/analysis/AnalysisAddToButton.vue'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import { computed, ref, watch } from 'vue'
import { type TimeSteps } from '@deltares/fews-pi-requests'
import {
  type ResamplingMethod,
  resamplingMethods,
} from '@/lib/analysis/resampling'
import { useAvailableTimeStepsStore } from '@/stores/availableTimeSteps'
import {
  addFilterToChart,
  Chart,
  ChartSeriesItem,
  type CollectionEmits,
  createNewChartsForFilters,
  FilterSubplotItem,
  getFilterIds,
  getLocationIds,
  getModuleInstanceIds,
  getParameterIds,
  getValidFilterCharts,
} from '@/lib/analysis'
import { useParametersStore } from '@/stores/parameters'

interface Props {
  charts: Chart[]
  series: Record<string, Series>
  startTime?: Date
  endTime?: Date
  settings: ComponentSettings
  isActive?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<CollectionEmits>()

const parametersStore = useParametersStore()

const selectedTimeseries = ref<ChartSeriesItem[]>([])
const selectedResamplingMethods = ref<ResamplingMethod[]>([])
const selectedResamplingTimeSteps = ref<TimeSteps[]>([])

const isLoadingNewCharts = ref(false)
const isLoadingAddToChart = ref(false)

watch(() => props.isActive, clearSelections)
function clearSelections() {
  selectedTimeseries.value = []
  selectedResamplingMethods.value = []
  selectedResamplingTimeSteps.value = []
}

const availableTimeStepsStore = useAvailableTimeStepsStore()

const allSeries = computed(() => getValidFilterCharts(props.charts))

const filters = computed(() =>
  getFilters(selectedTimeseries.value.map((item) => item.series)),
)

const canAddFilter = computed(() => {
  return (
    filters.value.length > 0 &&
    selectedResamplingMethods.value.length > 0 &&
    selectedResamplingTimeSteps.value.length > 0
  )
})

async function addFilter(chart?: Chart) {
  if (!canAddFilter.value) return

  if (chart === undefined) {
    isLoadingNewCharts.value = true
    const charts = await createNewChartsForFilters(filters.value)
    isLoadingNewCharts.value = false
    charts.forEach((chart) => emit('addChart', chart))
    return
  }

  if (chart.type !== 'filter') return

  const promises = filters.value.map((filter) =>
    addFilterToChart(chart, filter),
  )
  isLoadingAddToChart.value = true
  await Promise.all(promises)
  isLoadingAddToChart.value = false
}

function getFilters(items: FilterSubplotItem[]) {
  const filterIds = getFilterIds(items)
  const locationIds = getLocationIds(items)
  const parameterIds = getParameterIds(items)
  const moduleInstanceIds = getModuleInstanceIds(items)

  const parameters = parameterIds
    .map(parametersStore.byId)
    .filter((parameter) => parameter !== undefined)

  // Group by parameterGroup
  const groupedParameters: Record<string, string[]> = {}
  parameters.forEach((parameter) => {
    const group = parameter?.parameterGroup
    if (!group) return

    if (!groupedParameters[group]) {
      groupedParameters[group] = []
    }
    groupedParameters[group].push(parameter.id)
  })

  const resamplingMethods = selectedResamplingMethods.value
    .map((method) => method.value)
    .join(',')
  const resamplingTimeStepIds = selectedResamplingTimeSteps.value
    .map((timeStep) => timeStep.id)
    .join(',')

  return Object.values(groupedParameters).map((parameterIds) => ({
    filterId: filterIds.join(','),
    locationIds: locationIds.join(','),
    parameterIds: parameterIds.join(','),
    moduleInstanceIds: moduleInstanceIds.join(','),
    resamplingMethods,
    resamplingTimeStepIds,
    resamplingOmitMissing: true, // TODO: add option for this
    includeNonResampled: true, // TODO: add option for this
  }))
}
</script>
