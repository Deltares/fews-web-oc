<template>
  <div class="d-flex w-100 h-100 flex-row">
    <div class="h-100 d-flex flex-column child-container">
      <div class="w-100 d-flex flex-1-1 overflow-x-auto overflow-y-hidden">
        <PluginLoader
          :componentName="correctComponent"
          :timeSeries="timeSeries"
          :selectedDate="selectedDateOfSlider"
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
import { timeSeries } from '@/assets/timeseries.json'
import { DateTime } from 'luxon'
import type { NavigateRoute } from '@/lib/router'
import { filterActionsFilter, type TopologyNode } from '@deltares/fews-pi-requests'

import {
  type ComponentSettings,
  getDefaultSettings,
} from '@/lib/topology/componentSettings'
import { useUserSettingsStore } from '@/stores/userSettings'
import { UseDisplayConfigOptions } from '@/services/useDisplayConfig'

const PluginLoader = defineAsyncComponent(
  // @ts-ignore
  () => import(`weboc_plugins/plugin-loader`),
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
  DateTime.fromISO('2025-05-26T22:00:00Z').toJSDate(),
  DateTime.fromISO('2025-05-27T22:00:00Z').toJSDate(),
])

const showChartPanel = computed(() => {
  return locationIds
})

const selectedDateOfSlider = ref<Date>(times.value[0])

const filterIds = computed(() => topologyNode?.filterIds ?? [])

function getFilterActionsFilter(
  locationIds: string,
): filterActionsFilter & UseDisplayConfigOptions {
  return {
    locationIds: locationIds,
    filterId: filterIds.value ? filterIds.value[0] : undefined,
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

watchEffect(
  () => {
    // Reset the selected date when the component changes
    console.log('Custom component changed, resetting selected date', customComponent)
  }
)

const correctComponent = computed(() => {
  if (customComponent === 'sankey') {
    return 'Sankey'
  }
  if (customComponent === 'basin_storages') {
    return 'BasinStorage'
  }
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
