<template>
  <mgl-geo-json-source
    :source-id="locationsSourceId"
    :data="props.locationsGeoJson"
  >
    <mgl-circle-layer
      :layer-id="locationsLayerId"
      :paint="paintSpecification"
    />
  </mgl-geo-json-source>
</template>

<script setup lang="ts">
import { MglCircleLayer, MglGeoJsonSource, useMap } from 'vue-maplibre-gl'
import { FeatureCollection, Geometry } from 'geojson'
import { type Location } from '@deltares/fews-pi-requests'
import {
  MapLayerMouseEvent,
  MapLayerTouchEvent,
  MapSourceDataEvent,
} from 'maplibre-gl'
import { watch, onBeforeUnmount } from 'vue'
import { onBeforeMount } from 'vue'

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

const locationsLayerId = 'location-layer'
const locationsSourceId = 'location-source'

function clickHandler(event: MapLayerMouseEvent | MapLayerTouchEvent): void {
  if (map) {
    const features = map.queryRenderedFeatures(event.point, {
      layers: [locationsLayerId],
    })
    if (!features.length) return
    onLocationClick(event)
  }
}

function setCursorPointer() {
  if (map) map.getCanvas().style.cursor = 'pointer'
}

function unsetCursorPointer() {
  if (map) map.getCanvas().style.cursor = ''
}

function sourceDateLoaded(e: MapSourceDataEvent) {
  if (e.sourceId === locationsSourceId && e.sourceDataType === 'metadata') {
    highlightSelectedLocationOnMap()
  }
}

onBeforeMount(() => {
  if (map) {
    map.on('click', locationsLayerId, clickHandler)
    map.on('mouseenter', locationsLayerId, setCursorPointer)
    map.on('mouseleave', locationsLayerId, unsetCursorPointer)
    map.on('sourcedata', sourceDateLoaded)
  }
})

onBeforeUnmount(() => {
  if (map) {
    map.off('click', locationsLayerId, clickHandler)
    map.off('mouseenter', locationsLayerId, setCursorPointer)
    map.off('mouseleave', locationsLayerId, unsetCursorPointer)
    map.off('sourcedata', sourceDateLoaded)
  }
})

watch(
  () => props.selectedLocationId,
  () => {
    highlightSelectedLocationOnMap()
  },
)

function highlightSelectedLocationOnMap() {
  if (!map?.getSource(locationsSourceId)) return
  const locationId = props.selectedLocationId ?? 'noLayerSelected'
  map.setPaintProperty(locationsLayerId, 'circle-color', [
    'match',
    ['get', 'locationId'],
    locationId,
    '#0c1e38', // color for selected location
    '#dfdfdf', // default color
  ])
  map.setPaintProperty(locationsLayerId, 'circle-stroke-color', [
    'match',
    ['get', 'locationId'],
    locationId,
    'white', // stroke color for selected location
    'black', // default stroke color
  ])
  map.setPaintProperty(locationsLayerId, 'circle-radius', [
    'match',
    ['get', 'locationId'],
    locationId,
    7, // radius for selected location
    5, // default radius
  ]),
    map.setLayoutProperty(locationsLayerId, 'circle-sort-key', [
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
