<template>
  <div class="his-selection-container h-100 pa-2 ga-2">
    <HisAutocomplete
      v-model="selectedParameterIds"
      :items="filteredParameterIds"
      label="Parameters"
      icon="mdi-tag"
      :getItemValue="(item) => item"
      :getItemTitle="parametersStore.getName"
      multiple
    />
    <HisAutocomplete
      v-model="selectedModuleInstanceIds"
      :items="filteredModuleInstanceIds"
      label="Module instances"
      icon="mdi-cog"
      multiple
    />
    <HisAutocomplete
      v-model="selectedLocationIds"
      :items="filteredLocations"
      label="Locations"
      icon="mdi-map-marker-multiple"
      :getItemValue="getLocationId"
      :getItemTitle="getLocationTitle"
      multiple
    />

    <div class="border rounded" style="height: 300px">
      <HisMap :boundingBox>
        <LocationsLayer
          v-if="filterLocationGeoJson.features.length"
          :locationsGeoJson="filterLocationGeoJson"
          :selectedLocationIds="selectedLocationIds"
          @click="onLocationClick"
        />
      </HisMap>
    </div>

    <div class="d-flex">
      <v-spacer />
      <v-btn
        variant="tonal"
        :disabled="!filter"
        prepend-icon="mdi-plus"
        text="Add to collection"
        :loading="isLoading"
        @click="addFilter"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  BoundingBox,
  filterActionsFilter,
  Header,
  Location,
} from '@deltares/fews-pi-requests'
import HisAutocomplete from '@/components/his/HisAutocomplete.vue'
import HisMap from '@/components/his/HisMap.vue'
import LocationsLayer from '@/components/wms/LocationsLayer.vue'
import { computed, ref, watch } from 'vue'
import type { MapLayerMouseEvent, MapLayerTouchEvent } from 'maplibre-gl'
import type { FeatureCollection, Geometry } from 'geojson'
import { useParametersStore } from '@/stores/parameters'

interface Props {
  filterId?: string
  locations: Location[]
  geojson: FeatureCollection<Geometry, Location>
  timeSeriesHeaders: Header[]
  boundingBox?: BoundingBox
  isLoading?: boolean
  isActive?: boolean
}

const props = defineProps<Props>()

const parametersStore = useParametersStore()

interface Emits {
  addFilter: [filter: filterActionsFilter]
}
const emit = defineEmits<Emits>()

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
  props.locations.filter((location) =>
    filteredData.value.locationIds.includes(location.locationId),
  ),
)

const filter = computed(() => {
  if (!props.filterId) return
  if (!selectedParameterIds.value.length || !selectedLocationIds.value.length) {
    return
  }
  const _fitler: filterActionsFilter = {
    filterId: props.filterId,
    locationIds: selectedLocationIds.value.join(','),
    parameterIds: selectedParameterIds.value.join(','),
  }
  return _fitler
})

function addFilter() {
  if (!filter.value) return
  emit('addFilter', filter.value)
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

  props.timeSeriesHeaders.forEach((header) => {
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
    ...props.geojson,
    features: props.geojson.features.filter((feature) =>
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
  grid-template-rows: 1fr 1fr 2fr;
  height: 100%;
}
</style>
