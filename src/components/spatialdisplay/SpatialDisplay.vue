<template>
  <div class="container" ref="container">
    <div class="child-container" :class="{ 'd-none': hideMap }">
      <SpatialDisplayComponent
        :layer-name="props.layerName"
        :location-ids="props.locationIds"
        :latitude="props.latitude"
        :longitude="props.longitude"
        :locations="filteredLocations"
        :geojson="filteredGeojson"
        @changeLocationIds="onLocationsChange"
        :layer-capabilities="layerCapabilities"
        :bounding-box="boundingBox"
        :times="times"
        :settings="settings.map"
        :max-values-time-series="maxValuesTimeSeries"
        v-model:elevation="elevation"
        @update:current-time="currentTime = $event"
        @coordinate-click="onCoordinateClick"
      ></SpatialDisplayComponent>
    </div>
    <div v-if="showChartPanel" class="child-container">
      <SpatialTimeSeriesDisplay
        @close="closeTimeSeriesDisplay"
        :filter="filter"
        :elevation-chart-filter="elevationChartFilter"
        :locations-tooltip-filter="locationsTooltipFilter"
        :current-time="currentTime"
        :settings="settings"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref, useTemplateRef, watch } from 'vue'
import SpatialDisplayComponent from '@/components/spatialdisplay/SpatialDisplayComponent.vue'
import { useDisplay } from 'vuetify'
import { configManager } from '@/services/application-config'
import {
  useWmsLayerCapabilities,
  useWmsMaxValuesTimeSeries,
} from '@/services/useWms'
import {
  filterActionsFilter,
  LocationsTooltipFilter,
  timeSeriesGridActionsFilter,
  type TopologyNode,
} from '@deltares/fews-pi-requests'
import { toMercator } from '@turf/projection'
import circle from '@turf/circle'
import bbox from '@turf/bbox'
import { useUserSettingsStore } from '@/stores/userSettings'
import { useFilterLocations } from '@/services/useFilterLocations'
import type { UseDisplayConfigOptions } from '@/services/useDisplayConfig'
import {
  type ComponentSettings,
  getDefaultSettings,
} from '@/lib/topology/componentSettings'
import { useElementSize } from '@vueuse/core'
import { useDateRegistry } from '@/services/useDateRegistry'
import type { NavigateRoute } from '@/lib/router'
import { useWarningLevelsStore } from '@/stores/warningLevels'
import { useLocationNamesStore } from '@/stores/locationNames'

const SpatialTimeSeriesDisplay = defineAsyncComponent(
  () => import('@/components/spatialdisplay/SpatialTimeSeriesDisplay.vue'),
)

interface Props {
  layerName?: string
  locationIds?: string
  latitude?: string
  longitude?: string
  topologyNode?: TopologyNode
  settings?: ComponentSettings
}

const props = withDefaults(defineProps<Props>(), {
  layerName: '',
  settings: () => getDefaultSettings(),
})

interface Emits {
  navigate: [to: NavigateRoute]
}
const emit = defineEmits<Emits>()

const warningLevelsStore = useWarningLevelsStore()
const locationNamesStore = useLocationNamesStore()

const { thresholds } = useDisplay()
const containerRef = useTemplateRef('container')

const boundingBox = computed(() => props.topologyNode?.boundingBox)
const filterIds = computed(() => props.topologyNode?.filterIds ?? [])

const userSettings = useUserSettingsStore()
const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { layerCapabilities, times } = useWmsLayerCapabilities(
  baseUrl,
  () => props.layerName,
)
const { locations, geojson } = useFilterLocations(baseUrl, filterIds)
watch(locations, (newLocations) =>
  locationNamesStore.addLocationNames(newLocations ?? []),
)

const selectedWarningLevelSeverity = computed(() =>
  warningLevelsStore.selectedWarningLevels.map((level) => level.severity),
)
const filteredLocations = computed(() => {
  if (selectedWarningLevelSeverity.value.length === 0) return locations.value
  return locations.value?.filter((location) =>
    selectedWarningLevelSeverity.value.includes(
      location.thresholdSeverity ?? 0,
    ),
  )
})
const filteredGeojson = computed(() => {
  if (selectedWarningLevelSeverity.value.length === 0) return geojson.value
  const filteredFeatures = geojson.value.features.filter((feature) =>
    selectedWarningLevelSeverity.value.includes(
      feature.properties.thresholdSeverity ?? 0,
    ),
  )
  return { ...geojson.value, ...{ features: filteredFeatures } }
})

const start = computed(() => {
  if (!times.value || times.value.length === 0) return null
  return times.value[0]
})
const end = computed(() => {
  if (!times.value || times.value.length === 0) return null
  return times.value[times.value.length - 1]
})

useDateRegistry(() => times.value ?? [])

const maxValuesTimeSeries = useWmsMaxValuesTimeSeries(
  baseUrl,
  () => props.layerName,
  start,
  end,
)

const onlyCoverageLayersAvailable = computed(
  () =>
    layerCapabilities.value?.onlyGrids === undefined ||
    layerCapabilities.value.onlyGrids,
)

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

