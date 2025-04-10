<template>
  <div class="his-container pa-2 ga-2">
    <div class="his-data-selection h-100">
      <v-card
        border
        flat
        class="d-grid flex-column"
        :class="{ 'h-100': tab === 'data-selection' }"
      >
        <v-tabs v-model="tab">
          <v-tab
            prepend-icon="mdi-filter"
            text="Data selection"
            value="data-selection"
          />
          <v-tab
            prepend-icon="mdi-chart-line"
            text="Analysis"
            value="analysis"
            :disabled="!displayConfig"
          />
        </v-tabs>

        <v-tabs-window v-model="tab" class="h-100">
          <v-tabs-window-item value="data-selection" class="h-100">
            <HisDataSelection
              v-model:selectedLocationIds="selectedLocationIds"
              v-model:selectedParameterIds="selectedParameterIds"
              v-model:selectedModuleInstanceIds="selectedModuleInstanceIds"
              :locations="filteredLocations"
              :parameterIds="filteredParameterIds"
              :moduleInstanceIds="filteredModuleInstanceIds"
            />

            <div class="w-100 h-100 border-t" style="min-height: 200px">
              <HisMap :boundingBox>
                <LocationsLayer
                  v-if="filterLocationGeoJson.features.length"
                  :locationsGeoJson="filterLocationGeoJson"
                  :selectedLocationIds="selectedLocationIds"
                  @click="onLocationClick"
                />
              </HisMap>
            </div>
          </v-tabs-window-item>
          <v-tabs-window-item value="analysis" v-if="displayConfig">
            <v-btn-group class="ma-3" variant="outlined">
              <v-btn
                prepend-icon="mdi-function-variant"
                text="Correlation"
                class="text-none"
                active
              />
              <v-btn
                prepend-icon="mdi-sigma"
                text="Time Resampling"
                class="text-none"
              />
            </v-btn-group>
            <HisAutocomplete
              v-model="selectedTimeseries"
              :items="allSeries"
              label="First parameter"
              :getItemValue="(item) => item"
              :getItemTitle="(item) => item.name"
            />

            <HisAutocomplete
              v-model="selectedSecondTimeseries"
              :items="allSeries"
              label="Second parameter"
              :getItemValue="(item) => item"
              :getItemTitle="(item) => item.name"
            />

            <v-number-input
              v-model="windowSize"
              label="Window size"
              :min="1"
              :max="50"
              variant="outlined"
              density="compact"
              width="200px"
              class="pa-3"
            />

            <TimeSeriesChart
              v-if="selectedSeries && selectedSubplot"
              :config="selectedSubplot"
              :series="selectedSeries"
              :settings="settings.charts.timeSeriesChart"
              :key="newId"
              hideLegend
            />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card>
    </div>
    <div class="his-charts overflow-auto">
      <v-card border flat>
        <v-card-title class="d-flex ga-1 align-center">
          <div>Charts</div>
          <v-spacer />
          <v-select
            :items="['1', '2', '3', '4']"
            label="Select configuration"
            density="compact"
            hide-details
            variant="outlined"
            class="w-200"
          />
          <v-btn icon="mdi-content-save" />
        </v-card-title>
        <HisCharts
          v-if="displayConfig"
          :display-config="displayConfig"
          :settings
        />
        <v-card-text v-else> Select some data to display </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import HisDataSelection from '@/components/his/HisDataSelection.vue'
import HisMap from '@/components/his/HisMap.vue'
import HisCharts from '@/components/his/HisCharts.vue'
import LocationsLayer from '../wms/LocationsLayer.vue'
import type {
  BoundingBox,
  filterActionsFilter,
} from '@deltares/fews-pi-requests'
import { computed, ref } from 'vue'
import { useFilterLocations } from '@/services/useFilterLocations'
import { configManager } from '@/services/application-config'
import type { MapLayerMouseEvent, MapLayerTouchEvent } from 'maplibre-gl'
import { useTimeSeries, useTimeSeriesHeaders } from '@/services/useTimeSeries'
import {
  useDisplayConfigFilter,
  UseDisplayConfigOptions,
} from '@/services/useDisplayConfig'
import HisAutocomplete from './HisAutocomplete.vue'
import TimeSeriesChart from '@/components/charts/TimeSeriesChart.vue'
import { ChartSeries } from '@/lib/charts/types/ChartSeries'
import {
  type ComponentSettings,
  getDefaultSettings,
} from '@/lib/topology/componentSettings'
import { calculateCorrelationTimeSeries } from '@/lib/his'
import { ChartConfig } from '@/lib/charts/types/ChartConfig'
import { VNumberInput } from 'vuetify/labs/components'

interface Props {
  filterId?: string
  boundingBox?: BoundingBox
  settings?: ComponentSettings
}

const props = withDefaults(defineProps<Props>(), {
  settings: () => getDefaultSettings(),
})

const tab = ref('data-selection')

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const { locations, geojson } = useFilterLocations(baseUrl, () =>
  props.filterId ? [props.filterId] : [],
)
const { timeSeriesHeaders } = useTimeSeriesHeaders(
  baseUrl,
  () => props.filterId,
)

const selectedTimeseries = ref<ChartSeries>()
const selectedSecondTimeseries = ref<ChartSeries>()
const allSeries = computed(
  () => displayConfig.value?.subplots.flatMap((s) => s.series) ?? [],
)

