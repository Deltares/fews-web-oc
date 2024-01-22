<template>
  <MapboxLayer id="location-layer" :options="defaultLocationsLayerOptions" />
</template>

<script setup lang="ts">
import { Ref, watch, watchEffect } from 'vue'
import { MapboxLayer, useMap } from '@studiometa/vue-mapbox-gl'
import { FeatureCollection, Geometry } from 'geojson'
import { type Location } from '@deltares/fews-pi-requests'
import {
  Map,
  GeoJSONSource,
  type MapLayerMouseEvent,
  type MapLayerTouchEvent,
  type CircleLayer,
} from 'mapbox-gl'

interface Props {
  locationsGeoJson: FeatureCollection<Geometry, Location>
  selectedLocationId: string | null
}

const props = withDefaults(defineProps<Props>(), {
  locationsGeoJson: () => ({
    type: 'FeatureCollection',
    features: [],
  }),
  selectedLocationId: null,
})

const emit = defineEmits(['click'])

const defaultLocationsLayerOptions: CircleLayer = {
  id: 'location-layer',
  type: 'circle',
  source: {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [],
    },
  },
  layout: {
    visibility: 'visible',
  },
  paint: {
    'circle-radius': 5,
    'circle-color': '#dfdfdf',
    'circle-opacity': 0.75,
    'circle-stroke-color': 'black',
    'circle-stroke-width': 1.5,
  },
}

const { map } = useMap() as { map: Ref<Map> }

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

watchEffect(() => {
  highlightSelectedLocationOnMap()
})

watchEffect(
  () => {
    const source = map.value.getSource(locationsLayerSourceId) as GeoJSONSource
    if (source) {
      source.setData(props.locationsGeoJson)
    }
  },
)

function highlightSelectedLocationOnMap() {
  if (!map.value.getSource(locationsLayerSourceId)) return

  // Set color to default if no layer is available
  const locationId = props.selectedLocationId ?? 'noLayerSelected'
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
