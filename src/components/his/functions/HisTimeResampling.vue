<template>
  <HisAutocomplete
    v-model="selectedTimeseries"
    :items="allSeries"
    label="Parameter"
    :getItemValue="(item) => item"
    :getItemTitle="(item) => item.name"
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

  <HisCharts
    v-if="resampledDisplayConfig"
    :subplots="resampledDisplayConfig.subplots"
    :series="resampledSeries"
    :settings="settings"
  />
</template>

<script setup lang="ts">
import HisAutocomplete from '@/components/his/HisAutocomplete.vue'
import HisCharts from '@/components/his/HisCharts.vue'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import { computed, ref } from 'vue'
import {
  useDisplayConfigFilter,
  UseDisplayConfigOptions,
} from '@/services/useDisplayConfig'
import { useUserSettingsStore } from '@/stores/userSettings'
import { filterActionsFilter, type TimeSteps } from '@deltares/fews-pi-requests'
import { configManager } from '@/services/application-config'
import { useTimeSeries } from '@/services/useTimeSeries'
import { type ResamplingMethod, resamplingMethods } from '@/lib/his/resampling'
import { ChartSeries } from '@/lib/charts/types/ChartSeries'
import { uniq } from 'lodash-es'
import { useAvailableTimeStepsStore } from '@/stores/availableTimeSteps'
import { ChartConfig } from '@/lib/charts/types/ChartConfig'

interface Props {
  filterId?: string
  subplots: ChartConfig[]
  series: Record<string, Series>
  startTime?: Date
  endTime?: Date
  settings: ComponentSettings
}

const props = defineProps<Props>()
const userSettings = useUserSettingsStore()
const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const selectedTimeseries = ref<ChartSeries[]>([])
const selectedResamplingMethods = ref<ResamplingMethod[]>([])
const selectedResamplingTimeSteps = ref<TimeSteps[]>([])

const availableTimeStepsStore = useAvailableTimeStepsStore()

const allSeries = computed(() => props.subplots.flatMap((s) => s.series) ?? [])

const selectedSeries = computed(() => {
  return selectedTimeseries.value.flatMap((series) =>
    series.dataResources.map((resource) => props.series[resource]),
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

const { displayConfig: resampledDisplayConfig } = useDisplayConfigFilter(
  baseUrl,
  filter,
  () => props.startTime,
  () => props.endTime,
)

const { series: resampledSeries } = useTimeSeries(
  baseUrl,
  () => resampledDisplayConfig.value?.requests ?? [],
  () => ({
    startTime: props.startTime,
    endTime: props.endTime,
    thinning: true,
  }),
)
</script>
