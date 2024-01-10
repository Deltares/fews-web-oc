<template>
  <MapboxLayer id="location-layer" :options="defaultLocationsLayerOptions" />
  <v-chip class="locations-layer__chip" pill label>
    <v-icon>mdi-map-marker</v-icon>
    <v-switch class="ml-2 mt-5" color="primary" v-model="showLocationsLayer" />
  </v-chip>
</template>

<script setup lang="ts">
import { Ref, ref, watch, watchEffect } from 'vue'
import { configManager } from '@/services/application-config'
import { fetchLocationsAsGeoJson } from '@/lib/topology'
import { MapboxLayer, useMap } from '@studiometa/vue-mapbox-gl'
import { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson'
import {
  Map,
  GeoJSONSource,
  type MapLayerMouseEvent,
  type MapLayerTouchEvent,
  type CircleLayer,
} from 'mapbox-gl'

interface Props {
  filterIds: string[]
  locationId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  locationId: null,
})

const emit = defineEmits(['click'])

const emptyFeatureCollection: FeatureCollection<Geometry, GeoJsonProperties> = {
  type: 'FeatureCollection',
  features: [],
}

const defaultLocationsLayerOptions: CircleLayer = {
  id: 'location-layer',
  type: 'circle',
  source: {
    type: 'geojson',
    data: emptyFeatureCollection,
  },
  layout: {
    visibility: 'visible',
  },
  paint: {
    'circle-radius': 5,
    'circle-color': '#dfdfdf',
    'circle-opacity': 0.5,
    'circle-stroke-color': 'black',
    'circle-stroke-width': 1.5,
  },
}

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { map } = useMap() as { map: Ref<Map> }

const locationsGeoJson = ref<
  GeoJSON.FeatureCollection<GeoJSON.Geometry, GeoJsonProperties>
>(emptyFeatureCollection)

const showLocationsLayer = ref<boolean>(true)
const locationsLayerSourceId = 'location-layer'

map.value.on('click', 'location-layer', (e) => {
  const features = map.value.queryRenderedFeatures(e.point, {
    layers: ['location-layer'],
  })
  if (!features.length) return

  onLocationClick(e)
})

map.value.on('mouseenter', 'location-layer', () => {
  map.value.getCanvas().style.cursor = 'pointer'
})

map.value.on('mouseleave', 'location-layer', () => {
  map.value.getCanvas().style.cursor = ''
})

watch(
  () => props.locationId,
  () => {
    highlightSelectedLocationOnMap()
  },
)

watchEffect(async () => {
  if (!props.filterIds) return
  if (showLocationsLayer.value) {
    locationsGeoJson.value = await fetchLocationsAsGeoJson(
      baseUrl,
      props.filterIds,
    )
  } else {
    locationsGeoJson.value = emptyFeatureCollection
  }
})

watch(locationsGeoJson, () => {
  const source = map.value.getSource(locationsLayerSourceId) as GeoJSONSource
  if (source) {
    source.setData(locationsGeoJson.value)
  }
})

function highlightSelectedLocationOnMap() {
  if (!map.value.getSource(locationsLayerSourceId)) return

  // Set color to default if no layer is available
  const locationId = props.locationId ?? 'noLayerSelected'
  map.value.setPaintProperty(locationsLayerSourceId, 'circle-color', [
    'match',
    ['get', 'locationId'],
    locationId,
    '#0c1e38', // color for selected location
    '#dfdfdf', // default color
  ])
  map.value.setPaintProperty(locationsLayerSourceId, 'circle-stroke-color', [
    'match',
    ['get', 'locationId'],
    locationId,
    'white', // stroke color for selected location
    'black', // default stroke color
  ])
  map.value.setPaintProperty(locationsLayerSourceId, 'circle-radius', [
    'match',
    ['get', 'locationId'],
    locationId,
    7, // radius for selected location
    5, // default radius
  ]),
    map.value.setPaintProperty(locationsLayerSourceId, 'circle-opacity', [
      'match',
      ['get', 'locationId'],
      locationId,
      0.8,
      0.5,
    ]),
    map.value.setLayoutProperty(locationsLayerSourceId, 'circle-sort-key', [
      'match',
      ['get', 'locationId'],
      locationId,
      2,
      1,
    ])
}

function onLocationClick(event: MapLayerMouseEvent | MapLayerTouchEvent): void {
  emit('click', event)
}
</script>

<style scoped>
.locations-layer__chip {
  position: absolute;
  font-size: 0.825em;
  z-index: 1000;
  top: 10px;
  left: 10px;
  backdrop-filter: blur(5px);
  background-color: rgba(var(--v-theme-surface), 0.8);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}
</style>
