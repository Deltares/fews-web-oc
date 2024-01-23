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
        v-model:times="times"
        v-model:selected-layer="selectedLayer"
        v-model:elevation="elevation"
        @coordinate-click="onCoordinateClick"
      ></SpatialDisplayComponent>
    </div>
    <div v-if="props.locationId" class="child-container">
      <router-view
        @close="closeTimeSeriesDisplay"
        :filterIds="props.filterIds"
        :times="times"
        :selectedLayer="selectedLayer"
        :elevation="elevation"
      ></router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SpatialDisplayComponent from '@/components/spatialdisplay/SpatialDisplayComponent.vue'
import { useDisplay } from 'vuetify'
import { useRoute, useRouter } from 'vue-router'
import { findParentRoute } from '@/router'
import { onMounted } from 'vue'
import { Layer } from '@deltares/fews-wms-requests'
import { MapLayerMouseEvent, MapLayerTouchEvent } from 'mapbox-gl'

interface Props {
  layerName?: string
  locationId?: string
  filterIds?: string[]
  latitude?: number
  longitude?: number
}

const props = withDefaults(defineProps<Props>(), {
  layerName: '',
  locationId: '',
})

const route = useRoute()
const router = useRouter()
const { mobile } = useDisplay()

const currentLocationId = ref<string>('')
const times = ref<Date[]>()
const selectedLayer = ref<Layer>()
const elevation = ref<number>()

onMounted(() => {
  currentLocationId.value === props.locationId
})

const hideMap = computed(() => {
  return mobile.value && props.locationId
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
    currentLocationId.value = ''
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
