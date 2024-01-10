<template>
  <div class="container">
    <div class="child-container" :class="{ hidden: hideMap }">
      <SpatialDisplayComponent
        :layer-name="props.layerName"
        :location-id="props.locationId"
        :filter-ids="props.filterIds"
        @location-click="onLocationClick"
      ></SpatialDisplayComponent>
    </div>
    <div v-if="props.locationId" class="child-container">
      <router-view
        @close="closeTimeSeriesDisplay"
        :filterIds="props.filterIds"
      ></router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SpatialDisplayComponent from '@/components/spatialdisplay/SpatialDisplayComponent.vue'
import { useDisplay } from 'vuetify'
import type { MapLayerMouseEvent, MapLayerTouchEvent } from 'mapbox-gl'
import { useRoute, useRouter } from 'vue-router'
import { findParentRoute } from '@/router'
import { onMounted } from 'vue'

interface Props {
  layerName?: string
  locationId?: string
  filterIds?: string
}

const props = withDefaults(defineProps<Props>(), {
  layerName: '',
  filterIds: '',
})

const route = useRoute()
const router = useRouter()
const { mobile } = useDisplay()

const currentLocationId = ref<string>('')

onMounted(() => {
  currentLocationId.value === props.locationId
})

const hideMap = computed(() => {
  mobile.value && props.locationId
})

function onLocationClick(event: MapLayerMouseEvent | MapLayerTouchEvent): void {
  if (!event.features) return
  const location: string | undefined = event.features[0].properties?.locationId
  if (location) openLocationTimeSeriesDisplay(location)
}

function openLocationTimeSeriesDisplay(locationId: string) {
  const routeName = route.name
    ?.toString()
    .replace('SpatialDisplay', 'SpatialTimeSeriesDisplay')
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
  display: flex;
  height: 100%;
  width: 100%;
}
</style>
