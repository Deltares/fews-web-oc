<template>
  <div class="container" ref="container">
    <div class="child-container" :class="{ 'd-none': hideMap }">
      <SpatialDisplayComponent
        :layer-name="props.layerName"
        :location-ids="props.locationIds"
        :latitude="props.latitude"
        :longitude="props.longitude"
        :locations="locations"
        :geojson="geojson"
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
import {
  computed,
  defineAsyncComponent,
  ref,
  useTemplateRef,
  watch,
  onMounted,
} from 'vue'
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

const emit = defineEmits(['navigate'])

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

const filter = computed(() => {
  if (
    !props.settings.charts.timeSeriesChart.enabled &&
    !props.settings.charts.timeSeriesTable.enabled
  ) {
    return
  }

  if (props.locationIds) {
    return getFilterActionsFilter(props.locationIds)
  }
  if (props.longitude && props.latitude) {
    return getTimeSeriesGridActionsFilter(props.longitude, props.latitude)
  }
  return {}
})

const showChartPanel = computed(() => {
  return (
    currentLocationIds.value ||
    (currentLongitude.value && currentLatitude.value)
  )
})

const elevationChartFilter = computed(() => {
  if (
    !props.settings.charts.verticalProfileChart.enabled &&
    !props.settings.charts.verticalProfileTable.enabled
  ) {
    return
  }

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

const locationsTooltipFilter = computed<LocationsTooltipFilter | undefined>(
  () => {
    if (!props.settings.charts.metaDataPanel.enabled) return
    if (props.locationIds === undefined) return
    if (filterIds.value.length === 0) return
    return {
      locationId: props.locationIds?.split(',')[0],
      filterId: filterIds.value[0],
    }
  },
)

const currentLocationIds = ref<string[]>()
const currentLatitude = ref<string>()
const currentLongitude = ref<string>()
const elevation = ref<number | undefined>()
const currentTime = ref<Date>()

onMounted(() => {
  currentLocationIds.value = props.locationIds?.split(',')
  currentLatitude.value = props.latitude
  currentLongitude.value = props.longitude
})

const { width: containerWidth } = useElementSize(containerRef)

const containerIsMobileSize = computed(() => {
  return containerWidth.value < thresholds.value.md
})

const hideMap = computed(() => {
  return (
    containerIsMobileSize.value &&
    (currentLocationIds.value ||
      currentLongitude.value ||
      currentLatitude.value)
  )
})

function onLocationsChange(locationIds: string[] | null): void {
  if (!locationIds) return
  openLocationsTimeSeriesDisplay(locationIds)
}

function openLocationsTimeSeriesDisplay(locationIds: string[]) {
  currentLocationIds.value = locationIds
  currentLatitude.value = undefined
  currentLongitude.value = undefined

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
  currentLatitude.value = latitude.toFixed(3)
  currentLongitude.value = longitude.toFixed(3)
  currentLocationIds.value = undefined

  const to = {
    name: 'SpatialTimeSeriesDisplayWithCoordinates',
    params: {
      latitude,
      longitude,
    },
  }
  emit('navigate', to)
}

function closeTimeSeriesDisplay(): void {
  currentLocationIds.value = undefined
  currentLatitude.value = undefined
  currentLongitude.value = undefined

  emit('navigate', { name: 'SpatialDisplay' })
}

watch(
  () => locations.value,
  () => {
    const newLocationIds = locations.value
      ?.filter((l) => currentLocationIds.value?.includes(l.locationId))
      .map((l) => l.locationId)
    if (newLocationIds?.length) {
      openLocationsTimeSeriesDisplay(newLocationIds)
    } else {
      currentLocationIds.value = undefined
    }
  },
)

watch(
  () => props.layerName,
  () => {
    if (
      currentLatitude.value &&
      currentLongitude.value &&
      !props.latitude &&
      !props.longitude
    ) {
      openCoordinatesTimeSeriesDisplay(
        +currentLatitude.value,
        +currentLongitude.value,
      )
    }
  },
)
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
