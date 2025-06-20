<template>
  <div class="d-flex w-100 h-100 flex-row">
    <div class="h-100 d-flex flex-column child-container">
      <div class="w-100 d-flex flex-1-1 overflow-x-auto overflow-y-hidden">
        <PluginLoader
          :componentName="correctComponent"
          :timeSeries="timeSeries"
          :time="selectedDateOfSlider"
          @navigate="onNavigate"
        />
      </div>
      <DateTimeSlider
        class="w-100"
        v-if="dateTimeSliderEnabled && times?.length"
        v-model:selectedDate="selectedDateOfSlider"
        :dates="times"
      />
    </div>
    <div v-if="showChartPanel" class="child-container">
      <SpatialTimeSeriesDisplay
        :current-time="selectedDateOfSlider"
        :settings="settings"
        :filter="filter"
        @close="closeTimeSeriesDisplay"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watchEffect } from 'vue'
import DateTimeSlider from '@/components/general/DateTimeSlider.vue'
const SpatialTimeSeriesDisplay = defineAsyncComponent(
  () => import('@/components/spatialdisplay/SpatialTimeSeriesDisplay.vue'),
)
import { DateTime } from 'luxon'
import type { NavigateRoute } from '@/lib/router'
import {
  filterActionsFilter,
  type TopologyNode,
} from '@deltares/fews-pi-requests'

import {
  type ComponentSettings,
  getDefaultSettings,
} from '@/lib/topology/componentSettings'
import { useUserSettingsStore } from '@/stores/userSettings'
import { UseDisplayConfigOptions } from '@/services/useDisplayConfig'
import {
  useFilterTimeSeries,
  UseTimeSeriesOptions,
} from '@/services/useFilterTimeSeries'
import { configManager } from '@/services/application-config'

const PluginLoader = defineAsyncComponent(
  // @ts-ignore
  () => import(`weboc_mdba_plugins/plugin-loader`),
)

interface Props {
  customComponent?: string
  locationIds?: string
  topologyNode?: TopologyNode
  settings?: ComponentSettings
}

const {
  customComponent = 'Sankey',
  locationIds,
  topologyNode,
  settings = getDefaultSettings(),
} = defineProps<Props>()

interface Emits {
  navigate: [to: NavigateRoute]
}
const emit = defineEmits<Emits>()
const userSettings = useUserSettingsStore()

const dateTimeSliderEnabled = ref<boolean>(true)
const times = ref<Date[]>([
  DateTime.fromISO('2025-03-01T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-03-02T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-03-03T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-03-04T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-03-05T22:00:00Z').toJSDate(),

  DateTime.fromISO('2025-03-06T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-03-07T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-03-08T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-03-09T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-03-10T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-03-11T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-03-12T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-03-13T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-03-14T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-03-15T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-03-16T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-03-17T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-03-18T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-03-19T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-03-20T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-03-21T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-03-22T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-03-23T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-03-24T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-03-25T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-03-26T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-03-27T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-03-28T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-03-29T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-03-30T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-03-31T22:00:00Z').toJSDate(),

  DateTime.fromISO('2025-04-01T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-04-02T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-04-03T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-04-04T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-04-05T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-04-06T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-04-07T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-04-08T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-04-09T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-04-10T22:00:00Z').toJSDate(),
])

const showChartPanel = computed(() => {
  return locationIds
})

const selectedDateOfSlider = ref<Date>(times.value[0])

const filterIds = computed(() => topologyNode?.filterIds ?? [])

const timeSeriesFilter = computed(() => {
  console.log('Creating time series filter with filterIds:', filterIds.value)
  return {
    filterId: filterIds.value ? filterIds.value[0] : undefined,
    startTime:
      DateTime.fromJSDate(times.value[0])
        .toUTC()
        .toISO({ suppressMilliseconds: true }) ?? undefined,
    endTime:
      DateTime.fromJSDate(times.value[times.value.length - 1])
        .toUTC()
        .toISO({ suppressMilliseconds: true }) ?? undefined,
  }
})

const timeSeriesOptions = ref<UseTimeSeriesOptions>({
  thinning: false,
})

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { series } = useFilterTimeSeries(
  baseUrl,
  timeSeriesFilter,
  timeSeriesOptions,
)

const timeSeries = computed(() => {
  console.log('Time series data:', series.value)
  return Object.values(series.value)
})

function getFilterActionsFilter(
  locationIds: string,
): filterActionsFilter & UseDisplayConfigOptions {
  return {
    locationIds: locationIds,
    filterId: filterIds.value.length ? filterIds.value[0] : undefined,
    useDisplayUnits: userSettings.useDisplayUnits,
    convertDatum: userSettings.convertDatum,
  }
}

const filter = computed(() => {
  if (locationIds) {
    return getFilterActionsFilter(locationIds)
  }
  return {}
})

watchEffect(() => {
  // Reset the selected date when the component changes
  console.log(
    'Custom component changed, resetting selected date',
    customComponent,
  )
})

const correctComponent = computed(() => {
  if (customComponent === 'sankey') {
    return 'Sankey'
  }
  if (customComponent === 'basin_storages') {
    return 'BasinStorage'
  }
  console.log('Using custom component:', customComponent)
  return customComponent
})

function onNavigate(event: any) {
  emit('navigate', event)
}

function closeTimeSeriesDisplay(): void {
  emit('navigate', { name: 'PluginDisplay' })
}
</script>

<style scoped>
.child-container {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 50%;
  max-width: 100%;
  flex: 1 1 0px;
}
</style>
