<template>
  <div class="his-resampling-container h-100 pa-2 ga-2">
    <HisGroupSelect
      v-model="selectedTimeseries"
      :items="allSeries"
      label="Timeseries"
      :getItemValue="(item) => item.series"
      :getItemTitle="(item) => item.series.legend ?? ''"
      :getItemGroupTitle="(item) => item.chartTitle"
      :groupBy="(item) => item.chartId"
      :multiple="true"
    />

    <HisAutocomplete
      v-model="selectedResamplingMethods"
      :items="resamplingMethods"
      label="Resampling methods"
      :getItemValue="(item) => item"
      :getItemTitle="(item) => item.label"
      :multiple="true"
    />

    <HisAutocomplete
      v-model="selectedResamplingTimeSteps"
      :items="availableTimeStepsStore.resamplingTimeSteps"
      label="Time steps"
      :getItemValue="(item) => item"
      :getItemTitle="(item) => item.label"
      :multiple="true"
    />

    <div class="d-flex pa-3">
      <v-spacer />
      <HisAddButton
        :disabled="!filter"
        :loading="props.isLoading"
        @click="addFilter"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import HisAutocomplete from '@/components/his/HisAutocomplete.vue'
import HisAddButton from '@/components/his/HisAddButton.vue'
import HisGroupSelect from '@/components/his/HisGroupSelect.vue'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import { computed, ref, watch } from 'vue'
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
import { Chart, getValidFilterCharts } from '@/lib/his'

interface Props {
  filterId?: string
  charts: Chart[]
  series: Record<string, Series>
  startTime?: Date
  endTime?: Date
  settings: ComponentSettings
  isLoading?: boolean
  isActive?: boolean
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

watch(() => props.isActive, clearSelections)
function clearSelections() {
  selectedTimeseries.value = []
  selectedResamplingMethods.value = []
  selectedResamplingTimeSteps.value = []
}

const availableTimeStepsStore = useAvailableTimeStepsStore()

const allSeries = computed(() => getValidFilterCharts(props.charts))

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

<style scoped>
.his-resampling-container {
  height: 100%;
}
</style>
