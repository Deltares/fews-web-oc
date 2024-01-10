<template>
  <div class="container">
    <div class="child-container" :class="{ hidden: hideMap }">
      <SpatialDisplayComponent
        :layer-name="props.layerName"
        :location-id="locationId"
        v-model:filter-ids="filterIds"
        @location-click="onLocationClick"
      ></SpatialDisplayComponent>
    </div>
    <div
      class="child-container"
      :class="{
        mobile,
        hidden: hideTimeSeries,
      }"
    >
      <router-view
        @close="closeTimeSeriesDisplay"
        :filterIds="filterIds"
      ></router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import SpatialDisplayComponent from '@/components/spatialdisplay/SpatialDisplayComponent.vue'
import { useDisplay } from 'vuetify'
import type { MapLayerMouseEvent, MapLayerTouchEvent } from 'mapbox-gl'
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'

interface Props {
  layerName?: string
}

const props = withDefaults(defineProps<Props>(), {
  layerName: '',
})

const route = useRoute()
const router = useRouter()

const filterIds = ref<string[]>([])
const locationId = ref<string | null>(null)

watchEffect(() => {
  const routeLocation =
    typeof route.params.locationId === 'string' ? route.params.locationId : null
  locationId.value = routeLocation
})

if (locationId.value) {
  openLocationTimeSeriesDisplay()
}

const { mobile } = useDisplay()

const hideTimeSeries = computed(() => {
  return (
    locationId.value === null ||
    filterIds.value.length === 0 ||
    filterIds.value[0] === ''
  )
})

const hideMap = computed(() => {
  mobile.value && !hideTimeSeries.value
})

function onLocationClick(event: MapLayerMouseEvent | MapLayerTouchEvent): void {
  if (!event.features) return
  const location: string | null =
    event.features[0].properties?.locationId ?? null
  locationId.value = location
  if (locationId.value !== null) {
    openLocationTimeSeriesDisplay()
  }
}

function openLocationTimeSeriesDisplay() {
  const routeName = route.name
    ?.toString()
    .replace('SpatialDisplay', 'SpatialTimeSeriesDisplay')
  router.push({
    name: routeName,
    params: {
      nodeId: route.params.nodeId,
      layerName: props.layerName,
      locationId: locationId.value,
    },
  })
}

function closeTimeSeriesDisplay(location: string): void {
  if (location) {
    const routeName = route.name
      ?.toString()
      .replace('SpatialTimeSeriesDisplay', 'SpatialDisplay')
    router.push({
      name: routeName,
      params: {
        nodeId: route.params.nodeId,
        layerName: props.layerName,
      },
    })
    locationId.value = null
  }
}

/**
 * Causes on route changes to a different layer while having selected a location
 * to keep that location for the new layer
 */
onBeforeRouteUpdate((to, from) => {
  const goingToLocationRoute =
    to.params.locationId !== '' && to.params.locationId !== undefined
  const sourceIdIsTheSame = to.params.layerName === from.params.layerName

  if (goingToLocationRoute || (sourceIdIsTheSame && !locationId.value)) {
    return
  }

  const comingFromLocationRoute =
    from.params.locationId !== '' && from.params.locationId !== undefined

  if (comingFromLocationRoute) {
    router.push({
      path: `${to.path}/location/${from.params.locationId}`,
    })
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
  display: flex;
  height: 100%;
  width: 100%;
}

.child-container.hidden {
  display: none !important;
}
</style>
