<template>
  <div class="his-selection-container h-100 pa-2 ga-2">
    <v-select
      v-model="filterId"
      :items="props.filters"
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
        :charts
        :disabled="!filters.length"
        :loading="isLoading"
        :newChartTitle="`Create ${filters.length} new chart${
          filters.length !== 1 ? 's' : ''
        }`"
        @addToChart="addFilter"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BoundingBox, Filter, Location } from '@deltares/fews-pi-requests'
import Autocomplete from '@/components/general/Autocomplete.vue'
import AnalysisMap from '@/components/analysis/AnalysisMap.vue'
import AnalysisAddButton from '@/components/analysis/AnalysisAddButton.vue'
import LocationsLayer from '@/components/wms/LocationsLayer.vue'
import { computed, ref, watch } from 'vue'
import type { MapLayerMouseEvent, MapLayerTouchEvent } from 'maplibre-gl'
import { useParametersStore } from '@/stores/parameters'
import {
  type Chart,
  type CollectionEmits,
  createNewChartsForFilters,
  addFilterToChart,
} from '@/lib/analysis'
import { useFilterLocations } from '@/services/useFilterLocations'
import { useTimeSeriesHeaders } from '@/services/useTimeSeries'
import { configManager } from '@/services/application-config'

interface Props {
  charts: Chart[]
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

const filters = computed(() => {
  if (!filterId.value) return []
  if (!selectedParameterIds.value.length) return []
  if (!selectedLocationIds.value.length) return []

  const parameters = selectedParameterIds.value
    .map(parametersStore.byId)
    .filter((parameter) => parameter !== undefined)

  // Group by parameterGroup
  const groupedParameters: Record<string, string[]> = {}
  parameters.forEach((parameter) => {
    const group = parameter?.parameterGroup
    if (!group) return

    if (!groupedParameters[group]) {
      groupedParameters[group] = []
    }
    groupedParameters[group].push(parameter.id)
  })

  return Object.values(groupedParameters).map((parameterIds) => {
    const moduleInstanceIds = selectedModuleInstanceIds.value
    return {
      filterId: filterId.value,
      locationIds: selectedLocationIds.value.join(','),
      parameterIds: parameterIds.join(','),
      moduleInstanceIds: moduleInstanceIds.length
        ? moduleInstanceIds.join(',')
        : undefined,
    }
  })
})

async function addFilter(chart?: Chart) {
  if (!filters.value.length) return

  if (chart === undefined) {
    isLoading.value = true
    const charts = await createNewChartsForFilters(filters.value)
    isLoading.value = false

    charts.forEach((newChart) => emit('addChart', newChart))
    return
  }

  if (filters.value.length !== 1)
    throw new Error('Only one filter can be added to an existing chart')
  const filter = filters.value[0]
  if (chart.type !== 'filter') return

  await addFilterToChart(chart, filter)
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
