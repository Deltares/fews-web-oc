<template>
  <HisAutocomplete
    v-model="selectedTimeseries"
    :items="allSeries"
    label="Parameter"
    :getItemValue="(item) => item"
    :getItemTitle="(item) => item.legend ?? ''"
    multiple
  />

  <HisAutocomplete
    v-model="selectedResamplingMethods"
    :items="resamplingMethods"
    label="Resampling methods"
    :getItemValue="(item) => item"
    :getItemTitle="(item) => item.label"
    multiple
  />

  <HisAutocomplete
    v-model="selectedResamplingTimeSteps"
    :items="availableTimeStepsStore.resamplingTimeSteps"
    label="Time steps"
    :getItemValue="(item) => item"
    :getItemTitle="(item) => item.label"
    multiple
  />

  <div class="d-flex pa-3">
    <v-spacer />
    <v-btn
      variant="tonal"
      :disabled="!filter"
      prepend-icon="mdi-plus"
      text="Add to collection"
      @click="addFilter"
      :loading="isLoading"
    />
  </div>
</template>

<script setup lang="ts">
import HisAutocomplete from '@/components/his/HisAutocomplete.vue'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import { computed, ref } from 'vue'
import { UseDisplayConfigOptions } from '@/services/useDisplayConfig'
import { useUserSettingsStore } from '@/stores/userSettings'
import {
  filterActionsFilter,
  TimeSeriesDisplaySubplotItem,
  type TimeSteps,
} from '@deltares/fews-pi-requests'
import { type ResamplingMethod, resamplingMethods } from '@/lib/his/resampling'
import { uniq } from 'lodash-es'
import { useAvailableTimeStepsStore } from '@/stores/availableTimeSteps'
import { Chart } from '@/lib/his'

interface Props {
  filterId?: string
  charts: Chart[]
  series: Record<string, Series>
  startTime?: Date
  endTime?: Date
  settings: ComponentSettings
  isLoading?: boolean
}

const props = defineProps<Props>()

interface Emits {
  addFilter: [filter: filterActionsFilter]
}
const emit = defineEmits<Emits>()

const userSettings = useUserSettingsStore()

const selectedTimeseries = ref<TimeSeriesDisplaySubplotItem[]>([])
const selectedResamplingMethods = ref<ResamplingMethod[]>([])
const selectedResamplingTimeSteps = ref<TimeSteps[]>([])

const availableTimeStepsStore = useAvailableTimeStepsStore()

const allSeries = computed(() =>
  props.charts
    .filter((chart) => chart.type === 'filter')
    .flatMap((chart) => chart.subplot.items)
    .filter(
      (series, index, self) =>
        index === self.findIndex((s) => s.request === series.request),
    ),
)

const selectedSeries = computed(() => {
  return selectedTimeseries.value.flatMap(
    (item) => props.series[item.request ?? ''],
  )
})

const selectedParameterIds = computed(() =>
  uniq(selectedSeries.value.flatMap((series) => series.header.parameter ?? [])),
)

const selectedLocationIds = computed(() =>
  uniq(selectedTimeseries.value.flatMap((series) => series.locationId ?? [])),
)

const displayConfigOptions = computed<UseDisplayConfigOptions>(() => {
  return {
    useDisplayUnits: userSettings.useDisplayUnits,
    convertDatum: userSettings.convertDatum,
  }
})

const filter = computed(() => {
  if (!props.filterId) return
  if (
    !selectedParameterIds.value.length ||
    !selectedLocationIds.value.length ||
    !selectedResamplingMethods.value.length ||
    !selectedResamplingTimeSteps.value.length
  ) {
    return
  }

  const _fitler: filterActionsFilter & UseDisplayConfigOptions = {
    filterId: props.filterId,
    locationIds: selectedLocationIds.value.join(','),
    parameterIds: selectedParameterIds.value.join(','),
    // @ts-ignore: FIXME: fix in types
    resamplingMethods: selectedResamplingMethods.value
      .map((method) => method.value)
      .join(','),
    // TODO: add option for this
    resamplingOmitMissing: true,
    resamplingTimeStepIds: selectedResamplingTimeSteps.value
      .map((timeStep) => timeStep.id)
      .join(','),
    includeNonResampled: true,
    ...displayConfigOptions.value,
  }
  return _fitler
})

function addFilter() {
  if (!filter.value) return
  emit('addFilter', filter.value)
}
</script>
