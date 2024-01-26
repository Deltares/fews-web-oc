<template>
  <mgl-geo-json-source source-id="geo" :data="props.locationsGeoJson">
    <mgl-circle-layer :layer-id="locationsLayerSourceId" :paint="paintSpecification" />
  </mgl-geo-json-source>
</template>

<script setup lang="ts">
import { MglCircleLayer, useMap } from 'vue-maplibre-gl'
import { MglGeoJsonSource } from 'vue-maplibre-gl'
import { FeatureCollection, Geometry } from 'geojson'
import { type Location } from '@deltares/fews-pi-requests'
import { MapLayerMouseEvent, MapLayerTouchEvent } from 'maplibre-gl';
import { watchEffect } from 'vue';

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

const paintSpecification = {
  'circle-radius': 5,
  'circle-color': '#dfdfdf',
  'circle-opacity': 0.75,
  'circle-stroke-color': 'black',
  'circle-stroke-width': 1.5,
}

const { map } = useMap()

const locationsLayerSourceId = 'location-layer'

if (map !== undefined) {
  map.on('click', locationsLayerSourceId, (e) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: [locationsLayerSourceId],
    })
    if (!features.length) return
    onLocationClick(e)
  })

  map.on('mouseenter', locationsLayerSourceId, () => {
    map.getCanvas().style.cursor = 'pointer'
  })

  map.on('mouseleave', 'location-layer', () => {
    map.getCanvas().style.cursor = ''
  })
}


watchEffect(() => {
  highlightSelectedLocationOnMap()
})

function highlightSelectedLocationOnMap() {
  if (map === undefined || !map.getSource(locationsLayerSourceId)) return

  // Set color to default if no layer is available
  const locationId = props.selectedLocationId ?? 'noLayerSelected'
  map.setPaintProperty(locationsLayerSourceId, 'circle-color', [
    'match',
    ['get', 'locationId'],
    locationId,
    '#0c1e38', // color for selected location
    '#dfdfdf', // default color
  ])
  map.setPaintProperty(locationsLayerSourceId, 'circle-stroke-color', [
    'match',
    ['get', 'locationId'],
    locationId,
    'white', // stroke color for selected location
    'black', // default stroke color
  ])
  map.setPaintProperty(locationsLayerSourceId, 'circle-radius', [
    'match',
    ['get', 'locationId'],
    locationId,
    7, // radius for selected location
    5, // default radius
  ]),
    map.setLayoutProperty(locationsLayerSourceId, 'circle-sort-key', [
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
