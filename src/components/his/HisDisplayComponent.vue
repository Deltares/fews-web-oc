<template>
  <div class="his-container pa-2 ga-2">
    <div class="his-data-selection">
      <v-card border flat>
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
          />
        </v-tabs>

        <v-tabs-window v-model="tab">
          <v-tabs-window-item value="data-selection">
            <HisDataSelection
              v-model:selectedLocationIds="selectedLocationIds"
              v-model:selectedParameterIds="selectedParameterIds"
              v-model:selectedModuleInstanceIds="selectedModuleInstanceIds"
              :locations="filteredLocations"
              :parameterIds="filteredParameterIds"
              :moduleInstanceIds="filteredModuleInstanceIds"
            />
          </v-tabs-window-item>
          <v-tabs-window-item value="analysis">
            <HisAutocomplete
              :items="timeSeriesHeaders.map((header) => header.locationId)"
              label="Timeseries"
              icon="mdi-chart-line"
              v-model:selectedIds="selectedParameterIds"
            />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card>
    </div>
    <div class="his-map">
      <v-card v-show="tab === 'data-selection'" class="h-100 w-100" border flat>
        <HisMap :boundingBox>
          <LocationsLayer
            v-if="filterLocationGeoJson.features.length"
            :locationsGeoJson="filterLocationGeoJson"
            :selectedLocationIds="selectedLocationIds"
            @click="onLocationClick"
          />
        </HisMap>
      </v-card>
    </div>
    <div class="his-charts">
      <v-card border flat>
        <HisCharts v-if="displayConfig" :display-config="displayConfig" />
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
import { useTimeSeriesHeaders } from '@/services/useTimeSeries'
import {
  useDisplayConfigFilter,
  UseDisplayConfigOptions,
} from '@/services/useDisplayConfig'
import HisAutocomplete from './HisAutocomplete.vue'

interface Props {
  filterId?: string
  boundingBox?: BoundingBox
}

const props = defineProps<Props>()

const tab = ref('data-selection')

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const { locations, geojson } = useFilterLocations(baseUrl, () =>
  props.filterId ? [props.filterId] : [],
)
const { timeSeriesHeaders } = useTimeSeriesHeaders(
  baseUrl,
  () => props.filterId,
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
    return new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  () => {
    return new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
  },
)

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
  grid-template-rows: auto 1fr;
  grid-template-areas:
    'his-data-selection his-charts'
    'his-map his-charts';
}

.his-container > * {
  overflow: auto;
}

.his-data-selection {
  grid-area: his-data-selection;
}

.his-map {
  grid-area: his-map;
}

.his-charts {
  grid-area: his-charts;
}

@media (max-width: 600px) {
  .his-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    grid-template-areas:
      'his-data-selection'
      'his-map'
      'his-charts';
  }
}
</style>
