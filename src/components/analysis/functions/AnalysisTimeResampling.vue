<template>
  <div class="h-100 pa-2 ga-2">
    <GroupSelect
      v-model="selectedTimeseries"
      :items="allSeries"
      label="Time Series"
      :getItemValue="(item) => item"
      :getItemTitle="(item) => item.series.legend ?? ''"
      :getItemGroupTitle="(item) => item.chart.title"
      :groupBy="(item) => item.chart.id"
      :multiple="true"
    />

    <Autocomplete
      v-model="selectedResamplingMethods"
      :items="resamplingMethods"
      label="Resampling Methods"
      :getItemValue="(item) => item"
      :getItemTitle="(item) => item.label"
      :multiple="true"
    />

    <Autocomplete
      v-model="selectedResamplingTimeSteps"
      :items="availableTimeStepsStore.resamplingTimeSteps"
      label="Time Steps"
      :getItemValue="(item) => item"
      :getItemTitle="(item) => item.label"
      :multiple="true"
    />

    <div class="d-flex pa-3">
      <v-spacer />
      <AnalysisAddButton
        :charts
        :disabled="!canAddFilter"
        :loading="isLoading"
        :newChartTitle="`Create ${filters.length} new chart${
          filters.length > 1 ? 's' : ''
        }`"
        @addToChart="addFilter"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import Autocomplete from '@/components/general/Autocomplete.vue'
import GroupSelect from '@/components/general/GroupSelect.vue'
import AnalysisAddButton from '@/components/analysis/AnalysisAddButton.vue'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import { computed, ref, watch } from 'vue'
import { UseDisplayConfigOptions } from '@/services/useDisplayConfig'
import { useUserSettingsStore } from '@/stores/userSettings'
import { filterActionsFilter, type TimeSteps } from '@deltares/fews-pi-requests'
import {
  type ResamplingMethod,
  resamplingMethods,
} from '@/lib/analysis/resampling'
import { uniq } from 'lodash-es'
import { useAvailableTimeStepsStore } from '@/stores/availableTimeSteps'
import {
  addFilterToChart,
  Chart,
  ChartSeriesItem,
  type CollectionEmits,
  createNewChartsForFilters,
  getValidFilterCharts,
} from '@/lib/analysis'

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

const userSettings = useUserSettingsStore()

const selectedTimeseries = ref<ChartSeriesItem[]>([])
const selectedResamplingMethods = ref<ResamplingMethod[]>([])
const selectedResamplingTimeSteps = ref<TimeSteps[]>([])
const isLoading = ref(false)

watch(() => props.isActive, clearSelections)
function clearSelections() {
  selectedTimeseries.value = []
  selectedResamplingMethods.value = []
  selectedResamplingTimeSteps.value = []
}

const availableTimeStepsStore = useAvailableTimeStepsStore()

const allSeries = computed(() => getValidFilterCharts(props.charts))

const displayConfigOptions = computed<UseDisplayConfigOptions>(() => {
  return {
    useDisplayUnits: userSettings.useDisplayUnits,
    convertDatum: userSettings.convertDatum,
  }
})

const filters = computed(() => {
  return []
})

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
    isLoading.value = true
    const charts = await createNewChartsForFilters(filters.value)
    isLoading.value = false
    charts.forEach((chart) => emit('addChart', chart))
    return
  }

  if (filters.value.length !== 1)
    throw new Error('Only one filter can be added to an existing chart')
  const filter = filters.value[0]
  if (chart.type !== 'filter') return

  await addFilterToChart(chart, filter)
}

function getLocationIds(items: ChartSeriesItem[]) {
  return uniq(items.flatMap((item) => item.series.locationId ?? []))
}

function getParameterIds(series: Series[]) {
  return uniq(series.flatMap((series) => series.header.parameter ?? []))
}

function getModuleInstanceIds(series: Series[]) {
  return uniq(series.flatMap((series) => series.header.source ?? []))
}

function getFilterIds(items: ChartSeriesItem[]) {
  return uniq([
    ...items.flatMap((item) => item.chart.filters.left.filterId ?? []),
    ...items.flatMap((item) => item.chart.filters.right?.filterId ?? []),
  ])
}

function getFilter(items: ChartSeriesItem[]) {
  const series = items.map((item) => props.series[item.series.request ?? ''])

  const filterIds = getFilterIds(items).join(',')
  const locationIds = getLocationIds(items).join(',')
  const parameterIds = getParameterIds(series).join(',')
  const moduleInstanceIds = getModuleInstanceIds(series).join(',')

  const resamplingMethods = selectedResamplingMethods.value
    .map((method) => method.value)
    .join(',')
  const resamplingTimeStepIds = selectedResamplingTimeSteps.value
    .map((timeStep) => timeStep.id)
    .join(',')

  const filter: filterActionsFilter & UseDisplayConfigOptions = {
    filterId: filterIds,
    locationIds,
    parameterIds,
    // @ts-expect-error FIXME: Update when the types are updated
    moduleInstanceIds,
    resamplingMethods,
    resamplingTimeStepIds,
    resamplingOmitMissing: true, // TODO: add option for this
    includeNonResampled: true, // TODO: add option for this
    ...displayConfigOptions.value,
  }
  return filter
}
</script>
