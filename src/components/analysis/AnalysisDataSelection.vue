<template>
  <div class="his-selection-container h-100 pa-2 ga-2">
    <v-select
      v-model="filterId"
      :items="filters"
      item-value="id"
      item-title="name"
      label="Filter"
      variant="outlined"
      hide-details
      density="compact"
      max-width="250"
    />
    <Autocomplete
      v-model="selectedParameterIds"
      :items="filteredParameterIds"
      label="Parameters"
      icon="mdi-tag"
      :getItemValue="(item) => item"
      :getItemTitle="parametersStore.getName"
      :multiple="true"
    />
    <Autocomplete
      v-model="selectedModuleInstanceIds"
      :items="filteredModuleInstanceIds"
      label="Source"
      icon="mdi-cog"
      :multiple="true"
    />
    <Autocomplete
      v-model="selectedLocationIds"
      :items="filteredLocations"
      label="Locations"
      icon="mdi-map-marker-multiple"
      :getItemValue="getLocationId"
      :getItemTitle="getLocationTitle"
      :multiple="true"
    >
      <template #append-title>
        <!-- show map toggle -->
        <v-btn
          prepend-icon="mdi-map"
          :append-icon="showMap ? 'mdi-chevron-down' : 'mdi-chevron-right'"
          variant="plain"
          density="compact"
          :active="showMap"
          text="Show map"
          class="text-none"
          @click="showMap = !showMap"
        />
      </template>
      <template #prepend>
        <div v-show="showMap" class="border rounded mb-1 flex-0-0 h-50">
          <AnalysisMap :boundingBox>
            <LocationsLayer
              v-if="filterLocationGeoJson.features.length"
              :locationsGeoJson="filterLocationGeoJson"
              :selectedLocationIds="selectedLocationIds"
              @click="onLocationClick"
            />
          </AnalysisMap>
        </div>
      </template>
    </Autocomplete>

    <div class="d-flex">
      <v-spacer />
      <AnalysisAddButton
        :disabled="!filter"
        :loading="isLoading"
        @click="addFilter"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  BoundingBox,
  Filter,
  filterActionsFilter,
  Location,
} from '@deltares/fews-pi-requests'
import Autocomplete from '@/components/general/Autocomplete.vue'
import AnalysisMap from '@/components/analysis/AnalysisMap.vue'
import AnalysisAddButton from '@/components/analysis/AnalysisAddButton.vue'
import LocationsLayer from '@/components/wms/LocationsLayer.vue'
import { computed, ref, watch } from 'vue'
import type { MapLayerMouseEvent, MapLayerTouchEvent } from 'maplibre-gl'
import { useParametersStore } from '@/stores/parameters'
import { createNewChartsForFilter, type CollectionEmits } from '@/lib/analysis'
import { useFilterLocations } from '@/services/useFilterLocations'
import { useTimeSeriesHeaders } from '@/services/useTimeSeries'
import { configManager } from '@/services/application-config'

interface Props {
  filters?: Filter[]
  boundingBox?: BoundingBox
  isActive?: boolean
}

const props = defineProps<Props>()
const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const showMap = ref(false)

const isLoading = ref(false)
const parametersStore = useParametersStore()

const filterId = ref<string | undefined>(props.filters?.[0]?.id)

const { locations, geojson } = useFilterLocations(baseUrl, () =>
  filterId.value ? [filterId.value] : [],
)
const { timeSeriesHeaders } = useTimeSeriesHeaders(baseUrl, filterId)

const emit = defineEmits<CollectionEmits>()

watch(filterId, clearSelections)
watch(() => props.isActive, clearSelections)
function clearSelections() {
  clearSelectedLocations()
  clearSelectedParameters()
  clearSelectedModuleInstances()
}

function clearSelectedLocations() {
  selectedLocationIds.value = []
}

function clearSelectedParameters() {
  selectedParameterIds.value = []
}

function clearSelectedModuleInstances() {
  selectedModuleInstanceIds.value = []
}

function getLocationId(location: Location) {
  return location.locationId
}

function getLocationTitle(location: Location) {
  return location.locationName ?? location.locationId
}

const filteredParameterIds = computed(() => filteredData.value.parameterIds)
const filteredModuleInstanceIds = computed(
  () => filteredData.value.moduleInstanceIds,
)
const filteredLocations = computed(() =>
  locations.value.filter((location) =>
    filteredData.value.locationIds.includes(location.locationId),
  ),
)

const filter = computed(() => {
  if (!filterId.value) return
  if (!selectedParameterIds.value.length) return
  if (!selectedLocationIds.value.length) return
  if (!selectedModuleInstanceIds.value.length) return

  const _fitler: filterActionsFilter = {
    filterId: filterId.value,
    locationIds: selectedLocationIds.value.join(','),
    parameterIds: selectedParameterIds.value.join(','),
    // @ts-expect-error FIXME: Update when the types are updated
    moduleInstanceIds: selectedModuleInstanceIds.value.join(','),
  }
  return _fitler
})

async function addFilter() {
  if (!filter.value) return
  isLoading.value = true
  const charts = await createNewChartsForFilter(filter.value)
  isLoading.value = false
  charts.forEach((chart) => emit('addChart', chart))
}

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

const filterLocationGeoJson = computed(() => {
  return {
    ...geojson.value,
    features: geojson.value.features.filter((feature) =>
      filteredData.value.locationIds.includes(feature.properties?.locationId),
    ),
  }
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
.his-selection-container {
  display: grid;
  grid-template-rows: auto 1fr 1fr 2fr;
  height: 100%;
}
</style>
