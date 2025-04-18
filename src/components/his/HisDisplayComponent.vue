<template>
  <div class="his-container pa-2 ga-2">
    <div class="his-data-selection h-100">
      <v-card
        border
        flat
        class="d-grid flex-column pb-2"
        :class="{ 'h-100': tab === 'data-selection' }"
      >
        <v-tabs v-model="tab">
          <v-tab
            prepend-icon="mdi-filter"
            text="Data selection"
            value="data-selection"
            class="text-none"
          />
          <v-tab
            prepend-icon="mdi-chart-line"
            text="Analysis"
            value="analysis"
            :disabled="!displayConfig"
            class="text-none"
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
            <v-btn-toggle
              v-model="selectedFunction"
              class="ma-3"
              variant="outlined"
            >
              <v-btn
                prepend-icon="mdi-function-variant"
                text="Correlation"
                class="text-none"
                value="correlation"
              />
              <v-btn
                prepend-icon="mdi-sigma"
                text="Time Resampling"
                class="text-none"
                value="time-resampling"
              />
            </v-btn-toggle>
            <v-tabs-window v-model="selectedFunction">
              <v-tabs-window-item value="correlation">
                <HisCorrelation :displayConfig :series :settings />
              </v-tabs-window-item>
              <v-tabs-window-item value="time-resampling">
                <v-card flat>
                  <v-card-title>Time Resampling</v-card-title>
                  <v-card-text>
                    <p>Time resampling is not yet implemented.</p>
                  </v-card-text>
                </v-card>
              </v-tabs-window-item>
            </v-tabs-window>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card>
    </div>
    <div class="his-charts overflow-auto">
      <v-card border flat>
        <v-card-title class="d-flex ga-1 align-center">
          <div>Charts</div>
          <v-spacer />
          <HisCollection v-model:selectedCollection="selectedCollection" />
          <v-btn :disabled="!selectedCollection" icon="mdi-content-save" />
        </v-card-title>
        <HisCharts
          v-if="displayConfig"
          :displayConfig="displayConfig"
          :series="series"
          :settings="settings"
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
import HisCollection from '@/components/his/HisCollection.vue'
import HisCorrelation from '@/components/his/functions/HisCorrelation.vue'
import LocationsLayer from '@/components/wms/LocationsLayer.vue'
import type {
  BoundingBox,
  filterActionsFilter,
} from '@deltares/fews-pi-requests'
import { computed, ref, watch } from 'vue'
import { useFilterLocations } from '@/services/useFilterLocations'
import { configManager } from '@/services/application-config'
import type { MapLayerMouseEvent, MapLayerTouchEvent } from 'maplibre-gl'
import { useTimeSeries, useTimeSeriesHeaders } from '@/services/useTimeSeries'
import {
  useDisplayConfigFilter,
  UseDisplayConfigOptions,
} from '@/services/useDisplayConfig'
import {
  type ComponentSettings,
  getDefaultSettings,
} from '@/lib/topology/componentSettings'
import { type Collection } from '@/lib/his'
import { useUserSettingsStore } from '@/stores/userSettings'

interface Props {
  filterId?: string
  boundingBox?: BoundingBox
  settings?: ComponentSettings
}

const props = withDefaults(defineProps<Props>(), {
  settings: () => getDefaultSettings(),
})

const userSettings = useUserSettingsStore()

const tab = ref('data-selection')
const selectedFunction = ref('correlation')

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const selectedCollection = ref<Collection>()

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

const displayConfigOptions = computed<UseDisplayConfigOptions>(() => {
  return {
    useDisplayUnits: userSettings.useDisplayUnits,
    convertDatum: userSettings.convertDatum,
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
    ...displayConfigOptions.value,
  }
  return _fitler
})

const startTime = new Date(Date.now() - 0 * 24 * 60 * 60 * 1000)
const endTime = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)

const { displayConfig } = useDisplayConfigFilter(
  baseUrl,
  filter,
  startTime,
  endTime,
)

const { series } = useTimeSeries(
  baseUrl,
  () => displayConfig.value?.requests ?? [],
  () => ({ startTime, endTime, thinning: true }),
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
}

@media (max-width: 600px) {
  .his-container {
    grid-template-columns: 1fr;
  }
}
</style>
