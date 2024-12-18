<template>
  <div class="container" ref="container">
    <div class="child-container" :class="{ 'd-none': hideMap }">
      <SpatialDisplayComponent
        :layer-name="props.layerName"
        :location-id="currentLocationId"
        :latitude="currentLatitude"
        :longitude="currentLongitude"
        :filter-ids="props.filterIds"
        @changeLocationId="onLocationChange"
        :layer-capabilities="layerCapabilities"
        :times="times"
        :settings="props.settings"
        :max-values-time-series="maxValuesTimeSeries"
        v-model:elevation="elevation"
        v-model:current-time="currentTime"
        @coordinate-click="onCoordinateClick"
      ></SpatialDisplayComponent>
    </div>
    <div v-if="showChartPanel" class="child-container">
      <router-view v-slot="{ Component }">
        <component
          :is="Component ?? SpatialTimeSeriesDisplay"
          @close="closeTimeSeriesDisplay"
          :filter="filter"
          :elevation-chart-filter="elevationChartFilter"
          :current-time="currentTime"
          :settings="props.settings"
        />
      </router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref, useTemplateRef, watch } from 'vue'
import SpatialDisplayComponent from '@/components/spatialdisplay/SpatialDisplayComponent.vue'
import { useDisplay } from 'vuetify'
import { configManager } from '@/services/application-config'
import { useRoute, useRouter } from 'vue-router'
import { findParentRoute } from '@/router'
import { onMounted } from 'vue'
import {
  useWmsLayerCapabilities,
  useWmsMaxValuesTimeSeries,
} from '@/services/useWms'
import {
  filterActionsFilter,
  timeSeriesGridActionsFilter,
} from '@deltares/fews-pi-requests'
import { toMercator } from '@turf/projection'
import circle from '@turf/circle'
import bbox from '@turf/bbox'
import { useUserSettingsStore } from '@/stores/userSettings'
import type { UseDisplayConfigOptions } from '@/services/useDisplayConfig'
import type { MapSettings } from '@/lib/topology/componentSettings'
import { useElementSize } from '@vueuse/core'
const SpatialTimeSeriesDisplay = defineAsyncComponent(
  () => import('@/components/spatialdisplay/SpatialTimeSeriesDisplay.vue'),
)

interface Props {
  layerName?: string
  locationId?: string
  filterIds?: string[]
  latitude?: string
  longitude?: string
  settings?: MapSettings
}

const props = withDefaults(defineProps<Props>(), {
  layerName: '',
  filterIds: () => [],
})

const route = useRoute()
const router = useRouter()
const { thresholds } = useDisplay()
const containerRef = useTemplateRef('container')

const userSettings = useUserSettingsStore()
const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { layerCapabilities, times } = useWmsLayerCapabilities(
  baseUrl,
  () => props.layerName,
)

const start = computed(() => {
  if (!times.value || times.value.length === 0) return null
  return times.value[0]
})
const end = computed(() => {
  if (!times.value || times.value.length === 0) return null
  return times.value[times.value.length - 1]
})

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

function getFilterActionsFilter(): filterActionsFilter &
  UseDisplayConfigOptions {
  return {
    locationIds: currentLocationId.value,
    filterId: props.filterIds ? props.filterIds[0] : undefined,
    useDisplayUnits: userSettings.useDisplayUnits,
    convertDatum: userSettings.convertDatum,
  }
}

function getTimeSeriesGridActionsFilter():
  | (timeSeriesGridActionsFilter & UseDisplayConfigOptions)
  | undefined {
  if (!currentLongitude.value || !currentLatitude.value) return
  if (!layerCapabilities.value?.boundingBox) return
  if (!layerCapabilities.value?.firstValueTime) return
  if (!layerCapabilities.value?.lastValueTime) return

  const coordinates = [+currentLongitude.value, +currentLatitude.value]
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
  if (currentLocationId.value) {
    return getFilterActionsFilter()
  }
  if (currentLatitude.value && currentLongitude.value) {
    return getTimeSeriesGridActionsFilter()
  }
})

const showChartPanel = computed(() => {
  return (
    filter.value !== undefined && !(props.settings?.chartPanelEnabled === false)
  )
})

const elevationChartFilter = computed(() => {
  if (!layerCapabilities.value?.elevation) return
  const actionsFilter = getTimeSeriesGridActionsFilter()
  if (actionsFilter) {
    return {
      ...actionsFilter,
      elevation: undefined,
      showVerticalProfile: true,
    }
  }
})

const currentLocationId = ref<string>()
const currentLatitude = ref<string>()
const currentLongitude = ref<string>()
const elevation = ref<number | undefined>()
const currentTime = ref<Date>()

onMounted(() => {
  currentLocationId.value = props.locationId
  currentLatitude.value = props.latitude
  currentLongitude.value = props.longitude
})

const { width: containerWidth } = useElementSize(containerRef)

const containerIsMobileSize = computed(() => {
  return containerWidth.value < thresholds.value.lg
})

const hideMap = computed(() => {
  return (
    containerIsMobileSize.value &&
    (currentLocationId.value || currentLongitude.value || currentLatitude.value)
  )
})

function onLocationChange(locationId: string | null): void {
  if (!locationId) return
  openLocationTimeSeriesDisplay(locationId)
}

function openLocationTimeSeriesDisplay(locationId: string) {
  const routeName = route.name
    ?.toString()
    .replace('SpatialDisplay', 'SpatialTimeSeriesDisplay')
    .replace('WithCoordinates', '')
  currentLocationId.value = locationId
  currentLatitude.value = undefined
  currentLongitude.value = undefined
  router.push({
    name: routeName,
    params: {
      nodeId: route.params.nodeId,
      layerName: props.layerName,
      locationId,
    },
    query: route.query,
  })
}

function onCoordinateClick(latitude: number, longitude: number): void {
  openCoordinatesTimeSeriesDisplay(latitude, longitude)
}

function openCoordinatesTimeSeriesDisplay(latitude: number, longitude: number) {
  if (!onlyCoverageLayersAvailable.value) return
  const routeName = route.name
    ?.toString()
    .replace('SpatialDisplay', 'SpatialTimeSeriesDisplay')
    .replace('WithCoordinates', '')
    .replace(
      'SpatialTimeSeriesDisplay',
      'SpatialTimeSeriesDisplayWithCoordinates',
    )
  if (!routeName || !router.hasRoute(routeName)) return

  currentLatitude.value = latitude.toFixed(3)
  currentLongitude.value = longitude.toFixed(3)
  currentLocationId.value = undefined
  router.push({
    name: routeName,
    params: {
      nodeId: route.params.nodeId,
      layerName: props.layerName,
      latitude,
      longitude,
    },
    query: route.query,
  })
}

function closeTimeSeriesDisplay(): void {
  currentLocationId.value = undefined
  currentLatitude.value = undefined
  currentLongitude.value = undefined

  const parentRoute = findParentRoute(route)
  if (parentRoute !== null) {
    router.push({
      name: parentRoute.name,
      params: {
        nodeId: route.params.nodeId,
        layerName: props.layerName,
      },
      query: route.query,
    })
  }
}

watch(
  () => props.layerName,
  () => {
    if (currentLocationId.value && !props.locationId) {
      openLocationTimeSeriesDisplay(currentLocationId.value)
    }
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