const selectedLocationIds = ref<string[]>([])
const selectedParameterIds = ref<string[]>([])
const selectedModuleInstanceIds = ref<string[]>([])

const filteredData = computed(() => {
  const locationIds = selectedLocationIds.value
  const parameterIds = selectedParameterIds.value
  const moduleInstanceIds = selectedModuleInstanceIds.value

  const hasLocationIds = locationIds.length > 0
  const hasParameterIds = parameterIds.length > 0
  const hasModuleInstanceIds = moduleInstanceIds.length > 0

  const parameterIdsSet = new Set<string>()
  const moduleInstanceIdsSet = new Set<string>()
  const locationIdsSet = new Set<string>()

  timeSeriesHeaders.value.forEach((header) => {
    const matchesLocation =
      !hasLocationIds || locationIds.includes(header.locationId)
    const matchesParameter =
      !hasParameterIds || parameterIds.includes(header.parameterId)
    const matchesModuleInstance =
      !hasModuleInstanceIds ||
      moduleInstanceIds.includes(header.moduleInstanceId ?? 'invalid')

    if (matchesLocation && matchesModuleInstance && header.parameterId) {
      parameterIdsSet.add(header.parameterId)
    }

    if (matchesLocation && matchesParameter && header.moduleInstanceId) {
      moduleInstanceIdsSet.add(header.moduleInstanceId)
    }

    if (matchesModuleInstance && matchesParameter && header.locationId) {
      locationIdsSet.add(header.locationId)
    }
  })

  return {
    parameterIds: Array.from(parameterIdsSet),
    moduleInstanceIds: Array.from(moduleInstanceIdsSet),
    locationIds: Array.from(locationIdsSet),
  }
})

const filteredParameterIds = computed(() => filteredData.value.parameterIds)
const filteredModuleInstanceIds = computed(
  () => filteredData.value.moduleInstanceIds,
)
const filteredLocations = computed(() =>
  locations.value.filter((location) =>
    filteredData.value.locationIds.includes(location.locationId),
  ),
)

const filterLocationGeoJson = computed(() => {
  return {
    ...geojson.value,
    features: geojson.value.features.filter((feature) =>
      filteredData.value.locationIds.includes(feature.properties?.locationId),
    ),
  }
})

const filter = computed(() => {
  if (!props.filterId) return
  if (!selectedParameterIds.value.length || !selectedLocationIds.value.length) {
    return
  }
  const _fitler: filterActionsFilter & UseDisplayConfigOptions = {
    filterId: props.filterId,
    locationIds: selectedLocationIds.value.join(','),
    parameterIds: selectedParameterIds.value.join(','),
    convertDatum: true,
    useDisplayUnits: true,
  }
  return _fitler
})

// Backwards 2 weeks forwards 1 week
const { displayConfig } = useDisplayConfigFilter(
  baseUrl,
  filter,
  () => {
    return new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  },
  () => {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
)

const { series } = useTimeSeries(
  baseUrl,
  () => displayConfig.value?.requests ?? [],
  () => new Date(),
  () => ({}),
)

const newId = computed(() => {
  if (!selectedTimeseries.value) return 'correlation'
  if (!selectedSecondTimeseries.value) return 'correlation'

  return `${selectedTimeseries.value.id}-${selectedSecondTimeseries.value.id}-correlation-${windowSize.value}`
})

const windowSize = ref(4)

const selectedSeries = computed(() => {
  if (!selectedTimeseries.value) return
  if (!selectedSecondTimeseries.value) return

  const id1 = selectedTimeseries.value.id
  const series1 = series.value[id1]

  const id2 = selectedSecondTimeseries.value?.id
  const series2 = series.value[id2]

  if (!series1.data || !series2.data) return

  const newSeries = series1.clone()
  newSeries.lastUpdated = new Date()

  newSeries.data = calculateCorrelationTimeSeries(
    series1.data,
    series2.data,
    windowSize.value,
  )

  return { [newId.value]: newSeries }
})

const selectedSubplot = computed(() => {
  if (!selectedTimeseries.value) return
  if (!selectedSecondTimeseries.value) return

  const config = displayConfig.value?.subplots[0]
  if (!config) return

  const res: ChartConfig = {
    ...config,
    yAxis: [
      {
        ...config.yAxis?.[0],
        label: 'Correlation',
      },
    ],
    series: [
      {
        ...config.series[0],
        dataResources: [newId.value],
        id: newId.value,
        visibleInLegend: false,
      },
    ],
  }
  return res
})

function onLocationClick(event: MapLayerMouseEvent | MapLayerTouchEvent): void {
  if (!event.features) return
  const locationId = event.features[0].properties?.locationId
  if (!locationId) return

  // Toggle location id in array
  selectedLocationIds.value = selectedLocationIds.value.includes(locationId)
    ? selectedLocationIds.value.filter((id) => id !== locationId)
    : [...selectedLocationIds.value, locationId]
}
</script>

<style scoped>
.his-container {
  display: grid;
  width: 100%;
  height: 100%;
  grid-template-columns: 1fr 1fr;
}

@media (max-width: 600px) {
  .his-container {
    grid-template-columns: 1fr;
  }
}
</style>
