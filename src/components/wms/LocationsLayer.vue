<template>
  <MapboxLayer
    v-if="showLocationsLayer"
    id="location-layer"
    :source="locationsLayerSource"
    :options="locationsLayerOptions"
  />
  <v-chip class="chip" :style="{ backgroundColor: backgroundColor }" pill label>
    <v-icon>mdi-map-marker</v-icon>
    <v-switch
      class="ml-2 mt-5"
      color="primary"
      :model-value="showLocationsLayer"
      @update:model-value="onShowLocationsLayerChange"
    />
  </v-chip>
</template>

<script setup lang="ts">
import { Ref, ref, watchEffect } from 'vue'
import { configManager } from '@/services/application-config'
import { fetchLocationsAsGeoJson } from '@/lib/topology'
import { Location } from '@deltares/fews-pi-requests'
import { MapboxLayer, useMap } from '@studiometa/vue-mapbox-gl'
import {
  Map,
  GeoJSONSource,
  type MapLayerMouseEvent,
  type MapLayerTouchEvent,
} from 'mapbox-gl'

import useLocationsLayer from '@/services/useLocationsLayer'

interface Props {
  filterIds: string[]
}
const props = withDefaults(defineProps<Props>(), {
  filterIds: () => {
    return []
  },
})

const emit = defineEmits(['click'])

const backgroundColor = ref<string>(
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'rgba(0,0,0,.5)'
    : 'rgba(255,255,255,.5)',
)

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { map } = useMap() as { map: Ref<Map> }

const locationsGeoJson = ref<
  GeoJSON.FeatureCollection<GeoJSON.Geometry, Location>
>({
  type: 'FeatureCollection',
  features: [],
})

const showLocationsLayer = ref<boolean>(true)
const { locationsLayerOptions } = useLocationsLayer(locationsGeoJson)
const locationsLayerSource = 'location-layer'
const selectedLocationId: Ref<string | null> = ref(null)

map.value.on('click', 'location-layer', (e) => {
  const features = map.value.queryRenderedFeatures(e.point, {
    layers: ['location-layer'],
  })
  if (!features.length) return

  selectedLocationId.value = features[0].properties?.locationId ?? null
  highlightSelectedLocationOnMap()
  onLocationClick(e)
})

map.value.on('mouseenter', 'location-layer', () => {
  map.value.getCanvas().style.cursor = 'pointer'
})

map.value.on('mouseleave', 'location-layer', () => {
  map.value.getCanvas().style.cursor = ''
})

watchEffect(async () => {
  if (!props.filterIds) return
  locationsGeoJson.value = await fetchLocationsAsGeoJson(
    baseUrl,
    props.filterIds,
  )
  const source = map.value.getSource(locationsLayerSource) as GeoJSONSource
  if (source) {
    source.setData(locationsGeoJson.value)
  }
})

function highlightSelectedLocationOnMap() {
  if (!selectedLocationId.value) return
  map.value.setPaintProperty(locationsLayerSource, 'circle-color', [
    'match',
    ['get', 'locationId'],
    selectedLocationId.value,
    '#0c1e38', // color for selected location
    '#dfdfdf', // default color
  ])
  map.value.setPaintProperty(locationsLayerSource, 'circle-stroke-color', [
    'match',
    ['get', 'locationId'],
    selectedLocationId.value,
    'white', // stroke color for selected location
    'black', // default stroke color
  ])
  map.value.setPaintProperty(locationsLayerSource, 'circle-radius', [
    'match',
    ['get', 'locationId'],
    selectedLocationId.value,
    7, // radius for selected location
    5, // default radius
  ])
}

function onShowLocationsLayerChange(): void {
  showLocationsLayer.value = !showLocationsLayer.value
}

function onLocationClick(event: MapLayerMouseEvent | MapLayerTouchEvent): void {
  emit('click', event)
}
</script>

<style scoped>
.chip {
  backdrop-filter: blur(4px);
  position: absolute;
  font-size: 0.825em;
  z-index: 1000;
  background-color: none;
  top: 10px;
  left: 10px;
}
</style>
