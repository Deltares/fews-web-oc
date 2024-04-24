<template>
  <div class="container">
    <div class="child-container" :class="{ 'd-none': hideMap }">
      <SpatialDisplayComponent
        :layer-name="props.layerName"
        :location-id="props.locationId"
        :latitude="props.latitude"
        :longitude="props.longitude"
        :filter-ids="props.filterIds"
        @changeLocationId="onLocationChange"
        :layer-capabilities="layerCapabilities"
        :times="times"
        v-model:elevation="elevation"
        v-model:current-time="currentTime"
        @coordinate-click="onCoordinateClick"
      ></SpatialDisplayComponent>
    </div>
    <div v-if="filter" class="child-container">
      <router-view
        @close="closeTimeSeriesDisplay"
        :filter="filter"
        :elevation-chart-filter="elevationChartFilter"
        :current-time="currentTime"
      ></router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SpatialDisplayComponent from '@/components/spatialdisplay/SpatialDisplayComponent.vue'
import { useDisplay } from 'vuetify'
import type { MapLayerMouseEvent, MapLayerTouchEvent } from 'maplibre-gl'
import { configManager } from '@/services/application-config'
import { useRoute, useRouter } from 'vue-router'
import { findParentRoute } from '@/router'
import { onMounted } from 'vue'
import { useWmsLayerCapabilities } from '@/services/useWms'
import {
  filterActionsFilter,
  timeSeriesGridActionsFilter,
} from '@deltares/fews-pi-requests'
import { toMercator } from '@turf/projection'
import circle from '@turf/circle'
import bbox from '@turf/bbox'
import { useUserSettingsStore } from '@/stores/userSettings'
import { UseDisplayConfigOptions } from '@/services/useDisplayConfig'

interface Props {
  layerName?: string
  locationId?: string
  filterIds?: string[]
  latitude?: string
  longitude?: string
}

const props = withDefaults(defineProps<Props>(), {
  layerName: '',
})

const route = useRoute()
const router = useRouter()
const { mobile } = useDisplay()

const settings = useUserSettingsStore()
const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { layerCapabilities, times } = useWmsLayerCapabilities(
  baseUrl,
  () => props.layerName,
)

function getFilterActionsFilter(): filterActionsFilter &
  UseDisplayConfigOptions {
  return {
    locationIds: props.locationId,
    filterId: props.filterIds ? props.filterIds[0] : undefined,
    useDisplayUnits: settings.useDisplayUnits,
    convertDatum: settings.convertDatum,
  }
}

function getTimeSeriesGridActionsFilter():
  | (timeSeriesGridActionsFilter & UseDisplayConfigOptions)
  | undefined {
  if (!props.longitude || !props.latitude) return
  if (!layerCapabilities.value?.boundingBox) return
  if (!layerCapabilities.value?.firstValueTime) return
  if (!layerCapabilities.value?.lastValueTime) return

  const coordinates = [+props.longitude, +props.latitude]
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
    useDisplayUnits: settings.useDisplayUnits,
    // Should be available according to the docs, but errors
    // convertDatum: settings.convertDatum,
  }
}

const filter = computed(() => {
  if (props.locationId) {
    return getFilterActionsFilter()
  }
  if (props.longitude && props.latitude) {
    return getTimeSeriesGridActionsFilter()
  }
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

const hideMap = computed(() => {
  return mobile.value && (props.locationId || props.latitude || props.longitude)
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

function onCoordinateClick(
  event: MapLayerMouseEvent | MapLayerTouchEvent,
): void {
  openCoordinatesTimeSeriesDisplay(
    +event.lngLat.lat.toFixed(3),
    +event.lngLat.lng.toFixed(3),
  )
}

function openCoordinatesTimeSeriesDisplay(latitude: number, longitude: number) {
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
  const parentRoute = findParentRoute(route)
  if (parentRoute !== null) {
    currentLocationId.value = undefined
    currentLatitude.value = undefined
    currentLongitude.value = undefined
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