function getTimeSeriesGridActionsFilter(
  longitude: string,
  latitude: string,
): (timeSeriesGridActionsFilter & UseDisplayConfigOptions) | undefined {
  if (!longitude || !latitude) return
  if (!layerCapabilities.value?.boundingBox) return
  if (!layerCapabilities.value?.firstValueTime) return
  if (!layerCapabilities.value?.lastValueTime) return

  const coordinates = [+longitude, +latitude]
  const [x, y] = toMercator(coordinates)
  const clickRadius = circle(coordinates, 10, { steps: 4, units: 'kilometers' })
  const bboxArray = bbox(clickRadius)
  const mercatorBbox = [
    ...toMercator(bboxArray.slice(0, 2)),
    ...toMercator(bboxArray.slice(-2)),
  ]
  const startTime = layerCapabilities.value.firstValueTime
  const endTime = layerCapabilities.value.lastValueTime

  return {
    layers: props.layerName,
    x,
    y,
    startTime,
    endTime,
    bbox: mercatorBbox,
    documentFormat: 'PI_JSON',
    elevation: elevation.value ?? layerCapabilities.value.elevation?.upperValue,
    useDisplayUnits: userSettings.useDisplayUnits,
    // Should be available according to the docs, but errors
    // convertDatum: settings.convertDatum,
  }
}

const shouldFetchFilter = computed(
  () =>
    props.settings.charts.timeSeriesChart.enabled ||
    props.settings.charts.timeSeriesTable.enabled,
)

const filter = computed(() => {
  if (!shouldFetchFilter.value) return

  if (props.locationIds) {
    return getFilterActionsFilter(props.locationIds)
  }
  if (props.longitude && props.latitude) {
    return getTimeSeriesGridActionsFilter(props.longitude, props.latitude)
  }
  return {}
})

const showChartPanel = computed(() => {
  return props.locationIds || (props.longitude && props.latitude)
})

const shouldFetchElevationChart = computed(
  () =>
    props.settings.charts.verticalProfileChart.enabled ||
    props.settings.charts.verticalProfileTable.enabled,
)

const elevationChartFilter = computed(() => {
  if (!shouldFetchElevationChart.value) return

  if (!layerCapabilities.value?.elevation) return
  if (props.longitude && props.latitude) {
    const actionsFilter = getTimeSeriesGridActionsFilter(
      props.longitude,
      props.latitude,
    )
    if (actionsFilter) {
      return {
        ...actionsFilter,
        elevation: undefined,
        showVerticalProfile: true,
      }
    }
  }
})

const shouldFetchLocationsTooltip = computed(
  () => props.settings.charts.metaDataPanel.enabled,
)

const locationsTooltipFilter = computed<LocationsTooltipFilter | undefined>(
  () => {
    if (!shouldFetchLocationsTooltip.value) return
    if (props.locationIds === undefined) return
    if (filterIds.value.length === 0) return
    return {
      locationId: props.locationIds?.split(',')[0],
      filterId: filterIds.value[0],
    }
  },
)

const elevation = ref<number | undefined>()
const currentTime = ref<Date>()

const { width: containerWidth } = useElementSize(containerRef)

const containerIsMobileSize = computed(() => {
  return containerWidth.value < thresholds.value.md
})

const hideMap = computed(() => {
  return containerIsMobileSize.value && showChartPanel.value
})

function onLocationsChange(locationIds: string[] | null): void {
  if (!locationIds) return
  openLocationsTimeSeriesDisplay(locationIds)
}

function openLocationsTimeSeriesDisplay(locationIds: string[]) {
  const to = {
    name: 'SpatialTimeSeriesDisplay',
    params: {
      locationIds: locationIds.join(','),
    },
  }
  emit('navigate', to)
}

function onCoordinateClick(latitude: number, longitude: number): void {
  openCoordinatesTimeSeriesDisplay(latitude, longitude)
}

function openCoordinatesTimeSeriesDisplay(latitude: number, longitude: number) {
  if (!onlyCoverageLayersAvailable.value) return

  const _latitude = latitude.toFixed(3)
  const _longitude = longitude.toFixed(3)

  const to = {
    name: 'SpatialTimeSeriesDisplayWithCoordinates',
    params: {
      latitude: _latitude,
      longitude: _longitude,
    },
  }
  emit('navigate', to)
}

function closeTimeSeriesDisplay(): void {
  emit('navigate', { name: 'SpatialDisplay' })
}

watch(locations, () => {
  if (
    !locations.value?.length ||
    props.locationIds
      ?.split(',')
      .some((id) => !locations.value?.map((l) => l.locationId).includes(id))
  ) {
    closeTimeSeriesDisplay()
  }
})
</script>

<style scoped>
.container {
  display: flex;
  width: 100%;
  height: 100%;
}

.child-container {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 50%;
  max-width: 100%;
  flex: 1 1 0px;
}

.child-container.mobile {
  height: 100%;
  width: 100%;
}
</style>
