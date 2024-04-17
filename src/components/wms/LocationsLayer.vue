<template>
  <mgl-geo-json-source
    :source-id="locationsSourceId"
    :data="props.locationsGeoJson"
  >
    <mgl-symbol-layer
      :layer-id="locationsSymbolLayerId"
      :layout="layoutSymbolSpecification"
      :paint="paintSymbolSpecification"
    />
    <mgl-circle-layer
      :layer-id="locationsCircleLayerId"
      :paint="paintCircleSpecification"
    />
  </mgl-geo-json-source>
</template>

<script setup lang="ts">
import {
  MglCircleLayer,
  MglSymbolLayer,
  MglGeoJsonSource,
  useMap,
} from 'vue-maplibre-gl'
import { FeatureCollection, Geometry } from 'geojson'
import { type Location } from '@deltares/fews-pi-requests'
import {
  MapLayerMouseEvent,
  MapLayerTouchEvent,
  MapSourceDataEvent,
} from 'maplibre-gl'
import { watch, onBeforeUnmount } from 'vue'
import { onBeforeMount } from 'vue'
import { addLocationIconsToMap } from '@/lib/location-icons'

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

const layoutSymbolSpecification = {
  'icon-allow-overlap': true,
  'symbol-sort-key': 1,
}

const defaultOpacity = 0.75

const paintSymbolSpecification = {
  'icon-opacity': defaultOpacity,
}

const paintCircleSpecification = {
  'circle-radius': 5,
  'circle-color': '#dfdfdf',
  'circle-opacity': defaultOpacity,
  'circle-stroke-color': 'black',
  'circle-stroke-width': 1.5,
}

const { map } = useMap()

const locationsCircleLayerId = 'location-circle-layer'
const locationsSymbolLayerId = 'location-symbol-layer'
const locationsSourceId = 'location-source'

watch(
  () => props.locationsGeoJson,
  () => {
    addLocationIcons()
  },
)

function addLocationIcons() {
  if (map) addLocationIconsToMap(map, props.locationsGeoJson)
}

function clickHandler(event: MapLayerMouseEvent | MapLayerTouchEvent): void {
  if (map) {
    const features = map.queryRenderedFeatures(event.point, {
      layers: [locationsSymbolLayerId, locationsCircleLayerId],
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
    for (const layerId of [locationsCircleLayerId, locationsSymbolLayerId]) {
      map.on('click', layerId, clickHandler)
      map.on('mouseenter', layerId, setCursorPointer)
      map.on('mouseleave', layerId, unsetCursorPointer)
    }
    map.on('sourcedata', sourceDateLoaded)
  }
  addLocationIcons()
})

onBeforeUnmount(() => {
  if (map) {
    for (const layerId of [locationsCircleLayerId, locationsSymbolLayerId]) {
      map.off('click', layerId, clickHandler)
      map.off('mouseenter', layerId, setCursorPointer)
      map.off('mouseleave', layerId, unsetCursorPointer)
    }
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

  // Move the selected location from the symbol layer to the circle layer, or vice versa
  map.setFilter(locationsSymbolLayerId, [
    'any',
    ['has', 'iconName'],
    ['==', 'locationId', locationId],
  ])
  map.setFilter(locationsCircleLayerId, [
    'all',
    ['!has', 'iconName'],
    ['!=', 'locationId', locationId],
  ])

  // Set the icon for the selected location
  map.setLayoutProperty(locationsSymbolLayerId, 'icon-image', [
    'match',
    ['get', 'locationId'],
    locationId,
    'selected-location', // icon for selected location
    ['get', 'iconName'], // default icon
  ])
  map.setLayoutProperty(locationsSymbolLayerId, 'icon-anchor', [
    'match',
    ['get', 'locationId'],
    locationId,
    'bottom', // The bottom of the map-marker, used for the selected location, should point to the location
    'center', // Default anchor for icons
  ])
  map.setLayoutProperty(locationsSymbolLayerId, 'icon-size', [
    'match',
    ['get', 'locationId'],
    locationId,
    0.1, // size of the map-marker, which is used for the selected location
    1, // default size
  ])
  map.setLayoutProperty(locationsSymbolLayerId, 'symbol-sort-key', [
    'match',
    ['get', 'locationId'],
    locationId,
    2, // sort key for selected location
    1, // default sort key
  ])
}

function onLocationClick(event: MapLayerMouseEvent | MapLayerTouchEvent): void {
  emit('click', event)
}
</script>
