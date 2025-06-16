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
        :disabled="!canAddFilter"
        :loading="isLoading"
        @click="addFilter"
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
  Chart,
  ChartSeriesItem,
  type CollectionEmits,
  createNewChartsForFilter,
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

const filterIds = computed(() =>
  uniq(selectedTimeseries.value.map((item) => item.chart.filterId)),
)

const canAddFilter = computed(() => {
  return (
    filterIds.value.length > 0 &&
    selectedResamplingMethods.value.length > 0 &&
    selectedResamplingTimeSteps.value.length > 0
  )
})

async function addFilter() {
  if (!canAddFilter.value) return

  const promises = filterIds.value.map((filterId) => {
    const items = selectedTimeseries.value.filter(
      (item) => item.chart.filterId === filterId,
    )
    const filter = getFilter(filterId, items)

    return createNewChartsForFilter(filter, 'Resampled ')
  })

  isLoading.value = true
  const charts = (await Promise.all(promises)).flat()
  isLoading.value = false

  charts.forEach((chart) => emit('addChart', chart))
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

function getFilter(filterId: string, items: ChartSeriesItem[]) {
  const series = items.map((item) => props.series[item.series.request ?? ''])

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
    filterId,
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
