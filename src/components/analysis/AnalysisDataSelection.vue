<template>
  <div class="his-selection-container h-100 pa-2">
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
    <SelectCard
      v-model="selectedParameterIds"
      :items="filteredParameterIds"
      :label="config.parameterSelection.name ?? 'Parameters'"
      icon="mdi-tag"
      :getItemValue="(item) => item"
      :getItemTitle="parametersStore.getName"
      :multiple="true"
    />
    <SelectCard
      v-if="config.moduleInstanceSelection.enabled"
      v-model="selectedModuleInstanceIds"
      :items="filteredModuleInstanceIds"
      :label="config.moduleInstanceSelection.name ?? 'Sources'"
      icon="mdi-cog"
      :multiple="true"
    />
    <SelectCard
      v-model="selectedLocationIds"
      :items="filteredLocations"
      :label="config.locationSelection.name ?? 'Locations'"
      icon="mdi-map-marker-multiple"
      :getItemValue="getLocationId"
      :getItemTitle="getLocationTitle"
      :multiple="true"
    >
      <template #prepend-title>
        <AnalysisAttributesFilter
          v-if="config.locationAttributeSelection.enabled"
          :locations="locations"
          :attributes="config.locationAttributeSelection.attributes"
          @update:filteredLocationIds="selectedAttributeLocationIds = $event"
        />
      </template>
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
    </SelectCard>

    <div class="d-flex pt-2">
      <v-spacer />
      <AnalysisAddToButton
        :charts
        :filters
        :loadingNewCharts="isLoadingNewCharts"
        :loadingAddToChart="isLoadingAddToChart"
        @addToChart="addFilter"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  BoundingBox,
  Filter,
  Location,
  SelectionPanel,
} from '@deltares/fews-pi-requests'
import SelectCard from '@/components/general/SelectCard.vue'
import AnalysisMap from '@/components/analysis/AnalysisMap.vue'
import AnalysisAddToButton from '@/components/analysis/AnalysisAddToButton.vue'
import AnalysisAttributesFilter from '@/components/analysis/AnalysisAttributesFilter.vue'
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
  config: SelectionPanel
  filters?: Filter[]
  boundingBox?: BoundingBox
  isActive?: boolean
}

const props = defineProps<Props>()
const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const showMap = ref(false)

const isLoadingNewCharts = ref(false)
const isLoadingAddToChart = ref(false)
const parametersStore = useParametersStore()

const filterId = ref<string | undefined>(props.filters?.[0]?.id)

const { locations, geojson } = useFilterLocations(
  baseUrl,
  () => (filterId.value ? [filterId.value] : []),
  { showAttributes: true },
)
const { timeSeriesHeaders } = useTimeSeriesHeaders(baseUrl, filterId)

const filteredHeaders = computed(() => {
  if (selectedAttributeLocationIds.value.length === 0) {
    return timeSeriesHeaders.value
  }
  return timeSeriesHeaders.value.filter((header) =>
    selectedAttributeLocationIds.value.includes(header.locationId),
  )
})

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
  selectedAttributeLocationIds.value = []
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
    isLoadingNewCharts.value = true
    const charts = await createNewChartsForFilters(filters.value)
    isLoadingNewCharts.value = false

    charts.forEach((newChart) => emit('addChart', newChart))
    return
  }

  if (chart.type !== 'filter') return

  const promises = filters.value.map((filter) =>
    addFilterToChart(chart, filter),
  )

  isLoadingAddToChart.value = true
  await Promise.all(promises)
  isLoadingAddToChart.value = false
}

const selectedLocationIds = ref<string[]>([])
const selectedParameterIds = ref<string[]>([])
const selectedModuleInstanceIds = ref<string[]>([])
const selectedAttributeLocationIds = ref<string[]>([])

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

  filteredHeaders.value.forEach((header) => {
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
